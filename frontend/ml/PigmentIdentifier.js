/**
 * Pigment Identifier
 * Segments a texture image into pigment regions using HSV colour-space
 * classification tuned for Dunhuang pigments.
 *
 * Output: per-pixel pigment class ID (Uint8Array) matching PIGMENT_DATABASE keys.
 */
import { PIGMENT_DATABASE, PIGMENT_NAMES, NUM_CLASSES } from './PigmentDatabase.js';

export class PigmentIdentifier {
    constructor() {
        this.ready = false;
    }

    /**
     * Identify pigments in the texture.
     * @param {Uint8ClampedArray} pixelData - RGBA pixel array
     * @param {number} width
     * @param {number} height
     * @returns {{ pigmentMap: Uint8Array, pigmentNames: string[], confidence: Float32Array, regionSummary: object[] }}
     */
    async identify(pixelData, width, height) {
        this.ready = true;
        // Yield to the event loop so Vue can render the loading overlay
        // before starting the (blocking) per-pixel classification loop.
        await new Promise(resolve => setTimeout(resolve, 0));
        const { pigmentMap, confidence } = this._inferHeuristic(pixelData, width, height);

        // Build region summary
        const counts = new Uint32Array(NUM_CLASSES);
        const totalPixels = width * height;
        for (let i = 0; i < totalPixels; i++) counts[pigmentMap[i]]++;

        const regionSummary = PIGMENT_NAMES.map((name, idx) => ({
            pigmentName: name,
            displayName: PIGMENT_DATABASE[name].displayName,
            displayZh: PIGMENT_DATABASE[name].displayZh,
            displayEn: PIGMENT_DATABASE[name].displayEn,
            pixelCount: counts[idx],
            percentage: ((counts[idx] / totalPixels) * 100).toFixed(1),
            color: PIGMENT_DATABASE[name].targetRGB
        })).filter(r => r.pixelCount > 0);

        return { pigmentMap, pigmentNames: PIGMENT_NAMES, confidence, regionSummary };
    }

    // ── HSV Heuristic ────────────────────────────────────────────────
    _inferHeuristic(pixelData, width, height) {
        const totalPixels = width * height;
        const pigmentMap = new Uint8Array(totalPixels);
        const confidence = new Float32Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
            const off = i * 4;
            const r = pixelData[off];
            const g = pixelData[off + 1];
            const b = pixelData[off + 2];

            const { h, s, v } = this._rgbToHsv(r, g, b);
            let cls = 0;  // background
            let conf = 0.4;

            // Ordering matters: check most distinctive signatures first.
            // Thresholds are deliberately conservative — only classify a pixel as
            // a specific pigment when the colour signal is unambiguous.
            // Low-saturation and neutral tones stay as "background" (class 0).
            if (s < 0.06 && v < 0.12) {
                cls = 7; conf = 0.7; // carbon black — very dark, achromatic
            } else if (s < 0.08 && v > 0.75) {
                cls = 4; conf = 0.6; // lead white — bright, achromatic
            } else if (h >= 35 && h < 60 && s > 0.50 && v > 0.50) {
                cls = 5; conf = 0.7; // gold leaf — saturated yellow
            } else if ((h >= 345 || h < 15) && s > 0.35 && v > 0.30) {
                // Red family — high saturation required
                if (s > 0.50) {
                    cls = 3; conf = 0.65; // vermilion — vivid red
                } else {
                    cls = 6; conf = 0.55; // red ochre — muted red
                }
            } else if (h >= 15 && h < 40 && s > 0.30 && v > 0.25) {
                cls = 6; conf = 0.5; // red ochre (brownish-orange)
            } else if (h >= 90 && h < 165 && s > 0.25 && v > 0.20) {
                cls = 2; conf = 0.6; // malachite — needs clear green signal
            } else if (h >= 195 && h < 255 && s > 0.25 && v > 0.20) {
                cls = 1; conf = 0.6; // azurite — needs clear blue signal
            }

            pigmentMap[i] = cls;
            confidence[i] = conf;
        }

        return { pigmentMap, confidence };
    }

    // ── Utility ──────────────────────────────────────────────────────
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

    dispose() {
        // No resources to release (heuristic-only)
    }
}
