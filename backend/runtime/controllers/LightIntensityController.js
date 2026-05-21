const LightIntensityService = require('../services/LightIntensityService');

/**
 * LightIntensityController
 * Handles HTTP requests for LightIntensity resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const LightIntensityController = {

    create: async (req, res) => {
        try {
            const instance = await LightIntensityService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create LightIntensity:', error);
            res.status(500).json({ message: 'Failed to create LightIntensity', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await LightIntensityService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get LightIntensity list:', error);
            res.status(500).json({ message: 'Failed to get LightIntensity list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await LightIntensityService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get LightIntensity:', error);
            res.status(500).json({ message: 'Failed to get LightIntensity', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await LightIntensityService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get LightIntensity by GID:', error);
            res.status(500).json({ message: 'Failed to get LightIntensity', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await LightIntensityService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update LightIntensity:', error);
            res.status(500).json({ message: 'Failed to update LightIntensity', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await LightIntensityService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete LightIntensity:', error);
            res.status(500).json({ message: 'Failed to delete LightIntensity', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await LightIntensityService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update LightIntensity:', error);
            res.status(500).json({ message: 'Failed to update LightIntensity', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await LightIntensityService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete LightIntensity:', error);
            res.status(500).json({ message: 'Failed to delete LightIntensity', error: error.message });
        }
    },
};

module.exports = LightIntensityController;
