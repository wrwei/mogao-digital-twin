const { Parameter } = require('../models/Parameter');

/**
 * ParameterService
 * Handles CRUD operations for Parameter documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const ParameterService = {

    /**
     * Create a new Parameter
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'parameter-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const parameter = await Parameter.create(data);
        return parameter;
    },

    /**
     * Get all Parameter documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Parameter.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Parameter by ID
     */
    getById: async (id) => {
        const parameter = await Parameter.findById(id);
        return parameter;
    },

    /**
     * Get Parameter by GID
     */
    getByGid: async (gid) => {
        const parameter = await Parameter.findOne({ gid });
        return parameter;
    },

    /**
     * Update Parameter by ID
     */
    update: async (id, data) => {
        const parameter = await Parameter.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return parameter;
    },

    /**
     * Delete Parameter by ID
     */
    delete: async (id) => {
        const parameter = await Parameter.findByIdAndDelete(id);
        return parameter;
    },

    /**
     * Update Parameter by GID
     */
    updateByGid: async (gid, data) => {
        const parameter = await Parameter.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return parameter;
    },

    /**
     * Delete Parameter by GID
     */
    deleteByGid: async (gid) => {
        const parameter = await Parameter.findOneAndDelete({ gid });
        return parameter;
    },
};

module.exports = ParameterService;
