const MuralService = require('../services/MuralService');

/**
 * MuralController
 * Handles HTTP requests for Mural resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const MuralController = {

    create: async (req, res) => {
        try {
            const instance = await MuralService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Mural:', error);
            res.status(500).json({ message: 'Failed to create Mural', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await MuralService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Mural list:', error);
            res.status(500).json({ message: 'Failed to get Mural list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await MuralService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Mural:', error);
            res.status(500).json({ message: 'Failed to get Mural', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await MuralService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Mural by GID:', error);
            res.status(500).json({ message: 'Failed to get Mural', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await MuralService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Mural:', error);
            res.status(500).json({ message: 'Failed to update Mural', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await MuralService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Mural:', error);
            res.status(500).json({ message: 'Failed to delete Mural', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await MuralService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Mural:', error);
            res.status(500).json({ message: 'Failed to update Mural', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await MuralService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Mural:', error);
            res.status(500).json({ message: 'Failed to delete Mural', error: error.message });
        }
    },
};

module.exports = MuralController;
