const DefectService = require('../services/DefectService');

/**
 * DefectController
 * Handles HTTP requests for Defect resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const DefectController = {

    create: async (req, res) => {
        try {
            const instance = await DefectService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create Defect:', error);
            res.status(500).json({ message: 'Failed to create Defect', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await DefectService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get Defect list:', error);
            res.status(500).json({ message: 'Failed to get Defect list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await DefectService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Defect:', error);
            res.status(500).json({ message: 'Failed to get Defect', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await DefectService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get Defect by GID:', error);
            res.status(500).json({ message: 'Failed to get Defect', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await DefectService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Defect:', error);
            res.status(500).json({ message: 'Failed to update Defect', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await DefectService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Defect:', error);
            res.status(500).json({ message: 'Failed to delete Defect', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await DefectService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update Defect:', error);
            res.status(500).json({ message: 'Failed to update Defect', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await DefectService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete Defect:', error);
            res.status(500).json({ message: 'Failed to delete Defect', error: error.message });
        }
    },
};

module.exports = DefectController;
