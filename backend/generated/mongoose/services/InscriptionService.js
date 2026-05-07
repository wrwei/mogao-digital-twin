const { Inscription } = require('../models/Inscription');

/**
 * InscriptionService
 * Handles CRUD operations for Inscription documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const InscriptionService = {

    /**
     * Create a new Inscription
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'inscription-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const inscription = await Inscription.create(data);
        return inscription;
    },

    /**
     * Get all Inscription documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Inscription.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Inscription by ID
     */
    getById: async (id) => {
        const inscription = await Inscription.findById(id);
        return inscription;
    },

    /**
     * Get Inscription by GID
     */
    getByGid: async (gid) => {
        const inscription = await Inscription.findOne({ gid });
        return inscription;
    },

    /**
     * Update Inscription by ID
     */
    update: async (id, data) => {
        const inscription = await Inscription.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return inscription;
    },

    /**
     * Delete Inscription by ID
     */
    delete: async (id) => {
        const inscription = await Inscription.findByIdAndDelete(id);
        return inscription;
    },

    /**
     * Update Inscription by GID
     */
    updateByGid: async (gid, data) => {
        const inscription = await Inscription.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return inscription;
    },

    /**
     * Delete Inscription by GID
     */
    deleteByGid: async (gid) => {
        const inscription = await Inscription.findOneAndDelete({ gid });
        return inscription;
    },
};

module.exports = InscriptionService;
