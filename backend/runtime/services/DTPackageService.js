const { DTPackage } = require('../models/DTPackage');

/**
 * DTPackageService
 * Handles CRUD operations for DTPackage documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const DTPackageService = {

    /**
     * Create a new DTPackage
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'dTPackage-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const dTPackage = await DTPackage.create(data);
        return dTPackage;
    },

    /**
     * Get all DTPackage documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = DTPackage.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get DTPackage by ID
     */
    getById: async (id) => {
        const dTPackage = await DTPackage.findById(id);
        return dTPackage;
    },

    /**
     * Get DTPackage by GID
     */
    getByGid: async (gid) => {
        const dTPackage = await DTPackage.findOne({ gid });
        return dTPackage;
    },

    /**
     * Update DTPackage by ID
     */
    update: async (id, data) => {
        const dTPackage = await DTPackage.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return dTPackage;
    },

    /**
     * Delete DTPackage by ID
     */
    delete: async (id) => {
        const dTPackage = await DTPackage.findByIdAndDelete(id);
        return dTPackage;
    },

    /**
     * Update DTPackage by GID
     */
    updateByGid: async (gid, data) => {
        const dTPackage = await DTPackage.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return dTPackage;
    },

    /**
     * Delete DTPackage by GID
     */
    deleteByGid: async (gid) => {
        const dTPackage = await DTPackage.findOneAndDelete({ gid });
        return dTPackage;
    },
};

module.exports = DTPackageService;
