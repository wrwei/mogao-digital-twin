/**
 * Inscription Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 铭文 data management
 */

/**
 * Composable for managing 铭文 data
 * @returns {Object} Reactive 铭文 data and methods
 */
export function useInscriptions() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const inscriptions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedInscription = ref(null);

    /**
     * Fetch all inscriptions
     */
    const fetchInscriptions = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useInscriptions] Fetching all inscriptions...');
            const response = await window.api.inscriptions.getAll();
            inscriptions.value = response.data || [];
            console.log('[useInscriptions] Fetched', inscriptions.value.length, 'inscriptions');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch inscriptions';
            console.error('[useInscriptions] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Inscription by GID
     * @param {string} gid - Global ID
     */
    const getInscriptionByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useInscriptions] Fetching Inscription with GID:', gid);
            const response = await window.api.inscriptions.getByGid(gid);
            selectedInscription.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Inscription';
            console.error('[useInscriptions] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Inscription
     * @param {Object} data - Inscription data
     */
    const createInscription = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useInscriptions] Creating Inscription:', data);
            const response = await window.api.inscriptions.create(data);
            inscriptions.value.push(response.data);
            console.log('[useInscriptions] Created Inscription:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Inscription';
            console.error('[useInscriptions] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Inscription
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updateInscription = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useInscriptions] Updating Inscription:', gid, data);
            await window.api.inscriptions.update(gid, data);
            const index = inscriptions.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                inscriptions.value[index] = { ...inscriptions.value[index], ...data };
            }
            console.log('[useInscriptions] Updated Inscription');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Inscription';
            console.error('[useInscriptions] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Inscription
     * @param {string} gid - Global ID
     */
    const deleteInscription = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[useInscriptions] Deleting Inscription:', gid);
            await window.api.inscriptions.delete(gid);
            inscriptions.value = inscriptions.value.filter(item => item.gid !== gid);
            if (selectedInscription.value?.gid === gid) {
                selectedInscription.value = null;
            }
            console.log('[useInscriptions] Deleted Inscription');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Inscription';
            console.error('[useInscriptions] Delete error:', err);
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
     * Select Inscription
     * @param {Object} inscription - Inscription to select
     */
    const selectInscription = (inscription) => {
        selectedInscription.value = inscription;
    };

    // Computed properties
    const hasInscriptions = computed(() => inscriptions.value.length > 0);
    const inscriptionCount = computed(() => inscriptions.value.length);

    // Return reactive state and methods
    return {
        // State
        inscriptions,
        loading,
        error,
        selectedInscription,
        hasInscriptions,
        inscriptionCount,

        // Methods
        fetchInscriptions,
        getInscriptionByGid,
        createInscription,
        updateInscription,
        deleteInscription,
        selectInscription,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.useInscriptions = useInscriptions;
}
