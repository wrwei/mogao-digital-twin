/**
 * Entity Composable Factory
 * Generates Vue composables for CRUD entity management
 */
export function useEntity(entityName, pluralName, apiKey) {
    const { ref, computed } = window.Vue || Vue;

    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedItem = ref(null);

    const fetchAll = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await window.api[apiKey].getAll();
            items.value = response.data || [];
        } catch (err) {
            error.value = err.response?.data?.message || err.message || `Failed to fetch ${pluralName}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const getByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await window.api[apiKey].getByGid(gid);
            selectedItem.value = response.data;
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || `Failed to fetch ${entityName}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const create = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await window.api[apiKey].create(data);
            items.value.push(response.data);
            return response.data;
        } catch (err) {
            error.value = err.response?.data?.message || err.message || `Failed to create ${entityName}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const update = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            await window.api[apiKey].update(gid, data);
            const index = items.value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                items.value[index] = { ...items.value[index], ...data };
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || `Failed to update ${entityName}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const remove = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            await window.api[apiKey].delete(gid);
            items.value = items.value.filter(item => item.gid !== gid);
            if (selectedItem.value?.gid === gid) {
                selectedItem.value = null;
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || `Failed to delete ${entityName}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const clearError = () => { error.value = null; };
    const select = (item) => { selectedItem.value = item; };

    const hasItems = computed(() => items.value.length > 0);
    const itemCount = computed(() => items.value.length);

    // Build result object with entity-specific aliases
    const result = {
        // Generic names
        items, loading, error, selectedItem, hasItems, itemCount,
        fetchAll, getByGid, create, update, remove, select, clearError,
    };

    // Add entity-specific aliases for backward compatibility
    result[pluralName] = items;
    result[`selected${entityName}`] = selectedItem;
    result[`has${pluralName.charAt(0).toUpperCase() + pluralName.slice(1)}`] = hasItems;
    result[`${pluralName.charAt(0).toLowerCase() + pluralName.slice(1)}Count`] = itemCount;
    result[`fetch${pluralName.charAt(0).toUpperCase() + pluralName.slice(1)}`] = fetchAll;
    result[`get${entityName}ByGid`] = getByGid;
    result[`create${entityName}`] = create;
    result[`update${entityName}`] = update;
    result[`delete${entityName}`] = remove;
    result[`select${entityName}`] = select;

    return result;
}
