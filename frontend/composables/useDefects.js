/**
 * Defect Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 缺陷 data management
 */

/**
 * Composable for managing 缺陷 data
 * @returns {Object} Reactive 缺陷 data and methods
 */
export function useDefects() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const defects = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedDefect = ref(null);

    /**
     * Fetch all defects
     */
    const fetchDefects = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useDefects] Fetching all defects...');
            const response = await window.api.defects.getAll();
            defects.value = response.data || [];
            console.log('[useDefects] Fetched', defects.value.length, 'defects');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch defects';
            console.error('[useDefects] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Defect by GID
     * @param {string} gid - Global ID
     */
    const getDefectByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useDefects] Fetching Defect with GID:', gid);
            const response = await window.api.defects.getByGid(gid);
            selectedDefect.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Defect';
            console.error('[useDefects] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Defect
     * @param {Object} data - Defect data
     */
    const createDefect = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useDefects] Creating Defect:', data);
            const response = await window.api.defects.create(data);
            defects.value.push(response.data);
            console.log('[useDefects] Created Defect:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Defect';
            console.error('[useDefects] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Defect
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updateDefect = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useDefects] Updating Defect:', gid, data);
            await window.api.defects.update(gid, data);
            const index = defects.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                defects.value[index] = { ...defects.value[index], ...data };
            }
            console.log('[useDefects] Updated Defect');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Defect';
            console.error('[useDefects] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Defect
     * @param {string} gid - Global ID
     */
    const deleteDefect = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useDefects] Deleting Defect:', gid);
            await window.api.defects.delete(gid);
            defects.value = defects.value.filter(item => item.gid !== gid);
            if (selectedDefect.value?.gid === gid) {
                selectedDefect.value = null;
            }
            console.log('[useDefects] Deleted Defect');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Defect';
            console.error('[useDefects] Delete error:', err);
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
     * Select Defect
     * @param {Object} defect - Defect to select
     */
    const selectDefect = (defect) => {
        selectedDefect.value = defect;
    };

    // Computed properties
    const hasDefects = computed(() => defects.value.length > 0);
    const defectCount = computed(() => defects.value.length);

    // Return reactive state and methods
    return {
        // State
        defects,
        loading,
        error,
        selectedDefect,
        hasDefects,
        defectCount,

        // Methods
        fetchDefects,
        getDefectByGid,
        createDefect,
        updateDefect,
        deleteDefect,
        selectDefect,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.useDefects = useDefects;
}
