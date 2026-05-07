const { Humidity } = require('../models/Humidity');

/**
 * HumidityService
 * Handles CRUD operations for Humidity documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const HumidityService = {

    /**
     * Create a new Humidity
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'humidity-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const humidity = await Humidity.create(data);
        return humidity;
    },

    /**
     * Get all Humidity documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Humidity.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Humidity by ID
     */
    getById: async (id) => {
        const humidity = await Humidity.findById(id);
        return humidity;
    },

    /**
     * Get Humidity by GID
     */
    getByGid: async (gid) => {
        const humidity = await Humidity.findOne({ gid });
        return humidity;
    },

    /**
     * Update Humidity by ID
     */
    update: async (id, data) => {
        const humidity = await Humidity.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return humidity;
    },

    /**
     * Delete Humidity by ID
     */
    delete: async (id) => {
        const humidity = await Humidity.findByIdAndDelete(id);
        return humidity;
    },

    /**
     * Update Humidity by GID
     */
    updateByGid: async (gid, data) => {
        const humidity = await Humidity.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return humidity;
    },

    /**
     * Delete Humidity by GID
     */
    deleteByGid: async (gid) => {
        const humidity = await Humidity.findOneAndDelete({ gid });
        return humidity;
    },
};

module.exports = HumidityService;
