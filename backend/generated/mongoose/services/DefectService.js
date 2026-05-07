const { Defect } = require('../models/Defect');

/**
 * DefectService
 * Handles CRUD operations for Defect documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const DefectService = {

    /**
     * Create a new Defect
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'defect-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const defect = await Defect.create(data);
        return defect;
    },

    /**
     * Get all Defect documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Defect.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Defect by ID
     */
    getById: async (id) => {
        const defect = await Defect.findById(id);
        return defect;
    },

    /**
     * Get Defect by GID
     */
    getByGid: async (gid) => {
        const defect = await Defect.findOne({ gid });
        return defect;
    },

    /**
     * Update Defect by ID
     */
    update: async (id, data) => {
        const defect = await Defect.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return defect;
    },

    /**
     * Delete Defect by ID
     */
    delete: async (id) => {
        const defect = await Defect.findByIdAndDelete(id);
        return defect;
    },

    /**
     * Update Defect by GID
     */
    updateByGid: async (gid, data) => {
        const defect = await Defect.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return defect;
    },

    /**
     * Delete Defect by GID
     */
    deleteByGid: async (gid) => {
        const defect = await Defect.findOneAndDelete({ gid });
        return defect;
    },
};

module.exports = DefectService;
