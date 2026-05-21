const { AssetReference } = require('../models/AssetReference');

/**
 * AssetReferenceService
 * Handles CRUD operations for AssetReference documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const AssetReferenceService = {

    /**
     * Create a new AssetReference
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'assetReference-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const assetReference = await AssetReference.create(data);
        return assetReference;
    },

    /**
     * Get all AssetReference documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = AssetReference.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get AssetReference by ID
     */
    getById: async (id) => {
        const assetReference = await AssetReference.findById(id);
        return assetReference;
    },

    /**
     * Get AssetReference by GID
     */
    getByGid: async (gid) => {
        const assetReference = await AssetReference.findOne({ gid });
        return assetReference;
    },

    /**
     * Update AssetReference by ID
     */
    update: async (id, data) => {
        const assetReference = await AssetReference.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return assetReference;
    },

    /**
     * Delete AssetReference by ID
     */
    delete: async (id) => {
        const assetReference = await AssetReference.findByIdAndDelete(id);
        return assetReference;
    },

    /**
     * Update AssetReference by GID
     */
    updateByGid: async (gid, data) => {
        const assetReference = await AssetReference.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return assetReference;
    },

    /**
     * Delete AssetReference by GID
     */
    deleteByGid: async (gid) => {
        const assetReference = await AssetReference.findOneAndDelete({ gid });
        return assetReference;
    },
};

module.exports = AssetReferenceService;
