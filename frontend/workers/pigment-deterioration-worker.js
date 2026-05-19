/**
 * Per-pigment texture deterioration worker
 * Applies region-aware fading based on pigment class.
 * Each pigment fades differently: vermilion darkens, azurite greens, lead white yellows, etc.
 *
 * Input:
 *   pixelData      - ArrayBuffer (RGBA Uint8)
 *   pigmentMap     - ArrayBuffer (Uint8, per-pixel class index)
 *   pigmentParams  - { [classId]: { degradationFactor, targetRGB, fadedRGB } }
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

        // Fading target differs per pigment (e.g., vermilion darkens, azurite greens)
        const fadedR = params.fadedRGB ? params.fadedRGB[0] : 180;
        const fadedG = params.fadedRGB ? params.fadedRGB[1] : 170;
        const fadedB = params.fadedRGB ? params.fadedRGB[2] : 155;

        // Use the *original* targetRGB as the starting colour reference
        // The current pixel is already partially faded; we blend from original toward faded
        let r = data[off];
        let g = data[off + 1];
        let b = data[off + 2];

        // Blend toward pigment-specific faded colour
        r = Math.round(r * fadeFactor + fadedR * (1 - fadeFactor));
        g = Math.round(g * fadeFactor + fadedG * (1 - fadeFactor));
        b = Math.round(b * fadeFactor + fadedB * (1 - fadeFactor));

        // Subtle per-pigment ageing tints (secondary effect on top of the blend)
        if (cls === 3) {
            // Vermilion: slight darkening (meta-cinnabar conversion)
            const darken = visualDeg * 12;
            r = Math.max(0, r - darken);
            g = Math.max(0, g - darken * 0.6);
            b = Math.max(0, b - darken * 0.4);
        } else if (cls === 1) {
            // Azurite: slight green shift (CuO formation)
            const shift = visualDeg * 8;
            g = Math.min(255, g + shift * 0.4);
            b = Math.max(0, b - shift * 0.2);
        } else if (cls === 4) {
            // Lead white: slight yellowing
            const yellow = visualDeg * 10;
            r = Math.min(255, r + yellow);
            g = Math.min(255, g + yellow * 0.5);
            b = Math.max(0, b - yellow * 0.4);
        }

        data[off] = r;
        data[off + 1] = g;
        data[off + 2] = b;
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};
