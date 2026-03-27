/**
 * Web Worker for texture deterioration processing
 * Offloads per-pixel operations from the main thread
 */
self.onmessage = function(e) {
    const { pixelData, width, height, degradationFactor, amplification } = e.data;

    // Apply visual amplification
    const visualDeg = 1 - Math.pow(degradationFactor, amplification);
    const fadeFactor = 1 - visualDeg;

    const data = new Uint8ClampedArray(pixelData);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply fading (desaturation toward warm gray)
        r = Math.round(r * fadeFactor + 180 * (1 - fadeFactor));
        g = Math.round(g * fadeFactor + 170 * (1 - fadeFactor));
        b = Math.round(b * fadeFactor + 155 * (1 - fadeFactor));

        // Yellowing effect
        const yellowShift = visualDeg * 15;
        r = Math.min(255, r + yellowShift);
        g = Math.min(255, g + yellowShift * 0.7);
        b = Math.max(0, b - yellowShift * 0.5);

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // Alpha unchanged
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};
