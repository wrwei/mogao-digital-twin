/**
 * Statue Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 雕像 data management
 */

/**
 * Composable for managing 雕像 data
 * @returns {Object} Reactive 雕像 data and methods
 */
export function useStatues() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const statues = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedStatue = ref(null);

    /**
     * Fetch all statues
     */
    const fetchStatues = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useStatues] Fetching all statues...');
            const response = await window.api.statues.getAll();
            statues.value = response.data || [];
            console.log('[useStatues] Fetched', statues.value.length, 'statues');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch statues';
            console.error('[useStatues] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Statue by GID
     * @param {string} gid - Global ID
     */
    const getStatueByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useStatues] Fetching Statue with GID:', gid);
            const response = await window.api.statues.getByGid(gid);
            selectedStatue.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Statue';
            console.error('[useStatues] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Statue
     * @param {Object} data - Statue data
     */
    const createStatue = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useStatues] Creating Statue:', data);
            const response = await window.api.statues.create(data);
            statues.value.push(response.data);
            console.log('[useStatues] Created Statue:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Statue';
            console.error('[useStatues] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Statue
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updateStatue = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useStatues] Updating Statue:', gid, data);
            await window.api.statues.update(gid, data);
            const index = statues.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                statues.value[index] = { ...statues.value[index], ...data };
            }
            console.log('[useStatues] Updated Statue');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Statue';
            console.error('[useStatues] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Statue
     * @param {string} gid - Global ID
     */
    const deleteStatue = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useStatues] Deleting Statue:', gid);
            await window.api.statues.delete(gid);
            statues.value = statues.value.filter(item => item.gid !== gid);
            if (selectedStatue.value?.gid === gid) {
                selectedStatue.value = null;
            }
            console.log('[useStatues] Deleted Statue');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Statue';
            console.error('[useStatues] Delete error:', err);
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
     * Select Statue
     * @param {Object} statue - Statue to select
     */
    const selectStatue = (statue) => {
        selectedStatue.value = statue;
    };

    // Computed properties
    const hasStatues = computed(() => statues.value.length > 0);
    const statueCount = computed(() => statues.value.length);

    // Return reactive state and methods
    return {
        // State
        statues,
        loading,
        error,
        selectedStatue,
        hasStatues,
        statueCount,

        // Methods
        fetchStatues,
        getStatueByGid,
        createStatue,
        updateStatue,
        deleteStatue,
        selectStatue,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.useStatues = useStatues;
}
