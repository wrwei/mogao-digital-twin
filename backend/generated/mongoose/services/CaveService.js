const { Cave } = require('../models/Cave');

/**
 * CaveService
 * Handles CRUD operations for Cave documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const CaveService = {

    /**
     * Create a new Cave
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'cave-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const cave = await Cave.create(data);
        return cave;
    },

    /**
     * Get all Cave documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Cave.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Cave by ID
     */
    getById: async (id) => {
        const cave = await Cave.findById(id);
        return cave;
    },

    /**
     * Get Cave by GID
     */
    getByGid: async (gid) => {
        const cave = await Cave.findOne({ gid });
        return cave;
    },

    /**
     * Update Cave by ID
     */
    update: async (id, data) => {
        const cave = await Cave.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return cave;
    },

    /**
     * Delete Cave by ID
     */
    delete: async (id) => {
        const cave = await Cave.findByIdAndDelete(id);
        return cave;
    },

    /**
     * Update Cave by GID
     */
    updateByGid: async (gid, data) => {
        const cave = await Cave.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return cave;
    },

    /**
     * Delete Cave by GID
     */
    deleteByGid: async (gid) => {
        const cave = await Cave.findOneAndDelete({ gid });
        return cave;
    },
};

module.exports = CaveService;
