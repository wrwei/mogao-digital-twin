const TemperatureService = require('../services/TemperatureService');

/**
 * TemperatureController
 * Handles HTTP requests for Temperature resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const TemperatureController = {

    create: async (req, res) => {
        try {
            const instance = await TemperatureService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Temperature:', error);
            res.status(500).json({ message: 'Failed to create Temperature', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await TemperatureService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Temperature list:', error);
            res.status(500).json({ message: 'Failed to get Temperature list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await TemperatureService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Temperature:', error);
            res.status(500).json({ message: 'Failed to get Temperature', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await TemperatureService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Temperature by GID:', error);
            res.status(500).json({ message: 'Failed to get Temperature', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await TemperatureService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Temperature:', error);
            res.status(500).json({ message: 'Failed to update Temperature', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await TemperatureService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Temperature:', error);
            res.status(500).json({ message: 'Failed to delete Temperature', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await TemperatureService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Temperature:', error);
            res.status(500).json({ message: 'Failed to update Temperature', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await TemperatureService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Temperature:', error);
            res.status(500).json({ message: 'Failed to delete Temperature', error: error.message });
        }
    },
};

module.exports = TemperatureController;
