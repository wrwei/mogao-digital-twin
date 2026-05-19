const { Mural } = require('../models/Mural');

/**
 * MuralService
 * Handles CRUD operations for Mural documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const MuralService = {

    /**
     * Create a new Mural
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'mural-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const mural = await Mural.create(data);
        return mural;
    },

    /**
     * Get all Mural documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Mural.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Mural by ID
     */
    getById: async (id) => {
        const mural = await Mural.findById(id);
        return mural;
    },

    /**
     * Get Mural by GID
     */
    getByGid: async (gid) => {
        const mural = await Mural.findOne({ gid });
        return mural;
    },

    /**
     * Update Mural by ID
     */
    update: async (id, data) => {
        const mural = await Mural.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return mural;
    },

    /**
     * Delete Mural by ID
     */
    delete: async (id) => {
        const mural = await Mural.findByIdAndDelete(id);
        return mural;
    },

    /**
     * Update Mural by GID
     */
    updateByGid: async (gid, data) => {
        const mural = await Mural.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return mural;
    },

    /**
     * Delete Mural by GID
     */
    deleteByGid: async (gid) => {
        const mural = await Mural.findOneAndDelete({ gid });
        return mural;
    },
};

module.exports = MuralService;
