/**
 * Per-pigment texture deterioration worker
 * Applies region-aware fading based on pigment class.
 * Each pigment fades toward its fadedRGB and (optionally) gets a
 * pigment-specific secondary ageing tint expressed as (amount, dR, dG, dB)
 * coefficients on the PigmentDatabase entry.
 *
 * Input:
 *   pixelData      - ArrayBuffer (RGBA Uint8)
 *   pigmentMap     - ArrayBuffer (Uint8, per-pixel class index)
 *   pigmentParams  - { [classId]: { degradationFactor, targetRGB, fadedRGB,
 *                                   agingTint?: { amount, dR, dG, dB } } }
 *   width, height
 *   amplification
 *
 * Output:
 *   pixelData - ArrayBuffer (processed RGBA)
 */
self.onmessage = function (e) {
    const { pixelData, pigmentMap, pigmentParams, width, height, amplification } = e.data;

    const data = new Uint8ClampedArray(pixelData);
    const pmap = pigmentMap ? new Uint8Array(pigmentMap) : null;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        const off = i * 4;
        const cls = pmap ? pmap[i] : 0;
        const params = pigmentParams[cls] || pigmentParams[0] || { degradationFactor: 1 };

        const df = params.degradationFactor;
        const visualDeg = 1 - Math.pow(df, amplification);
        const fadeFactor = 1 - visualDeg;

        const fadedR = params.fadedRGB ? params.fadedRGB[0] : 180;
        const fadedG = params.fadedRGB ? params.fadedRGB[1] : 170;
        const fadedB = params.fadedRGB ? params.fadedRGB[2] : 155;

        let r = data[off];
        let g = data[off + 1];
        let b = data[off + 2];

        // Blend toward pigment-specific faded colour
        r = r * fadeFactor + fadedR * (1 - fadeFactor);
        g = g * fadeFactor + fadedG * (1 - fadeFactor);
        b = b * fadeFactor + fadedB * (1 - fadeFactor);

        // Secondary ageing tint from the Database entry (vermilion darkens,
        // azurite greens, lead white yellows, etc.). Pigments without an
        // agingTint field get no secondary effect.
        const tint = params.agingTint;
        if (tint) {
            const delta = visualDeg * tint.amount;
            r = Math.max(0, Math.min(255, r + delta * tint.dR));
            g = Math.max(0, Math.min(255, g + delta * tint.dG));
            b = Math.max(0, Math.min(255, b + delta * tint.dB));
        }

        data[off] = Math.round(r);
        data[off + 1] = Math.round(g);
        data[off + 2] = Math.round(b);
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};
