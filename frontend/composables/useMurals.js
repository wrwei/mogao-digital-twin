/**
 * Mural Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 壁画 data management
 */

/**
 * Composable for managing 壁画 data
 * @returns {Object} Reactive 壁画 data and methods
 */
export function useMurals() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const murals = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedMural = ref(null);

    /**
     * Fetch all murals
     */
    const fetchMurals = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useMurals] Fetching all murals...');
            const response = await window.api.murals.getAll();
            murals.value = response.data || [];
            console.log('[useMurals] Fetched', murals.value.length, 'murals');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch murals';
            console.error('[useMurals] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Mural by GID
     * @param {string} gid - Global ID
     */
    const getMuralByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useMurals] Fetching Mural with GID:', gid);
            const response = await window.api.murals.getByGid(gid);
            selectedMural.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Mural';
            console.error('[useMurals] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Mural
     * @param {Object} data - Mural data
     */
    const createMural = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useMurals] Creating Mural:', data);
            const response = await window.api.murals.create(data);
            murals.value.push(response.data);
            console.log('[useMurals] Created Mural:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Mural';
            console.error('[useMurals] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Mural
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updateMural = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useMurals] Updating Mural:', gid, data);
            await window.api.murals.update(gid, data);
            const index = murals.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                murals.value[index] = { ...murals.value[index], ...data };
            }
            console.log('[useMurals] Updated Mural');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Mural';
            console.error('[useMurals] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Mural
     * @param {string} gid - Global ID
     */
    const deleteMural = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useMurals] Deleting Mural:', gid);
            await window.api.murals.delete(gid);
            murals.value = murals.value.filter(item => item.gid !== gid);
            if (selectedMural.value?.gid === gid) {
                selectedMural.value = null;
            }
            console.log('[useMurals] Deleted Mural');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Mural';
            console.error('[useMurals] Delete error:', err);
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
     * Select Mural
     * @param {Object} mural - Mural to select
     */
    const selectMural = (mural) => {
        selectedMural.value = mural;
    };

    // Computed properties
    const hasMurals = computed(() => murals.value.length > 0);
    const muralCount = computed(() => murals.value.length);

    // Return reactive state and methods
    return {
        // State
        murals,
        loading,
        error,
        selectedMural,
        hasMurals,
        muralCount,

        // Methods
        fetchMurals,
        getMuralByGid,
        createMural,
        updateMural,
        deleteMural,
        selectMural,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.useMurals = useMurals;
}
