const CoordinatesService = require('../services/CoordinatesService');

/**
 * CoordinatesController
 * Handles HTTP requests for Coordinates resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const CoordinatesController = {

    create: async (req, res) => {
        try {
            const instance = await CoordinatesService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Coordinates:', error);
            res.status(500).json({ message: 'Failed to create Coordinates', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await CoordinatesService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Coordinates list:', error);
            res.status(500).json({ message: 'Failed to get Coordinates list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await CoordinatesService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Coordinates:', error);
            res.status(500).json({ message: 'Failed to get Coordinates', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await CoordinatesService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Coordinates by GID:', error);
            res.status(500).json({ message: 'Failed to get Coordinates', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await CoordinatesService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Coordinates:', error);
            res.status(500).json({ message: 'Failed to update Coordinates', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await CoordinatesService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Coordinates:', error);
            res.status(500).json({ message: 'Failed to delete Coordinates', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await CoordinatesService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Coordinates:', error);
            res.status(500).json({ message: 'Failed to update Coordinates', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await CoordinatesService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Coordinates:', error);
            res.status(500).json({ message: 'Failed to delete Coordinates', error: error.message });
        }
    },
};

module.exports = CoordinatesController;
