const { LightIntensity } = require('../models/LightIntensity');

/**
 * LightIntensityService
 * Handles CRUD operations for LightIntensity documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const LightIntensityService = {

    /**
     * Create a new LightIntensity
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'lightIntensity-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const lightIntensity = await LightIntensity.create(data);
        return lightIntensity;
    },

    /**
     * Get all LightIntensity documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = LightIntensity.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get LightIntensity by ID
     */
    getById: async (id) => {
        const lightIntensity = await LightIntensity.findById(id);
        return lightIntensity;
    },

    /**
     * Get LightIntensity by GID
     */
    getByGid: async (gid) => {
        const lightIntensity = await LightIntensity.findOne({ gid });
        return lightIntensity;
    },

    /**
     * Update LightIntensity by ID
     */
    update: async (id, data) => {
        const lightIntensity = await LightIntensity.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return lightIntensity;
    },

    /**
     * Delete LightIntensity by ID
     */
    delete: async (id) => {
        const lightIntensity = await LightIntensity.findByIdAndDelete(id);
        return lightIntensity;
    },

    /**
     * Update LightIntensity by GID
     */
    updateByGid: async (gid, data) => {
        const lightIntensity = await LightIntensity.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return lightIntensity;
    },

    /**
     * Delete LightIntensity by GID
     */
    deleteByGid: async (gid) => {
        const lightIntensity = await LightIntensity.findOneAndDelete({ gid });
        return lightIntensity;
    },
};

module.exports = LightIntensityService;
