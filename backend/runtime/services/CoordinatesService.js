const { Coordinates } = require('../models/Coordinates');

/**
 * CoordinatesService
 * Handles CRUD operations for Coordinates documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const CoordinatesService = {

    /**
     * Create a new Coordinates
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'coordinates-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const coordinates = await Coordinates.create(data);
        return coordinates;
    },

    /**
     * Get all Coordinates documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Coordinates.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Coordinates by ID
     */
    getById: async (id) => {
        const coordinates = await Coordinates.findById(id);
        return coordinates;
    },

    /**
     * Get Coordinates by GID
     */
    getByGid: async (gid) => {
        const coordinates = await Coordinates.findOne({ gid });
        return coordinates;
    },

    /**
     * Update Coordinates by ID
     */
    update: async (id, data) => {
        const coordinates = await Coordinates.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return coordinates;
    },

    /**
     * Delete Coordinates by ID
     */
    delete: async (id) => {
        const coordinates = await Coordinates.findByIdAndDelete(id);
        return coordinates;
    },

    /**
     * Update Coordinates by GID
     */
    updateByGid: async (gid, data) => {
        const coordinates = await Coordinates.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return coordinates;
    },

    /**
     * Delete Coordinates by GID
     */
    deleteByGid: async (gid) => {
        const coordinates = await Coordinates.findOneAndDelete({ gid });
        return coordinates;
    },
};

module.exports = CoordinatesService;
