const { Temperature } = require('../models/Temperature');

/**
 * TemperatureService
 * Handles CRUD operations for Temperature documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const TemperatureService = {

    /**
     * Create a new Temperature
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'temperature-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const temperature = await Temperature.create(data);
        return temperature;
    },

    /**
     * Get all Temperature documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Temperature.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Temperature by ID
     */
    getById: async (id) => {
        const temperature = await Temperature.findById(id);
        return temperature;
    },

    /**
     * Get Temperature by GID
     */
    getByGid: async (gid) => {
        const temperature = await Temperature.findOne({ gid });
        return temperature;
    },

    /**
     * Update Temperature by ID
     */
    update: async (id, data) => {
        const temperature = await Temperature.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return temperature;
    },

    /**
     * Delete Temperature by ID
     */
    delete: async (id) => {
        const temperature = await Temperature.findByIdAndDelete(id);
        return temperature;
    },

    /**
     * Update Temperature by GID
     */
    updateByGid: async (gid, data) => {
        const temperature = await Temperature.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return temperature;
    },

    /**
     * Delete Temperature by GID
     */
    deleteByGid: async (gid) => {
        const temperature = await Temperature.findOneAndDelete({ gid });
        return temperature;
    },
};

module.exports = TemperatureService;
