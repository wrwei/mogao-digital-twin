/**
 * DeteriorationRenderer — single Seam between SimulationEngine.renderCommand
 * and the off-thread pixel manipulation that visualises each deterioration
 * model on the 3D model's texture.
 *
 * One stateless function, one worker singleton. Callers pass:
 *   - the captured original RGBA pixel buffer
 *   - texture dimensions
 *   - a `mode` tag matching SimulationEngine.renderCommand.mode
 *   - the model's `visualEffect` (the standardised schema) plus any
 *     mode-specific extras (pigmentMap, perPigmentParams)
 *
 * Returns a Promise that resolves with the processed pixel buffer. The
 * caller (ModelViewer) is responsible for uploading the result into a
 * Three.js CanvasTexture and swapping it onto the model — those bits
 * have to stay on the main thread because Three.js needs DOM access.
 *
 * For mode === 'reset', the function resolves to null and the caller
 * should restore the original Three.js texture rather than uploading
 * a processed buffer.
 */

let _worker = null;
let _inflight = null;  // Single in-flight render — newer calls overtake older ones.

function getWorker() {
    if (!_worker) {
        _worker = new Worker('workers/effects-worker.js');
    }
    return _worker;
}

/**
 * Run a deterioration effect.
 *
 * @param {object} args
 * @param {string} args.mode            — 'reset' | 'chemical-uniform' | 'chemical-pigment'
 *                                        | 'pigment-overlay' | 'mould' | 'salt'
 *                                        | 'lifetime' | 'fatigue'
 * @param {Uint8ClampedArray} args.originalPixelData
 * @param {number} args.width
 * @param {number} args.height
 * @param {object} [args.effect]        — model.visualEffect when applicable
 * @param {number} [args.degradationFactor]  — for chemical-uniform
 * @param {number} [args.amplification]      — for chemical-uniform / chemical-pigment
 * @param {Uint8Array} [args.pigmentMap]     — for chemical-pigment / pigment-overlay
 * @param {object} [args.perPigmentParams]   — for chemical-pigment
 * @returns {Promise<Uint8ClampedArray|null>}
 */
export function renderEffect(args) {
    if (args.mode === 'reset') {
        return Promise.resolve(null);
    }

    // Build the worker payload. Always copy the pixel buffer because we
    // transfer ownership to the worker; the original must remain intact
    // for subsequent renders.
    const pixelCopy = new Uint8ClampedArray(args.originalPixelData).buffer;
    const transfer = [pixelCopy];

    const payload = {
        mode: args.mode,
        pixelData: pixelCopy,
        width: args.width,
        height: args.height
    };

    if (args.effect)              payload.effect              = _plain(args.effect);
    if (args.degradationFactor != null) payload.degradationFactor = args.degradationFactor;
    if (args.amplification != null)     payload.amplification     = args.amplification;
    if (args.pigmentMap) {
        const mapCopy = new Uint8Array(args.pigmentMap).buffer;
        payload.pigmentMap = mapCopy;
        transfer.push(mapCopy);
    }
    if (args.perPigmentParams) payload.pigmentParams = _plain(args.perPigmentParams);
    // Composite mode carries the five per-mechanism visualEffects plus the
    // normalised sub-index components map so the worker can layer them.
    if (args.effects)    payload.effects    = _plain(args.effects);
    if (args.components) payload.components = _plain(args.components);
    // Stage-2 per-texel composite: baked driver maps + backend lookup grid.
    // Copy the map buffers so ownership can transfer to the worker.
    if (args.spatial && args.driverMaps && args.grid) {
        const hCopy  = new Uint8Array(args.driverMaps.height).buffer;
        const ilCopy = new Uint8Array(args.driverMaps.illum).buffer;
        payload.spatial = true;
        payload.driverMaps = {
            height: hCopy,
            illum: ilCopy,
            width: args.driverMaps.width,
            mapHeight: args.driverMaps.mapHeight
        };
        payload.grid = _plain(args.grid);
        transfer.push(hCopy, ilCopy);
    }

    const worker = getWorker();
    const ticket = Symbol('renderEffect');
    _inflight = ticket;

    return new Promise((resolve, reject) => {
        const onMessage = (e) => {
            cleanup();
            // Stale callbacks (the caller has since dispatched a newer render)
            // resolve to null so the caller knows to drop them on the floor.
            if (_inflight !== ticket) return resolve(null);
            resolve(new Uint8ClampedArray(e.data.pixelData));
        };
        const onError = (err) => {
            cleanup();
            if (_inflight !== ticket) return resolve(null);
            reject(err);
        };
        const cleanup = () => {
            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.postMessage(payload, transfer);
    });
}

// Strip Vue reactive proxies / class instances out of objects that cross
// the worker boundary. The structured-clone algorithm rejects proxies and
// fails opaquely; this is the same workaround ModelViewer used to do
// inline before the renderer existed.
function _plain(obj) {
    if (obj == null) return obj;
    if (Array.isArray(obj)) return obj.map(_plain);
    if (typeof obj !== 'object') return obj;
    const out = {};
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        out[k] = (v && typeof v === 'object') ? _plain(v) : v;
    }
    return out;
}
