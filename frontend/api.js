/**
 * API Service Layer
 * Wraps axios for communication with the Mogao Digital Twin backend
 */

// Backend API base URL
const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API] Response:`, response.status, response.data);
        return response;
    },
    (error) => {
        console.error('[API] Response error:', error.response?.status, error.response?.data || error.message);
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
        getByGid: (gid) => apiClient.get(`/caves/${gid}`),
        create: (data) => apiClient.post('/caves', data),
        update: (gid, data) => apiClient.put(`/caves/${gid}`, data),
        delete: (gid) => apiClient.delete(`/caves/${gid}`),
    },

    // Defect endpoints
    defects: {
        getAll: () => apiClient.get('/defects'),
        getByGid: (gid) => apiClient.get(`/defects/${gid}`),
        create: (data) => apiClient.post('/defects', data),
        update: (gid, data) => apiClient.put(`/defects/${gid}`, data),
        delete: (gid) => apiClient.delete(`/defects/${gid}`),
    },

    // Statue endpoints
    statues: {
        getAll: () => apiClient.get('/statues'),
        getByGid: (gid) => apiClient.get(`/statues/${gid}`),
        create: (data) => apiClient.post('/statues', data),
        update: (gid, data) => apiClient.put(`/statues/${gid}`, data),
        delete: (gid) => apiClient.delete(`/statues/${gid}`),
    },

    // Mural endpoints
    murals: {
        getAll: () => apiClient.get('/murals'),
        getByGid: (gid) => apiClient.get(`/murals/${gid}`),
        create: (data) => apiClient.post('/murals', data),
        update: (gid, data) => apiClient.put(`/murals/${gid}`, data),
        delete: (gid) => apiClient.delete(`/murals/${gid}`),
    },

    // Painting endpoints
    paintings: {
        getAll: () => apiClient.get('/paintings'),
        getByGid: (gid) => apiClient.get(`/paintings/${gid}`),
        create: (data) => apiClient.post('/paintings', data),
        update: (gid, data) => apiClient.put(`/paintings/${gid}`, data),
        delete: (gid) => apiClient.delete(`/paintings/${gid}`),
    },

    // Inscription endpoints
    inscriptions: {
        getAll: () => apiClient.get('/inscriptions'),
        getByGid: (gid) => apiClient.get(`/inscriptions/${gid}`),
        create: (data) => apiClient.post('/inscriptions', data),
        update: (gid, data) => apiClient.put(`/inscriptions/${gid}`, data),
        delete: (gid) => apiClient.delete(`/inscriptions/${gid}`),
    },

    // Health check
    health: {
        check: () => apiClient.get('/health').catch(() => ({ data: { status: 'offline' } })),
    }
};

// Export for use in other modules
window.api = api;
export default api;
