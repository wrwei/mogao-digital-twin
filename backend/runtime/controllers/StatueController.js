const StatueService = require('../services/StatueService');

/**
 * StatueController
 * Handles HTTP requests for Statue resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const StatueController = {

    create: async (req, res) => {
        try {
            const instance = await StatueService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Statue:', error);
            res.status(500).json({ message: 'Failed to create Statue', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await StatueService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Statue list:', error);
            res.status(500).json({ message: 'Failed to get Statue list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await StatueService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Statue:', error);
            res.status(500).json({ message: 'Failed to get Statue', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await StatueService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Statue by GID:', error);
            res.status(500).json({ message: 'Failed to get Statue', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await StatueService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Statue:', error);
            res.status(500).json({ message: 'Failed to update Statue', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await StatueService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Statue:', error);
            res.status(500).json({ message: 'Failed to delete Statue', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await StatueService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Statue:', error);
            res.status(500).json({ message: 'Failed to update Statue', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await StatueService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Statue:', error);
            res.status(500).json({ message: 'Failed to delete Statue', error: error.message });
        }
    },
};

module.exports = StatueController;
