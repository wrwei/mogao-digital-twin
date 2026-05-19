/**
 * Web Worker for texture deterioration processing
 * Offloads per-pixel operations from the main thread.
 *
 * Chemical pigment fading (Strlič framework), pigment-aware:
 * saturated pixels (intact pigment) degrade faster than
 * desaturated pixels (bare clay/stone substrate).
 *
 * The lifetime / mould / salt / fatigue models render in
 * ModelViewer's dedicated _apply*Effect methods, not here.
 */
self.onmessage = function(e) {
    const { pixelData, width, height, degradationFactor, amplification } = e.data;

    const visualDeg = 1 - Math.pow(degradationFactor, amplification);

    const data = new Uint8ClampedArray(pixelData);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // ── Chemical pigment fading ──────────────────────────────
        // Calculate pixel saturation (0 = gray/clay, 1 = vivid pigment)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;
        const saturation = maxC > 0 ? chroma / maxC : 0;

        // Pigment-aware: bare clay barely changes, pigmented areas fade fully
        const pigmentFactor = 0.1 + 0.9 * saturation;
        const pixelDeg = visualDeg * pigmentFactor;
        const fadeFactor = 1 - pixelDeg;

        // Fade toward warm clay/substrate tone
        r = r * fadeFactor + 180 * pixelDeg;
        g = g * fadeFactor + 170 * pixelDeg;
        b = b * fadeFactor + 155 * pixelDeg;

        // Yellowing proportional to pigment presence
        const yellowShift = pixelDeg * 15;
        r = Math.min(255, r + yellowShift);
        g = Math.min(255, g + yellowShift * 0.7);
        b = Math.max(0, b - yellowShift * 0.5);

        data[i] = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
        // Alpha unchanged
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};
