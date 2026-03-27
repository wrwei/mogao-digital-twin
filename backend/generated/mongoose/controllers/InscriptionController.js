const InscriptionService = require('../services/InscriptionService');

/**
 * InscriptionController
 * Handles HTTP requests for Inscription resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const InscriptionController = {

    create: async (req, res) => {
        try {
            const instance = await InscriptionService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Inscription:', error);
            res.status(500).json({ message: 'Failed to create Inscription', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await InscriptionService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Inscription list:', error);
            res.status(500).json({ message: 'Failed to get Inscription list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await InscriptionService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Inscription:', error);
            res.status(500).json({ message: 'Failed to get Inscription', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await InscriptionService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Inscription by GID:', error);
            res.status(500).json({ message: 'Failed to get Inscription', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await InscriptionService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Inscription:', error);
            res.status(500).json({ message: 'Failed to update Inscription', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await InscriptionService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Inscription:', error);
            res.status(500).json({ message: 'Failed to delete Inscription', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await InscriptionService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Inscription:', error);
            res.status(500).json({ message: 'Failed to update Inscription', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await InscriptionService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Inscription:', error);
            res.status(500).json({ message: 'Failed to delete Inscription', error: error.message });
        }
    },
};

module.exports = InscriptionController;
