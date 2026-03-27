const HumidityService = require('../services/HumidityService');

/**
 * HumidityController
 * Handles HTTP requests for Humidity resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const HumidityController = {

    create: async (req, res) => {
        try {
            const instance = await HumidityService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Humidity:', error);
            res.status(500).json({ message: 'Failed to create Humidity', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await HumidityService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Humidity list:', error);
            res.status(500).json({ message: 'Failed to get Humidity list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await HumidityService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Humidity:', error);
            res.status(500).json({ message: 'Failed to get Humidity', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await HumidityService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Humidity by GID:', error);
            res.status(500).json({ message: 'Failed to get Humidity', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await HumidityService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Humidity:', error);
            res.status(500).json({ message: 'Failed to update Humidity', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await HumidityService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Humidity:', error);
            res.status(500).json({ message: 'Failed to delete Humidity', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await HumidityService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Humidity:', error);
            res.status(500).json({ message: 'Failed to update Humidity', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await HumidityService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Humidity:', error);
            res.status(500).json({ message: 'Failed to delete Humidity', error: error.message });
        }
    },
};

module.exports = HumidityController;
