const DTPackageService = require('../services/DTPackageService');

/**
 * DTPackageController
 * Handles HTTP requests for DTPackage resources
 * Auto-generated from mogao_dt.ecore metamodel
 */
const DTPackageController = {

    create: async (req, res) => {
        try {
            const instance = await DTPackageService.create(req.body);
            res.status(201).json(instance);
        } catch (error) {
            console.error('Failed to create DTPackage:', error);
            res.status(500).json({ message: 'Failed to create DTPackage', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const instances = await DTPackageService.getAll(req.query);
            res.json(instances);
        } catch (error) {
            console.error('Failed to get DTPackage list:', error);
            res.status(500).json({ message: 'Failed to get DTPackage list', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const instance = await DTPackageService.getById(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get DTPackage:', error);
            res.status(500).json({ message: 'Failed to get DTPackage', error: error.message });
        }
    },

    getByGid: async (req, res) => {
        try {
            const instance = await DTPackageService.getByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to get DTPackage by GID:', error);
            res.status(500).json({ message: 'Failed to get DTPackage', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const instance = await DTPackageService.update(req.params.id, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update DTPackage:', error);
            res.status(500).json({ message: 'Failed to update DTPackage', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const instance = await DTPackageService.delete(req.params.id);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete DTPackage:', error);
            res.status(500).json({ message: 'Failed to delete DTPackage', error: error.message });
        }
    },

    updateByGid: async (req, res) => {
        try {
            const instance = await DTPackageService.updateByGid(req.params.gid, req.body);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to update DTPackage:', error);
            res.status(500).json({ message: 'Failed to update DTPackage', error: error.message });
        }
    },

    deleteByGid: async (req, res) => {
        try {
            const instance = await DTPackageService.deleteByGid(req.params.gid);
            if (!instance) {
                return res.status(404).json({ message: 'Not found' });
            }
            res.json(instance);
        } catch (error) {
            console.error('Failed to delete DTPackage:', error);
            res.status(500).json({ message: 'Failed to delete DTPackage', error: error.message });
        }
    },
};

module.exports = DTPackageController;
