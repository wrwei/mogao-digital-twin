const CaveService = require('../services/CaveService');

/**
 * CaveController
 * Handles HTTP requests for Cave resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const CaveController = {

    create: async (req, res) => {
        try {
            const instance = await CaveService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Cave:', error);
            res.status(500).json({ message: 'Failed to create Cave', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await CaveService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Cave list:', error);
            res.status(500).json({ message: 'Failed to get Cave list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await CaveService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Cave:', error);
            res.status(500).json({ message: 'Failed to get Cave', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await CaveService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Cave by GID:', error);
            res.status(500).json({ message: 'Failed to get Cave', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await CaveService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Cave:', error);
            res.status(500).json({ message: 'Failed to update Cave', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await CaveService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Cave:', error);
            res.status(500).json({ message: 'Failed to delete Cave', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await CaveService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Cave:', error);
            res.status(500).json({ message: 'Failed to update Cave', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await CaveService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Cave:', error);
            res.status(500).json({ message: 'Failed to delete Cave', error: error.message });
        }
    },
};

module.exports = CaveController;
