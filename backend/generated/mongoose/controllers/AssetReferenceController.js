const AssetReferenceService = require('../services/AssetReferenceService');

/**
 * AssetReferenceController
 * Handles HTTP requests for AssetReference resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const AssetReferenceController = {

    create: async (req, res) => {
        try {
            const instance = await AssetReferenceService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create AssetReference:', error);
            res.status(500).json({ message: 'Failed to create AssetReference', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await AssetReferenceService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get AssetReference list:', error);
            res.status(500).json({ message: 'Failed to get AssetReference list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await AssetReferenceService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get AssetReference:', error);
            res.status(500).json({ message: 'Failed to get AssetReference', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await AssetReferenceService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get AssetReference by GID:', error);
            res.status(500).json({ message: 'Failed to get AssetReference', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await AssetReferenceService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update AssetReference:', error);
            res.status(500).json({ message: 'Failed to update AssetReference', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await AssetReferenceService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete AssetReference:', error);
            res.status(500).json({ message: 'Failed to delete AssetReference', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await AssetReferenceService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update AssetReference:', error);
            res.status(500).json({ message: 'Failed to update AssetReference', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await AssetReferenceService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete AssetReference:', error);
            res.status(500).json({ message: 'Failed to delete AssetReference', error: error.message });
        }
    },
};

module.exports = AssetReferenceController;
