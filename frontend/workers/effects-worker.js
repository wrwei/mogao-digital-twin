/**
 * Unified deterioration effects worker.
 *
 * Single Web Worker that applies every per-pixel deterioration effect
 * the application supports. The main thread sends a message with a
 * `mode` discriminator + the relevant payload; the worker mutates
 * a copy of the original RGBA buffer in place and returns it.
 *
 * Modes:
 *   - 'chemical-uniform'   — uniform fade toward warm-grey clay
 *   - 'chemical-pigment'   — per-pigment fade using pigmentMap + perPigmentParams
 *   - 'pigment-overlay'    — 50% translucent class-coloured overlay
 *   - 'mould'              — green-brown patches biased toward darker pixels
 *   - 'salt'               — white efflorescence speckle
 *   - 'lifetime'           — desaturation + warm cast proportional to intensity
 *   - 'fatigue'            — wandering craquelure + paint-loss patches at D≥2.5
 *
 * The non-pigment modes read `effect = visualEffect` from the
 * standardised model output ({ type, intensity, coverage, ...extras }).
 */

self.onmessage = function (e) {
    const { mode, pixelData, width, height } = e.data;
    const data = new Uint8ClampedArray(pixelData);

    switch (mode) {
        case 'chemical-uniform':
            applyChemicalUniform(data, width, height, e.data);
            break;
        case 'chemical-pigment':
            applyChemicalPigment(data, width, height, e.data);
            break;
        case 'pigment-overlay':
            applyPigmentOverlay(data, width, height, e.data);
            break;
        case 'mould':
            applyMould(data, width, height, e.data);
            break;
        case 'salt':
            applySalt(data, width, height, e.data);
            break;
        case 'lifetime':
            applyLifetime(data, width, height, e.data);
            break;
        case 'fatigue':
            applyFatigue(data, width, height, e.data);
            break;
        case 'composite':
            applyComposite(data, width, height, e.data);
            break;
        default:
            // Unknown mode: return the buffer unchanged. The renderer
            // treats this as a no-op (e.g. mode === 'reset' should not
            // even reach the worker).
            break;
    }

    self.postMessage({ pixelData: data.buffer, width, height }, [data.buffer]);
};

// ── Chemical (uniform) ──────────────────────────────────────────────────────
// Pigment-aware version of the legacy uniform-fade worker: pixels with high
// saturation (intact pigment) fade further toward warm clay than desaturated
// substrate pixels do.
function applyChemicalUniform(data, width, height, { degradationFactor, amplification = 10 }) {
    const visualDeg = 1 - Math.pow(degradationFactor, amplification);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;
        const pigmentFactor = 0.1 + 0.9 * saturation;  // 0.1 (substrate) → 1.0 (pigment)
        const pixelDeg = visualDeg * pigmentFactor;
        const fadeFactor = 1 - pixelDeg;

        r = r * fadeFactor + 180 * pixelDeg;
        g = g * fadeFactor + 170 * pixelDeg;
        b = b * fadeFactor + 155 * pixelDeg;

        const yellowShift = pixelDeg * 15;
        r = Math.min(255, r + yellowShift);
        g = Math.min(255, g + yellowShift * 0.7);
        b = Math.max(0, b - yellowShift * 0.5);

        data[i]     = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
    }
}

// ── Chemical (per-pigment) ──────────────────────────────────────────────────
function applyChemicalPigment(data, width, height, { pigmentMap, pigmentParams, amplification = 3 }) {
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

        r = r * fadeFactor + fadedR * (1 - fadeFactor);
        g = g * fadeFactor + fadedG * (1 - fadeFactor);
        b = b * fadeFactor + fadedB * (1 - fadeFactor);

        const tint = params.agingTint;
        if (tint) {
            const delta = visualDeg * tint.amount;
            r = Math.max(0, Math.min(255, r + delta * tint.dR));
            g = Math.max(0, Math.min(255, g + delta * tint.dG));
            b = Math.max(0, Math.min(255, b + delta * tint.dB));
        }

        data[off]     = Math.round(r);
        data[off + 1] = Math.round(g);
        data[off + 2] = Math.round(b);
    }
}

// ── Pigment overlay ─────────────────────────────────────────────────────────
function applyPigmentOverlay(data, width, height, { pigmentMap }) {
    if (!pigmentMap) return;
    const pmap = new Uint8Array(pigmentMap);
    const OVERLAY_COLORS = [
        [200, 180, 150], [0, 80, 180], [0, 140, 60], [200, 30, 15],
        [245, 240, 230], [212, 175, 55], [180, 70, 30], [15, 15, 15]
    ];
    const totalPixels = width * height;
    for (let i = 0; i < totalPixels; i++) {
        const cls = pmap[i];
        const c = OVERLAY_COLORS[cls] || OVERLAY_COLORS[0];
        const off = i * 4;
        data[off]     = Math.round(data[off]     * 0.5 + c[0] * 0.5);
        data[off + 1] = Math.round(data[off + 1] * 0.5 + c[1] * 0.5);
        data[off + 2] = Math.round(data[off + 2] * 0.5 + c[2] * 0.5);
    }
}

// ── Mould ───────────────────────────────────────────────────────────────────
// Spatially-coherent green-brown patches biased toward darker (more
// moisture-retentive) pixels. Patch density scales with mould index.
function applyMould(data, width, height, { effect }) {
    const coverage = effect && effect.coverage ? Math.min(1, effect.coverage) : 0;
    if (coverage <= 0) return;

    // Low-resolution noise grid for spatial coherence (32×32 patches)
    const G = 32;
    const noiseField = new Float32Array(G * G);
    for (let i = 0; i < G * G; i++) {
        noiseField[i] = ((i * 2654435761 + 42) >>> 0) / 4294967296;
    }
    // 3×3 box blur for soft patch edges
    const smoothed = new Float32Array(G * G);
    for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
            let sum = 0, count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < G && ny >= 0 && ny < G) {
                        sum += noiseField[ny * G + nx];
                        count++;
                    }
                }
            }
            smoothed[y * G + x] = sum / count;
        }
    }

    const scaleX = (G - 1) / width;
    const scaleY = (G - 1) / height;
    const threshold = 1 - coverage;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const off = (y * width + x) * 4;

            // Bilinear lookup into the smoothed noise field
            const gx = x * scaleX, gy = y * scaleY;
            const gx0 = Math.floor(gx), gy0 = Math.floor(gy);
            const fx = gx - gx0, fy = gy - gy0;
            const gx1 = Math.min(G - 1, gx0 + 1), gy1 = Math.min(G - 1, gy0 + 1);
            const n00 = smoothed[gy0 * G + gx0];
            const n01 = smoothed[gy0 * G + gx1];
            const n10 = smoothed[gy1 * G + gx0];
            const n11 = smoothed[gy1 * G + gx1];
            const ny0 = n00 * (1 - fx) + n01 * fx;
            const ny1 = n10 * (1 - fx) + n11 * fx;
            let noise = ny0 * (1 - fy) + ny1 * fy;

            // Bias toward darker (shadow / moisture) regions
            const r = data[off], g = data[off + 1], b = data[off + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            noise += (0.5 - brightness) * 0.3;

            if (noise > threshold) {
                const patchStrength = Math.min(1, (noise - threshold) / Math.max(0.05, 1 - threshold));
                const intensity = 0.35 + patchStrength * 0.55;
                const hueNoise = (((x * 37 + y * 41 + 17) >>> 0) % 100) / 100;
                const mouldR = 40 + hueNoise * 35;
                const mouldG = 55 + hueNoise * 30;
                const mouldB = 25 + hueNoise * 20;
                data[off]     = Math.round(r * (1 - intensity) + mouldR * intensity);
                data[off + 1] = Math.round(g * (1 - intensity) + mouldG * intensity);
                data[off + 2] = Math.round(b * (1 - intensity) + mouldB * intensity);
            }
        }
    }
}

// ── Salt efflorescence ──────────────────────────────────────────────────────
function applySalt(data, width, height, { effect }) {
    const coverage = effect && effect.coverage ? Math.min(1, effect.coverage) : 0;
    if (coverage <= 0) return;

    const seed = 137;
    const totalPixels = width * height;
    for (let i = 0; i < totalPixels; i++) {
        const noise = ((i * 2654435761 + seed) >>> 0) / 4294967296;
        if (noise < coverage) {
            const off = i * 4;
            const intensity = 0.4 + noise * 0.5;
            data[off]     = Math.round(data[off]     * (1 - intensity) + 230 * intensity);
            data[off + 1] = Math.round(data[off + 1] * (1 - intensity) + 225 * intensity);
            data[off + 2] = Math.round(data[off + 2] * (1 - intensity) + 220 * intensity);
        }
    }
}

// ── Lifetime (Michalski desaturation + warm cast) ───────────────────────────
function applyLifetime(data, width, height, { effect }) {
    const intensity = effect && effect.intensity ? Math.min(1, effect.intensity) : 0;
    if (intensity <= 0) return;

    const desaturate = intensity * 0.75;
    const yellowing  = intensity * 0.18;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        const off = i * 4;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        const grey = 0.299 * r + 0.587 * g + 0.114 * b;
        let nr = r * (1 - desaturate) + grey * desaturate;
        let ng = g * (1 - desaturate) + grey * desaturate;
        let nb = b * (1 - desaturate) + grey * desaturate;
        nr += yellowing * 22;
        ng += yellowing * 10;
        nb -= yellowing * 22;
        data[off]     = Math.max(0, Math.min(255, Math.round(nr)));
        data[off + 1] = Math.max(0, Math.min(255, Math.round(ng)));
        data[off + 2] = Math.max(0, Math.min(255, Math.round(nb)));
    }
}

// ── Fatigue craquelure + paint-loss flaking ─────────────────────────────────
function applyFatigue(data, width, height, { effect }) {
    if (!effect) return;
    const density = Math.min(1, effect.crackDensity || 0);
    const D = effect.cumulativeDamage || 0;
    if (density <= 0.01) return;

    const rand = (i) => ((i * 2654435761) >>> 0) / 4294967296;

    const minDim = Math.min(width, height);
    const totalCrackPixels = Math.round(density * width * height * 0.02);  // ~2% coverage at D=1
    const crackLen = Math.max(40, Math.round(minDim * 0.08));
    const numCracks = Math.max(30, Math.round(totalCrackPixels / crackLen));
    const darkness = 0.35 + density * 0.25;  // 0.35 → 0.60 range

    for (let k = 0; k < numCracks; k++) {
        let x = rand(k * 5 + 1) * width;
        let y = rand(k * 5 + 2) * height;
        let angle = rand(k * 5 + 3) * Math.PI * 2;
        const curveFreq = 0.04 + rand(k * 5 + 4) * 0.06;
        const curveAmp = 0.08 + rand(k * 5 + 7) * 0.12;

        for (let t = 0; t < crackLen; t++) {
            angle += Math.sin(t * curveFreq + k) * curveAmp - curveAmp * 0.5;
            x += Math.cos(angle);
            y += Math.sin(angle);
            const px = Math.round(x);
            const py = Math.round(y);
            if (px < 0 || px >= width || py < 0 || py >= height) break;
            const off = (py * width + px) * 4;
            data[off]     = Math.max(0, Math.round(data[off]     * (1 - darkness)));
            data[off + 1] = Math.max(0, Math.round(data[off + 1] * (1 - darkness)));
            data[off + 2] = Math.max(0, Math.round(data[off + 2] * (1 - darkness)));

            // Occasional short branch — Y / T junctions
            if (t > 10 && t < crackLen - 10 && rand(k * 1009 + t) < 0.004) {
                const branchAngle = angle + (rand(k * 2003 + t) - 0.5) * 1.6;
                const branchLen = Math.round(crackLen * 0.15);
                let bx = x, by = y;
                for (let s = 0; s < branchLen; s++) {
                    bx += Math.cos(branchAngle);
                    by += Math.sin(branchAngle);
                    const bpx = Math.round(bx);
                    const bpy = Math.round(by);
                    if (bpx < 0 || bpx >= width || bpy < 0 || bpy >= height) break;
                    const boff = (bpy * width + bpx) * 4;
                    data[boff]     = Math.max(0, Math.round(data[boff]     * (1 - darkness)));
                    data[boff + 1] = Math.max(0, Math.round(data[boff + 1] * (1 - darkness)));
                    data[boff + 2] = Math.max(0, Math.round(data[boff + 2] * (1 - darkness)));
                }
            }
        }
    }

    // At severe damage (D ≥ 2.5), add paint-loss patches (substrate showing through)
    if (D >= 2.5) {
        const lossFactor = Math.min(1, (D - 2.5) / 1.5);
        const numPatches = Math.round(lossFactor * 40);
        const patchRadius = Math.max(3, Math.round(minDim / 200));
        const substrateR = 190, substrateG = 170, substrateB = 145;
        for (let p = 0; p < numPatches; p++) {
            const cx = Math.floor(rand(p * 11 + 7) * width);
            const cy = Math.floor(rand(p * 11 + 13) * height);
            const radius = patchRadius + Math.round(rand(p * 11 + 17) * patchRadius);
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const d2 = dx * dx + dy * dy;
                    if (d2 > radius * radius) continue;
                    const px = cx + dx, py = cy + dy;
                    if (px < 0 || px >= width || py < 0 || py >= height) continue;
                    const edgeFade = 1 - Math.sqrt(d2) / radius;
                    const blend = edgeFade * 0.85;
                    const off = (py * width + px) * 4;
                    data[off]     = Math.round(data[off]     * (1 - blend) + substrateR * blend);
                    data[off + 1] = Math.round(data[off + 1] * (1 - blend) + substrateG * blend);
                    data[off + 2] = Math.round(data[off + 2] * (1 - blend) + substrateB * blend);
                }
            }
        }
    }
}

// ── Composite (paper Eq. eq:composite) ──────────────────────────────────────
// Layers all five mechanism signatures onto one texture. Each layer reuses its
// own single-model effect function and is applied in ascending order of its
// normalised sub-index, so the mechanism that dominates the composite index is
// composited last and reads strongest. The per-mechanism visualEffects and the
// components map (chemical/lifetime/mould/salt/fatigue in [0,1]) are supplied by
// the backend compositeRisk() output threaded through renderCommand.
function applyComposite(data, width, height, payload) {
    const { effects = {}, components = {}, degradationFactor = 1, pigmentMap, pigmentParams } = payload;

    // Stage-2: if baked driver maps + a backend lookup grid are supplied, paint
    // a genuine per-texel spatial risk field instead of the whole-object layer.
    if (payload.spatial && payload.driverMaps && payload.grid) {
        applyCompositeSpatial(data, width, height, payload);
        return;
    }

    // Order the five mechanisms by ascending contribution; skip negligible ones.
    const order = Object.entries(components)
        .filter(([, v]) => v > 0.02)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k);

    for (const mech of order) {
        switch (mech) {
            case 'chemical':
                // Prefer the pigment-aware fade when a pigment map is present.
                if (pigmentMap && pigmentParams) {
                    applyChemicalPigment(data, width, height, { pigmentMap, pigmentParams, amplification: 3 });
                } else {
                    applyChemicalUniform(data, width, height, { degradationFactor, amplification: 10 });
                }
                break;
            case 'lifetime':
                applyLifetime(data, width, height, { effect: effects.lifetime });
                break;
            case 'mould':
                applyMould(data, width, height, { effect: effects.mould });
                break;
            case 'salt':
                applySalt(data, width, height, { effect: effects.saltCryst });
                break;
            case 'fatigue':
                applyFatigue(data, width, height, { effect: effects.fatigue });
                break;
            default:
                break;
        }
    }
}

// ── Composite (Stage-2 per-texel spatial field) ─────────────────────────────
// Paints a spatial deterioration-risk field: for each texel, read the baked
// height + illumination from the driver maps, bilinearly sample the backend
// (height × illumination) composite lookup grid, and blend the base colour
// toward a blue→yellow→red risk ramp. The texture and the driver maps share
// the model's UV layout, so a texel at (u,v) reads the same (u,v) in each map
// (nearest-sampled when the map resolution differs from the texture).
function applyCompositeSpatial(data, width, height, payload) {
    const { driverMaps, grid } = payload;
    const hMap = new Uint8Array(driverMaps.height);
    const ilMap = new Uint8Array(driverMaps.illum);
    const mw = driverMaps.width, mh = driverMaps.mapHeight;
    const nH = grid.nH, nL = grid.nL, gval = grid.value;

    // Blue (low) -> yellow (mid) -> red (high) risk ramp.
    const ramp = (r) => {
        if (r <= 0.5) { const t = r / 0.5;  return [Math.round(40 + t * 215), Math.round(90 + t * 165), Math.round(200 - t * 160)]; }
        const t = (r - 0.5) / 0.5;          return [255, Math.round(255 - t * 215), Math.round(40 - t * 40)];
    };
    // Bilinear sample of the composite grid at (h, il) in [0,1].
    const sampleGrid = (h, il) => {
        const fh = h * (nH - 1), fl = il * (nL - 1);
        const h0 = Math.floor(fh), l0 = Math.floor(fl);
        const h1 = Math.min(h0 + 1, nH - 1), l1 = Math.min(l0 + 1, nL - 1);
        const dh = fh - h0, dl = fl - l0;
        const v00 = gval[h0][l0], v01 = gval[h0][l1], v10 = gval[h1][l0], v11 = gval[h1][l1];
        return v00 * (1 - dh) * (1 - dl) + v01 * (1 - dh) * dl + v10 * dh * (1 - dl) + v11 * dh * dl;
    };

    const total = width * height;
    for (let i = 0; i < total; i++) {
        const px = i % width, py = (i / width) | 0;
        // Texture (px,py) -> UV -> driver-map pixel (nearest).
        const u = px / (width - 1), v = py / (height - 1);
        const mx = Math.min(mw - 1, Math.max(0, Math.round(u * (mw - 1))));
        const my = Math.min(mh - 1, Math.max(0, Math.round(v * (mh - 1))));
        const mi = my * mw + mx;
        const hNorm = hMap[mi] / 255;      // 0 = base, 1 = crown
        const ilNorm = ilMap[mi] / 255;    // 0 = shadowed, 1 = lit
        const risk = sampleGrid(hNorm, ilNorm);

        const [rr, rg, rb] = ramp(risk);
        // Blend strength grows with risk so low-risk zones stay close to the
        // original texture and high-risk zones read strongly in the ramp.
        const a = 0.25 + 0.55 * risk;
        const off = i * 4;
        data[off]     = Math.round(data[off]     * (1 - a) + rr * a);
        data[off + 1] = Math.round(data[off + 1] * (1 - a) + rg * a);
        data[off + 2] = Math.round(data[off + 2] * (1 - a) + rb * a);
    }
}
