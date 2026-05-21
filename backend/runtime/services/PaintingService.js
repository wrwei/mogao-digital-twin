const { Painting } = require('../models/Painting');

/**
 * PaintingService
 * Handles CRUD operations for Painting documents
 * Auto-generated from mogao_dt.ecore metamodel
 */
const PaintingService = {

    /**
     * Create a new Painting
     */
    create: async (data) => {
        // Always generate gid server-side to prevent client-supplied collisions
        data.gid = 'painting-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        delete data._id;
        const painting = await Painting.create(data);
        return painting;
    },

    /**
     * Get all Painting documents.
     * Optional query: { page, limit, sort } for pagination + ordering.
     */
    getAll: async (query = {}) => {
        const { page, limit, sort } = query;
        let q = Painting.find();
        if (sort) q = q.sort(sort);
        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            q = q.skip(skip).limit(parseInt(limit));
        }
        return q.exec();
    },

    /**
     * Get Painting by ID
     */
    getById: async (id) => {
        const painting = await Painting.findById(id);
        return painting;
    },

    /**
     * Get Painting by GID
     */
    getByGid: async (gid) => {
        const painting = await Painting.findOne({ gid });
        return painting;
    },

    /**
     * Update Painting by ID
     */
    update: async (id, data) => {
        const painting = await Painting.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return painting;
    },

    /**
     * Delete Painting by ID
     */
    delete: async (id) => {
        const painting = await Painting.findByIdAndDelete(id);
        return painting;
    },

    /**
     * Update Painting by GID
     */
    updateByGid: async (gid, data) => {
        const painting = await Painting.findOneAndUpdate({ gid }, data, { new: true, runValidators: true });
        return painting;
    },

    /**
     * Delete Painting by GID
     */
    deleteByGid: async (gid) => {
        const painting = await Painting.findOneAndDelete({ gid });
        return painting;
    },
};

module.exports = PaintingService;
