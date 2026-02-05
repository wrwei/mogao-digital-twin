/**
 * Painting Composable
 * Auto-generated from mogao_dt.ecore
 * Vue composable for 绘画 data management
 */

/**
 * Composable for managing 绘画 data
 * @returns {Object} Reactive 绘画 data and methods
 */
export function usePaintings() {
    // Import Vue ref if using modules
    const { ref, computed } = window.Vue || Vue;

    // Reactive state
    const paintings = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedPainting = ref(null);

    /**
     * Fetch all paintings
     */
    const fetchPaintings = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[usePaintings] Fetching all paintings...');
            const response = await window.api.paintings.getAll();
            paintings.value = response.data || [];
            console.log('[usePaintings] Fetched', paintings.value.length, 'paintings');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch paintings';
            console.error('[usePaintings] Fetch error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get Painting by GID
     * @param {string} gid - Global ID
     */
    const getPaintingByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[usePaintings] Fetching Painting with GID:', gid);
            const response = await window.api.paintings.getByGid(gid);
            selectedPainting.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch Painting';
            console.error('[usePaintings] Get by GID error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create new Painting
     * @param {Object} data - Painting data
     */
    const createPainting = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[usePaintings] Creating Painting:', data);
            const response = await window.api.paintings.create(data);
            paintings.value.push(response.data);
            console.log('[usePaintings] Created Painting:', response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to create Painting';
            console.error('[usePaintings] Create error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update existing Painting
     * @param {string} gid - Global ID
     * @param {Object} data - Updated data
     */
    const updatePainting = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[usePaintings] Updating Painting:', gid, data);
            await window.api.paintings.update(gid, data);
            const index = paintings.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                paintings.value[index] = { ...paintings.value[index], ...data };
            }
            console.log('[usePaintings] Updated Painting');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to update Painting';
            console.error('[usePaintings] Update error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete Painting
     * @param {string} gid - Global ID
     */
    const deletePainting = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            console.log('[usePaintings] Deleting Painting:', gid);
            await window.api.paintings.delete(gid);
            paintings.value = paintings.value.filter(item => item.gid !== gid);
            if (selectedPainting.value?.gid === gid) {
                selectedPainting.value = null;
            }
            console.log('[usePaintings] Deleted Painting');
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Failed to delete Painting';
            console.error('[usePaintings] Delete error:', err);
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
     * Select Painting
     * @param {Object} painting - Painting to select
     */
    const selectPainting = (painting) => {
        selectedPainting.value = painting;
    };

    // Computed properties
    const hasPaintings = computed(() => paintings.value.length > 0);
    const paintingCount = computed(() => paintings.value.length);

    // Return reactive state and methods
    return {
        // State
        paintings,
        loading,
        error,
        selectedPainting,
        hasPaintings,
        paintingCount,

        // Methods
        fetchPaintings,
        getPaintingByGid,
        createPainting,
        updatePainting,
        deletePainting,
        selectPainting,
        clearError
    };
}

// Export for global use
if (typeof window !== 'undefined') {
    window.usePaintings = usePaintings;
}
