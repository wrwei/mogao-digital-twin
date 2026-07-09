/**
 * API Service Layer
 * Wraps axios for communication with the Mogao Digital Twin backend
 */

// Backend API base URL
const API_BASE_URL = window.CONFIG?.API_BASE_URL || 'http://localhost:8008';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor for auth token and logging
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mgemini-token');
        if (token) {
            config.headers.Authorization = 'Bearer ' + token;
        } else {
            const user = JSON.parse(localStorage.getItem('mgemini-user') || 'null');
            if (user && user.role === 'guest') {
                config.headers['X-Guest-Access'] = 'true';
            }
        }
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and session expiration
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Callers can pass `silentStatuses: [404]` (or `silent: true` for any)
        // in the axios request config to suppress the interceptor's console
        // log for expected error responses — e.g. "no cached analysis yet"
        // from /pigment-analyses on first visit.
        const cfg = error.config || {};
        const status = error.response?.status;
        const silenced =
            cfg.silent === true
            || (Array.isArray(cfg.silentStatuses) && cfg.silentStatuses.includes(status));
        if (!silenced) {
            console.error('[API] Response error:', status, error.response?.data || error.message);
        }

        // Handle session expiration — redirect to login
        if (status === 401 && !cfg.url?.includes('/users/login')) {
            localStorage.removeItem('mgemini-token');
            localStorage.removeItem('mgemini-user');
            window.location.reload();
        }

        return Promise.reject(error);
    }
);

/**
 * API Service Object
 */
const api = {
    // Generic HTTP methods
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),

    // Cave endpoints
    caves: {
        getAll: () => apiClient.get('/caves'),
        getByGid: (gid) => apiClient.get(`/caves/gid/${gid}`),
        create: (data) => apiClient.post('/caves', data),
        update: (gid, data) => apiClient.put(`/caves/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/caves/gid/${gid}`),
    },

    // Defect endpoints
    defects: {
        getAll: () => apiClient.get('/defects'),
        getByGid: (gid) => apiClient.get(`/defects/gid/${gid}`),
        create: (data) => apiClient.post('/defects', data),
        update: (gid, data) => apiClient.put(`/defects/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/defects/gid/${gid}`),
    },

    // Statue endpoints
    statues: {
        getAll: () => apiClient.get('/statues'),
        getByGid: (gid) => apiClient.get(`/statues/gid/${gid}`),
        create: (data) => apiClient.post('/statues', data),
        update: (gid, data) => apiClient.put(`/statues/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/statues/gid/${gid}`),
    },

    // Mural endpoints
    murals: {
        getAll: () => apiClient.get('/murals'),
        getByGid: (gid) => apiClient.get(`/murals/gid/${gid}`),
        create: (data) => apiClient.post('/murals', data),
        update: (gid, data) => apiClient.put(`/murals/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/murals/gid/${gid}`),
    },

    // Painting endpoints
    paintings: {
        getAll: () => apiClient.get('/paintings'),
        getByGid: (gid) => apiClient.get(`/paintings/gid/${gid}`),
        create: (data) => apiClient.post('/paintings', data),
        update: (gid, data) => apiClient.put(`/paintings/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/paintings/gid/${gid}`),
    },

    // Inscription endpoints
    inscriptions: {
        getAll: () => apiClient.get('/inscriptions'),
        getByGid: (gid) => apiClient.get(`/inscriptions/gid/${gid}`),
        create: (data) => apiClient.post('/inscriptions', data),
        update: (gid, data) => apiClient.put(`/inscriptions/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/inscriptions/gid/${gid}`),
    },

    // Deterioration model calculations
    deterioration: {
        assess: (data) => apiClient.post('/deterioration/assess', data),
        assessField: (data) => apiClient.post('/deterioration/assess-field', data),
        defaults: () => apiClient.get('/deterioration/defaults'),
    },

    // Cross-entity exhibit queries
    exhibits: {
        /**
         * Query environment time-series for an artifact.
         * @param gid      Artifact gid
         * @param params   { from?, to?, interval?: 'raw'|'hourly'|'daily' }
         */
        getEnvironment: (gid, params = {}) =>
            apiClient.get(`/exhibits/${gid}/environment`, { params }),

        // Per-exhibit defect log (observed damage records)
        listDefects:   (gid)                    => apiClient.get(`/exhibits/${gid}/defects`),
        addDefect:     (gid, data)              => apiClient.post(`/exhibits/${gid}/defects`, data),
        updateDefect:  (gid, defectGid, data)   => apiClient.put(`/exhibits/${gid}/defects/${defectGid}`, data),
        removeDefect:  (gid, defectGid)         => apiClient.delete(`/exhibits/${gid}/defects/${defectGid}`),
        /**
         * Historical deterioration replay with optional forward projection.
         * @param gid    Artifact gid
         * @param params { from?, to?, forecast?: boolean, maxYears?: number }
         */
        replayDeterioration: (gid, params = {}) =>
            apiClient.get(`/exhibits/${gid}/deterioration/replay`, { params, timeout: 60000 }),
    },

    // Sensor management (admin)
    sensors: {
        list: () => apiClient.get('/sensors'),
        get: (gid) => apiClient.get(`/sensors/${gid}`),
        register: (data) => apiClient.post('/sensors', data),
        update: (gid, patch) => apiClient.patch(`/sensors/${gid}`, patch),
        deactivate: (gid) => apiClient.delete(`/sensors/${gid}`),
        remove:     (gid) => apiClient.delete(`/sensors/${gid}/purge`),
        linkArtifact: (gid, artifactGid) =>
            apiClient.post(`/sensors/${gid}/link-artifact`, { artifactGid }),
        unlinkArtifact: (gid, artifactGid) =>
            apiClient.delete(`/sensors/${gid}/link-artifact/${artifactGid}`),
        rotateKey: (gid) => apiClient.post(`/sensors/${gid}/rotate-key`),
        anomalies: (gid) => apiClient.get(`/sensors/${gid}/anomalies`),
        samples:   (gid, opts = {}) => apiClient.get(`/sensors/${gid}/samples`,   { params: opts, timeout: 60000 }),
        clearSamples: (gid) => apiClient.delete(`/sensors/${gid}/samples`, { timeout: 120000 }),
        snapshots: (gid, opts = {}) => apiClient.get(`/sensors/${gid}/snapshots`, { params: opts }),
        uploadCSV: (gid, file) => {
            const fd = new FormData();
            fd.append('file', file);
            // Two gotchas, both burned us before:
            //   1. Setting Content-Type explicitly to 'multipart/form-data'
            //      WITHOUT a boundary parameter overrides axios's auto-detected
            //      header (which has the boundary), and multer then can't parse
            //      the body — the server sees an empty file and ingestCSV
            //      reports "0 accepted, 0 dup, 0 rejected". Set the header to
            //      undefined so axios picks 'multipart/form-data; boundary=...'.
            //   2. The default apiClient timeout is 10 s; CSVs with ~52 k rows
            //      take 30-60 s of server-side validation + bulk insert.
            return apiClient.post(`/sensors/${gid}/samples/upload`, fd, {
                headers: { 'Content-Type': undefined },
                timeout: 300000,                                    // 5 minutes
                maxBodyLength: 50 * 1024 * 1024,
                maxContentLength: 50 * 1024 * 1024
            });
        },
        batch: (gid, samples) =>
            apiClient.post(`/sensors/${gid}/samples/batch`, { samples }, { timeout: 300000 }),
    },

    // Maintenance queue (prediction + anomalies composite)
    maintenance: {
        queue:       ()    => apiClient.get('/maintenance/queue', { timeout: 120000 }),
        artifact:    (gid) => apiClient.get(`/maintenance/artifact/${gid}`, { timeout: 60000 }),
        anomalies:   ()    => apiClient.get('/maintenance/anomalies'),
    },

    snapshots: {
        listForArtefact: (artifactGid, limit = 100) =>
            apiClient.get('/snapshots', { params: { artifactGid, limit } }),
        imageUrl: (gid) => `${API_BASE_URL}/snapshots/${gid}/image`,
        remove:   (gid) => apiClient.delete(`/snapshots/${gid}`),
    },

    emulator: {
        status:  ()                  => apiClient.get('/emulator/status'),
        start:   (gid, body)         => apiClient.post(`/emulator/sensors/${encodeURIComponent(gid)}/start`,   body),
        stop:    (gid)               => apiClient.post(`/emulator/sensors/${encodeURIComponent(gid)}/stop`),
        // PATCH is debounced from the panel — 404 means "no live runner";
        // silenced so the console doesn't spam when sliders are moved before
        // pressing Start.
        update:  (gid, body)         => apiClient.patch(`/emulator/sensors/${encodeURIComponent(gid)}/config`, body, { silentStatuses: [404] }),
        catchup: (gid, body)         => apiClient.post(`/emulator/sensors/${encodeURIComponent(gid)}/catchup`, body, { timeout: 120000 })
    },

    pigmentAnalyses: {
        // Fetch the cached analysis metadata for an artefact. 404 = none on
        // file, which is the normal first-visit case — silenced via the
        // interceptor's silentStatuses hook to keep the console clean.
        get: (artifactGid) =>
            apiClient.get('/pigment-analyses', {
                params: { artifactGid },
                silentStatuses: [404]
            }),
        // Binary map fetcher: returns a Uint8Array of the pigment-class indices,
        // de-gzipping if the server flagged X-Map-Encoding: gzip.
        async fetchMap(artifactGid) {
            const url = `${API_BASE_URL}/pigment-analyses/${encodeURIComponent(artifactGid)}/map`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                const err = new Error(`Map fetch failed: ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const encoding = res.headers.get('X-Map-Encoding') || 'raw';
            const width  = Number(res.headers.get('X-Map-Width')  || 0);
            const height = Number(res.headers.get('X-Map-Height') || 0);
            let bytes;
            if (encoding === 'gzip' && typeof DecompressionStream === 'function') {
                const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
                const decompressed = await new Response(stream).arrayBuffer();
                bytes = new Uint8Array(decompressed);
            } else {
                bytes = new Uint8Array(await res.arrayBuffer());
            }
            return { bytes, width, height };
        },
        // Upsert. Compresses the pigmentMap with gzip in-browser so the wire
        // transfer is a few MB rather than the full ~64 MB raw.
        async save(artifactGid, { regionSummary, pigmentNames, mapWidth, mapHeight, textureHash }, pigmentMap) {
            let body = pigmentMap;
            let encoding = 'raw';
            if (typeof CompressionStream === 'function') {
                const stream = new Response(pigmentMap).body.pipeThrough(new CompressionStream('gzip'));
                body = new Uint8Array(await new Response(stream).arrayBuffer());
                encoding = 'gzip';
            }
            const fd = new FormData();
            fd.append('artifactGid',   artifactGid);
            fd.append('regionSummary', JSON.stringify(regionSummary || []));
            fd.append('pigmentNames',  JSON.stringify(pigmentNames  || []));
            fd.append('mapWidth',      String(mapWidth));
            fd.append('mapHeight',     String(mapHeight));
            fd.append('textureHash',   textureHash || '');
            fd.append('mapEncoding',   encoding);
            fd.append('map', new Blob([body], { type: 'application/octet-stream' }), 'pigment-map.bin');
            // The apiClient defaults Content-Type to application/json; setting
            // it to undefined here lets axios pick the correct multipart
            // header (with boundary) for the FormData body. Without this,
            // multer sees a JSON-typed request and rejects with
            // "map file field is required".
            return apiClient.post('/pigment-analyses', fd, {
                headers: { 'Content-Type': undefined },
                timeout: 60000,
                maxBodyLength: 100 * 1024 * 1024,
                maxContentLength: 100 * 1024 * 1024
            });
        },
        remove: (artifactGid) =>
            apiClient.delete(`/pigment-analyses/${encodeURIComponent(artifactGid)}`),
    },

    // Health check
    health: {
        check: () => apiClient.get('/health').catch(() => ({ data: { status: 'offline' } })),
    }
};

// Export for use in other modules
window.api = api;
export default api;
