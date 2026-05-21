const { Statue } = require('../models/Statue');

/**
 * StatueService
 * Handles CRUD operations for Statue documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const StatueService = {

    /**
     * Create a new Statue
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'statue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const statue = await Statue.create(data);
        return statue;
    },

    /**
     * Get all Statue documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Statue.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Statue by ID
     */
    getById: async (id) => {
        const statue = await Statue.findById(id);
        return statue;
    },

    /**
     * Get Statue by GID
     */
    getByGid: async (gid) => {
        const statue = await Statue.findOne({ gid });
        return statue;
    },

    /**
     * Update Statue by ID
     */
    update: async (id, data) => {
        const statue = await Statue.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return statue;
    },

    /**
     * Delete Statue by ID
     */
    delete: async (id) => {
        const statue = await Statue.findByIdAndDelete(id);
        return statue;
    },

    /**
     * Update Statue by GID
     */
    updateByGid: async (gid, data) => {
        const statue = await Statue.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return statue;
    },

    /**
     * Delete Statue by GID
     */
    deleteByGid: async (gid) => {
        const statue = await Statue.findOneAndDelete({ gid });
        return statue;
    },
};

module.exports = StatueService;
