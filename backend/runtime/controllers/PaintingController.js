const PaintingService = require('../services/PaintingService');

/**
 * PaintingController
 * Handles HTTP requests for Painting resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const PaintingController = {

    create: async (req, res) => {
        try {
            const instance = await PaintingService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Painting:', error);
            res.status(500).json({ message: 'Failed to create Painting', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await PaintingService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Painting list:', error);
            res.status(500).json({ message: 'Failed to get Painting list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await PaintingService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Painting:', error);
            res.status(500).json({ message: 'Failed to get Painting', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await PaintingService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Painting by GID:', error);
            res.status(500).json({ message: 'Failed to get Painting', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await PaintingService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Painting:', error);
            res.status(500).json({ message: 'Failed to update Painting', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await PaintingService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Painting:', error);
            res.status(500).json({ message: 'Failed to delete Painting', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await PaintingService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Painting:', error);
            res.status(500).json({ message: 'Failed to update Painting', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await PaintingService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Painting:', error);
            res.status(500).json({ message: 'Failed to delete Painting', error: error.message });
        }
    },
};

module.exports = PaintingController;
