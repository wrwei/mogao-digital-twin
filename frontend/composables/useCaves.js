/**
 * Cave Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 洞窟 data management
 */

/**
 * Composable for managing 洞窟 data
 * @returns {Object} Reactive 洞窟 data and methods
 */
export function useCaves() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const caves = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedCave = ref(null);

    /**
     * Fetch all caves
     */
    const fetchCaves = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useCaves] Fetching all caves...');
            const response = await window.api.caves.getAll();
            caves.value = response.data || [];
            console.log('[useCaves] Fetched', caves.value.length, 'caves');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch caves';
            console.error('[useCaves] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Cave by GID
     * @param {string} gid - Global ID
     */
    const getCaveByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useCaves] Fetching Cave with GID:', gid);
            const response = await window.api.caves.getByGid(gid);
            selectedCave.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Cave';
            console.error('[useCaves] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Cave
     * @param {Object} data - Cave data
     */
    const createCave = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useCaves] Creating Cave:', data);
            const response = await window.api.caves.create(data);
            caves.value.push(response.data);
            console.log('[useCaves] Created Cave:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Cave';
            console.error('[useCaves] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Cave
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updateCave = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useCaves] Updating Cave:', gid, data);
            await window.api.caves.update(gid, data);
            const index = caves.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                caves.value[index] = { ...caves.value[index], ...data };
            }
            console.log('[useCaves] Updated Cave');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Cave';
            console.error('[useCaves] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Cave
     * @param {string} gid - Global ID
     */
    const deleteCave = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useCaves] Deleting Cave:', gid);
            await window.api.caves.delete(gid);
            caves.value = caves.value.filter(item => item.gid !== gid);
            if (selectedCave.value?.gid === gid) {
                selectedCave.value = null;
            }
            console.log('[useCaves] Deleted Cave');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Cave';
            console.error('[useCaves] Delete error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Clear error
     */
    const clearError = () => {
        error.value = null;
    };

    /**
     * Select Cave
     * @param {Object} cave - Cave to select
     */
    const selectCave = (cave) => {
        selectedCave.value = cave;
    };

    // Computed properties
    const hasCaves = computed(() => caves.value.length > 0);
    const caveCount = computed(() => caves.value.length);

    // Return reactive state and methods
    return {
        // State
        caves,
        loading,
        error,
        selectedCave,
        hasCaves,
        caveCount,

        // Methods
        fetchCaves,
        getCaveByGid,
        createCave,
        updateCave,
        deleteCave,
        selectCave,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.useCaves = useCaves;
}
