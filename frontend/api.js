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
        console.error('[API] Response error:', error.response?.status, error.response?.data || error.message);

        // Handle session expiration — redirect to login
        if (error.response?.status === 401 && !error.config?.url?.includes('/users/login')) {
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
        uploadCSV: (gid, file) => {
            const fd = new FormData();
            fd.append('file', file);
            return apiClient.post(`/sensors/${gid}/samples/upload`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        batch: (gid, samples) =>
            apiClient.post(`/sensors/${gid}/samples/batch`, { samples }),
    },

    // Maintenance queue (prediction + anomalies composite)
    maintenance: {
        queue:       ()    => apiClient.get('/maintenance/queue', { timeout: 120000 }),
        artifact:    (gid) => apiClient.get(`/maintenance/artifact/${gid}`, { timeout: 60000 }),
        anomalies:   ()    => apiClient.get('/maintenance/anomalies'),
    },

    // Health check
    health: {
        check: () => apiClient.get('/health').catch(() => ({ data: { status: 'offline' } })),
    }
};

// Export for use in other modules
window.api = api;
export default api;
