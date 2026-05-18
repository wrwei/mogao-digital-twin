/**
 * Web Worker for texture deterioration processing
 * Offloads per-pixel operations from the main thread
 *
 * Two deterioration effects applied per pixel:
 *
 * 1. Chemical pigment fading (Strlič framework)
 *    Pigment-aware: saturated pixels (intact pigment) degrade faster
 *    than desaturated pixels (bare clay/stone substrate).
 *
 * 2. Lifetime aging (Michalski eLM)
 *    General surface weathering: contrast loss, overall darkening,
 *    and warm patina accumulation proportional to effective age.
 */
self.onmessage = function(e) {
    const { pixelData, width, height, degradationFactor, amplification,
            lifetimeAgingFactor } = e.data;

    // Chemical: base visual degradation level
    const visualDeg = 1 - Math.pow(degradationFactor, amplification);

    // Lifetime: aging intensity (0 = no aging, 1 = max weathering)
    const aging = lifetimeAgingFactor || 0;

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

        // ── Lifetime aging (Michalski) — pigment-aware ───────────
        if (aging > 0) {
            // Pigmented areas age more visibly; bare clay/stone is inert
            // pigmentFactor already computed above: 0.1 (clay) to 1.0 (pigment)
            const lifetimeEffect = aging * pigmentFactor;

            // 1. Desaturation — pigments lose vibrancy over time
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const desatAmount = lifetimeEffect * 0.6;
            r = r + (gray - r) * desatAmount;
            g = g + (gray - g) * desatAmount;
            b = b + (gray - b) * desatAmount;

            // 2. Overall darkening — grime accumulates more on pigmented surfaces
            const darken = 1 - lifetimeEffect * 0.35;
            r *= darken;
            g *= darken;
            b *= darken;

            // 3. Warm patina — oxidation tint on pigmented areas
            const patina = lifetimeEffect * 20;
            r = Math.min(255, r + patina * 0.5);
            g = Math.min(255, g + patina * 0.15);
            b = Math.max(0, b - patina * 0.6);
        }

        data[i] = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
        // Alpha unchanged
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};
