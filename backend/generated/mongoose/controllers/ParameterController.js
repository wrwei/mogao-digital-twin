const ParameterService = require('../services/ParameterService');

/**
 * ParameterController
 * Handles HTTP requests for Parameter resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const ParameterController = {

    create: async (req, res) => {
        try {
            const instance = await ParameterService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Parameter:', error);
            res.status(500).json({ message: 'Failed to create Parameter', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await ParameterService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Parameter list:', error);
            res.status(500).json({ message: 'Failed to get Parameter list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await ParameterService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Parameter:', error);
            res.status(500).json({ message: 'Failed to get Parameter', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await ParameterService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Parameter by GID:', error);
            res.status(500).json({ message: 'Failed to get Parameter', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await ParameterService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Parameter:', error);
            res.status(500).json({ message: 'Failed to update Parameter', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await ParameterService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Parameter:', error);
            res.status(500).json({ message: 'Failed to delete Parameter', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await ParameterService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Parameter:', error);
            res.status(500).json({ message: 'Failed to update Parameter', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await ParameterService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Parameter:', error);
            res.status(500).json({ message: 'Failed to delete Parameter', error: error.message });
        }
    },
};

module.exports = ParameterController;
