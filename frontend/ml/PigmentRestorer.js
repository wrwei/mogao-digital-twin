/**
 * Pigment Restorer
 * Reconstructs the estimated original vibrant colours of a heritage artefact's texture
 * using a database-driven per-pigment colour-shift approach.
 *
 * Method: for each texture pixel, look up the target chromaticity of its identified
 * pigment class (from PigmentDatabase — sourced from Dunhuang Academy conservation
 * literature and published XRF/Raman studies), then shift the pixel in HSV space
 * toward that target colour. Restoration intensity is controlled by the `strength`
 * parameter (0..1).
 *
 * References:
 *   - Tong et al. 2023, Digital technology virtual restoration of the colours and
 *     textures of polychrome Bodhidharma statue, npj Heritage Science 11:27.
 *   - Pan & Du 2022, Cave 254 pigment reconstruction, npj Heritage Science 10:98.
 *   - Dunhuang Academy & Getty Conservation Institute 2010, Conservation of Ancient
 *     Sites on the Silk Road.
 *
 * Note on ML approach: A U-Net inpainting model trained on the MuralDH dataset was
 * attempted but produced poor results due to domain mismatch (2D murals vs 3D
 * sculpture UV maps). No public dataset of paired (aged, original) sculpture
 * textures exists; establishing ground truth requires physical pigment analysis
 * on a per-object basis, as done in Tong et al. 2023.
 */
import { PIGMENT_DATABASE, PIGMENT_NAMES, NUM_CLASSES } from './PigmentDatabase.js';

export class PigmentRestorer {
    constructor() {
        this.ready = true;
        this.mode = 'pigment-database';
    }

    async load() { /* no-op — no model to load */ }

    /**
     * Restore the texture to its estimated original colours.
     * @param {Uint8ClampedArray} pixelData  – RGBA pixels of the current (faded) texture
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} pigmentMap – per-pixel pigment class IDs (from PigmentIdentifier)
     * @param {number} strength – restoration intensity 0..1 (default 0.65)
     * @returns {{ restoredPixels: Uint8ClampedArray, width: number, height: number }}
     */
    async restore(pixelData, width, height, pigmentMap, strength = 0.65) {
        // Yield to the event loop so Vue can render the loading overlay
        // before starting the (blocking) pixel-level restoration loop.
        await new Promise(resolve => setTimeout(resolve, 0));
        const restoredPixels = this._restoreByPigmentDatabase(
            pixelData, width, height, pigmentMap, strength
        );
        return { restoredPixels, width, height };
    }

    // ── Per-pigment database-driven colour reconstruction ────────────
    _restoreByPigmentDatabase(pixelData, width, height, pigmentMap, strength) {
        const totalPixels = width * height;
        const out = new Uint8ClampedArray(pixelData.length);

        const pigmentEntries = new Array(NUM_CLASSES);
        for (const name of PIGMENT_NAMES) {
            const entry = PIGMENT_DATABASE[name];
            pigmentEntries[entry.id] = entry;
        }

        for (let i = 0; i < totalPixels; i++) {
            const off = i * 4;
            const cls = pigmentMap ? pigmentMap[i] : 0;
            const entry = pigmentEntries[cls];

            const r = pixelData[off];
            const g = pixelData[off + 1];
            const b = pixelData[off + 2];
            const a = pixelData[off + 3];

            const tr = entry.targetRGB[0];
            const tg = entry.targetRGB[1];
            const tb = entry.targetRGB[2];

            // Distance-adaptive strength: more degraded pixels get stronger correction
            const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2) / 441;
            const adaptive = strength * (0.5 + 0.5 * dist);

            const { h, s, v } = this._rgbToHsv(r, g, b);
            const { h: th, s: ts, v: tv } = this._rgbToHsv(tr, tg, tb);

            const nh = this._lerpAngle(h, th, adaptive * 0.7);
            const ns = s + (ts - s) * adaptive;
            const nv = v + (tv - v) * adaptive * 0.5;

            const [rr, rg, rb] = this._hsvToRgb(
                nh,
                Math.min(1, Math.max(0, ns)),
                Math.min(1, Math.max(0, nv))
            );

            out[off] = rr;
            out[off + 1] = rg;
            out[off + 2] = rb;
            out[off + 3] = a;
        }

        return out;
    }

    // ── Colour-space utilities ───────────────────────────────────────
    _rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        if (d !== 0) {
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
            else if (max === g) h = ((b - r) / d + 2) * 60;
            else h = ((r - g) / d + 4) * 60;
        }
        return { h, s, v };
    }

    _hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    _lerpAngle(a, b, t) {
        let diff = b - a;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        let result = a + diff * t;
        if (result < 0) result += 360;
        if (result >= 360) result -= 360;
        return result;
    }

    dispose() { /* no-op */ }
}
