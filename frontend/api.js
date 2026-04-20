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

    // Coordinate endpoints
    coordinates: {
        getAll: () => apiClient.get('/coordinates'),
        getByGid: (gid) => apiClient.get(`/coordinates/gid/${gid}`),
        create: (data) => apiClient.post('/coordinates', data),
        update: (gid, data) => apiClient.put(`/coordinates/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/coordinates/gid/${gid}`),
    },

    // Parameter endpoints
    parameters: {
        getAll: () => apiClient.get('/parameters'),
        getByGid: (gid) => apiClient.get(`/parameters/gid/${gid}`),
        create: (data) => apiClient.post('/parameters', data),
        update: (gid, data) => apiClient.put(`/parameters/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/parameters/gid/${gid}`),
    },

    // AssetReference endpoints
    assetReferences: {
        getAll: () => apiClient.get('/assetReferences'),
        getByGid: (gid) => apiClient.get(`/assetReferences/gid/${gid}`),
        create: (data) => apiClient.post('/assetReferences', data),
        update: (gid, data) => apiClient.put(`/assetReferences/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/assetReferences/gid/${gid}`),
    },

    // DTPackage endpoints
    dTPackages: {
        getAll: () => apiClient.get('/dTPackages'),
        getByGid: (gid) => apiClient.get(`/dTPackages/gid/${gid}`),
        create: (data) => apiClient.post('/dTPackages', data),
        update: (gid, data) => apiClient.put(`/dTPackages/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/dTPackages/gid/${gid}`),
    },

    // Temperature endpoints
    temperatures: {
        getAll: () => apiClient.get('/temperatures'),
        getByGid: (gid) => apiClient.get(`/temperatures/gid/${gid}`),
        create: (data) => apiClient.post('/temperatures', data),
        update: (gid, data) => apiClient.put(`/temperatures/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/temperatures/gid/${gid}`),
    },

    // Humidity endpoints
    humidities: {
        getAll: () => apiClient.get('/humidities'),
        getByGid: (gid) => apiClient.get(`/humidities/gid/${gid}`),
        create: (data) => apiClient.post('/humidities', data),
        update: (gid, data) => apiClient.put(`/humidities/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/humidities/gid/${gid}`),
    },

    // LightIntensity endpoints
    lightIntensities: {
        getAll: () => apiClient.get('/lightIntensities'),
        getByGid: (gid) => apiClient.get(`/lightIntensities/gid/${gid}`),
        create: (data) => apiClient.post('/lightIntensities', data),
        update: (gid, data) => apiClient.put(`/lightIntensities/gid/${gid}`, data),
        delete: (gid) => apiClient.delete(`/lightIntensities/gid/${gid}`),
    },

    // Deterioration model calculations
    deterioration: {
        assess: (data) => apiClient.post('/deterioration/assess', data),
        chemical: (data) => apiClient.post('/deterioration/chemical', data),
        lifetime: (data) => apiClient.post('/deterioration/lifetime', data),
        mould: (data) => apiClient.post('/deterioration/mould', data),
        salt: (data) => apiClient.post('/deterioration/salt', data),
        defaults: () => apiClient.get('/deterioration/defaults'),
    },

    // Cross-entity exhibit queries
    exhibits: {
        getAll: () => apiClient.get('/exhibits'),
        getByStatus: (status) => apiClient.get(`/exhibits/status/${status}`),
        getCritical: () => apiClient.get('/exhibits/critical'),
        getByMaterial: (material) => apiClient.get(`/exhibits/material/${material}`),
        getByPeriod: (period) => apiClient.get(`/exhibits/period/${period}`),
        getWithDefects: () => apiClient.get('/exhibits/with-defects'),
        getRequiringAttention: () => apiClient.get('/exhibits/requiring-attention'),
        setInspection: (gid, data) => apiClient.put(`/exhibits/${gid}/inspection`, data),
        updateConservationStatus: (gid, data) => apiClient.put(`/exhibits/${gid}/conservation-status`, data),
        setCoordinates: (gid, data) => apiClient.put(`/exhibits/${gid}/coordinates`, data),
        /**
         * Query environment time-series for an artifact.
         * @param gid      Artifact gid
         * @param params   { from?, to?, interval?: 'raw'|'hourly'|'daily' }
         */
        getEnvironment: (gid, params = {}) =>
            apiClient.get(`/exhibits/${gid}/environment`, { params }),
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
        linkArtifact: (gid, artifactGid) =>
            apiClient.post(`/sensors/${gid}/link-artifact`, { artifactGid }),
        unlinkArtifact: (gid, artifactGid) =>
            apiClient.delete(`/sensors/${gid}/link-artifact/${artifactGid}`),
        rotateKey: (gid) => apiClient.post(`/sensors/${gid}/rotate-key`),
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

    // Health check
    health: {
        check: () => apiClient.get('/health').catch(() => ({ data: { status: 'offline' } })),
    }
};

// Export for use in other modules
window.api = api;
export default api;
