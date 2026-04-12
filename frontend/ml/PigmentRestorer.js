/**
 * Pigment Restorer
 * Reconstructs the original vibrant colours of a heritage artefact's texture.
 *
 * Two modes:
 *   1. Heuristic (default) — per-pigment colour correction using PigmentDatabase target colours.
 *   2. TF.js model — U-Net encoder-decoder (when trained weights exist).
 *
 * Requires pigmentMap from PigmentIdentifier for the heuristic mode.
 */
import { PIGMENT_DATABASE, PIGMENT_NAMES, NUM_CLASSES } from './PigmentDatabase.js';

export class PigmentRestorer {
    constructor() {
        this.model = null;
        this.mode = 'heuristic';
        this.ready = false;
    }

    async load() {
        if (window.tf) {
            try {
                this.model = await window.tf.loadLayersModel('ml/models/pigment-restorer/model.json');
                this.mode = 'tfjs';
                console.log('PigmentRestorer: loaded TF.js model');
            } catch (_) {
                console.log('PigmentRestorer: no trained model found, using colour-shift heuristic');
            }
        } else {
            console.log('PigmentRestorer: TF.js not available, using colour-shift heuristic');
        }
        this.ready = true;
    }

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
        if (!this.ready) await this.load();

        let restoredPixels;

        if (this.mode === 'tfjs' && this.model) {
            restoredPixels = await this._restoreTFJS(pixelData, width, height);
        } else {
            restoredPixels = this._restoreHeuristic(pixelData, width, height, pigmentMap, strength);
        }

        return { restoredPixels, width, height };
    }

    // ── Heuristic: per-pigment colour correction ─────────────────────
    _restoreHeuristic(pixelData, width, height, pigmentMap, strength) {
        const totalPixels = width * height;
        const out = new Uint8ClampedArray(pixelData.length);

        // Pre-compute pigment entries by ID for fast lookup
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

            // Blend current colour toward the pigment's original targetRGB
            const tr = entry.targetRGB[0];
            const tg = entry.targetRGB[1];
            const tb = entry.targetRGB[2];

            // Adaptive strength: pixels further from target get stronger correction
            const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2) / 441; // max dist ≈ 441
            const adaptive = strength * (0.5 + 0.5 * dist);

            // Also boost saturation toward the original
            const { h, s, v } = this._rgbToHsv(r, g, b);
            const { h: th, s: ts, v: tv } = this._rgbToHsv(tr, tg, tb);

            // Blend in HSV space for more natural results
            const nh = this._lerpAngle(h, th, adaptive * 0.7);
            const ns = s + (ts - s) * adaptive;
            const nv = v + (tv - v) * adaptive * 0.5; // less aggressive on value

            const [rr, rg, rb] = this._hsvToRgb(nh, Math.min(1, Math.max(0, ns)), Math.min(1, Math.max(0, nv)));

            out[off] = rr;
            out[off + 1] = rg;
            out[off + 2] = rb;
            out[off + 3] = a;
        }

        return out;
    }

    // ── TF.js inference (U-Net placeholder) ──────────────────────────
    async _restoreTFJS(pixelData, width, height) {
        const tf = window.tf;
        const inputSize = 256;

        // Resize
        const imgData = new ImageData(new Uint8ClampedArray(pixelData), width, height);
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = width;
        srcCanvas.height = height;
        srcCanvas.getContext('2d').putImageData(imgData, 0, 0);

        const canvas = document.createElement('canvas');
        canvas.width = inputSize;
        canvas.height = inputSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(srcCanvas, 0, 0, inputSize, inputSize);
        const resized = ctx.getImageData(0, 0, inputSize, inputSize);

        // Prepare tensor (RGB only, normalised to 0-1)
        const rgb = new Float32Array(inputSize * inputSize * 3);
        for (let i = 0; i < inputSize * inputSize; i++) {
            rgb[i * 3] = resized.data[i * 4] / 255;
            rgb[i * 3 + 1] = resized.data[i * 4 + 1] / 255;
            rgb[i * 3 + 2] = resized.data[i * 4 + 2] / 255;
        }
        const input = tf.tensor4d(rgb, [1, inputSize, inputSize, 3]);
        const output = this.model.predict(input);
        const restored = await output.data();

        // Upscale to original resolution via canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = inputSize;
        outCanvas.height = inputSize;
        const outCtx = outCanvas.getContext('2d');
        const outImgData = outCtx.createImageData(inputSize, inputSize);
        for (let i = 0; i < inputSize * inputSize; i++) {
            outImgData.data[i * 4] = Math.round(Math.min(1, Math.max(0, restored[i * 3])) * 255);
            outImgData.data[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, restored[i * 3 + 1])) * 255);
            outImgData.data[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, restored[i * 3 + 2])) * 255);
            outImgData.data[i * 4 + 3] = 255;
        }
        outCtx.putImageData(outImgData, 0, 0);

        // Scale to original size
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = width;
        fullCanvas.height = height;
        const fullCtx = fullCanvas.getContext('2d');
        fullCtx.drawImage(outCanvas, 0, 0, width, height);
        const fullData = fullCtx.getImageData(0, 0, width, height);

        input.dispose();
        output.dispose();

        return new Uint8ClampedArray(fullData.data);
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
        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
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

    dispose() {
        if (this.model) { this.model.dispose(); this.model = null; }
    }
}
