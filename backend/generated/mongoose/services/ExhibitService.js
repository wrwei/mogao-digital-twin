const { Statue } = require('../models/Statue');
const { Mural } = require('../models/Mural');
const { Painting } = require('../models/Painting');
const { Inscription } = require('../models/Inscription');
const { Cave } = require('../models/Cave');

const MODELS = [
    { model: Statue, type: 'statue' },
    { model: Mural, type: 'mural' },
    { model: Painting, type: 'painting' },
    { model: Inscription, type: 'inscription' },
];

/**
 * ExhibitService
 * Cross-entity queries across all exhibit types (Statue, Mural, Painting, Inscription).
 * Migrated from Micronaut EOL ExhibitOperations.
 */
const ExhibitService = {

    /**
     * Query all 4 exhibit collections with a filter and merge results.
     */
    _queryAll: async (filter = {}) => {
        const results = await Promise.all(
            MODELS.map(async ({ model, type }) => {
                const docs = await model.find(filter).lean();
                return docs.map(doc => ({ ...doc, _exhibitType: type }));
            })
        );
        return results.flat();
    },

    /**
     * Find a single exhibit by GID across all collections.
     */
    _findByGid: async (gid) => {
        for (const { model, type } of MODELS) {
            const doc = await model.findOne({ gid });
            if (doc) return { doc, type, model };
        }
        return null;
    },

    /**
     * Find the parent Cave of an exhibit by scanning the caves.exhibits
     * array for either embedded references or nested .gid fields.
     */
    _findParentCaveGid: async (exhibitGid) => {
        const caves = await Cave.find({}).lean();
        for (const c of caves) {
            const exhibits = c.exhibits || [];
            for (const e of exhibits) {
                if (e === exhibitGid) return c.gid;
                if (e && typeof e === 'object' && e.gid === exhibitGid) return c.gid;
                if (e && typeof e === 'object' && e.$ref && e.$id === exhibitGid) return c.gid;
            }
        }
        return null;
    },

    /**
     * Get all exhibits across all types.
     */
    getAll: async () => {
        return ExhibitService._queryAll();
    },

    /**
     * Get exhibits filtered by conservation status.
     */
    getByStatus: async (status) => {
        return ExhibitService._queryAll({ conservationStatus: status });
    },

    /**
     * Get exhibits in critical condition.
     */
    getCritical: async () => {
        return ExhibitService._queryAll({ conservationStatus: 'critical' });
    },

    /**
     * Get exhibits filtered by material.
     */
    getByMaterial: async (material) => {
        return ExhibitService._queryAll({ material });
    },

    /**
     * Get exhibits filtered by period.
     */
    getByPeriod: async (period) => {
        return ExhibitService._queryAll({ period });
    },

    /**
     * Get exhibits that have at least one defect.
     */
    getWithDefects: async () => {
        return ExhibitService._queryAll({
            defects: { $exists: true, $not: { $size: 0 } }
        });
    },

    /**
     * Get exhibits with critical or severe defects (requiring attention).
     */
    getRequiringAttention: async () => {
        return ExhibitService._queryAll({
            'defects.severity': { $in: ['critical', 'severe'] }
        });
    },

    /**
     * Record an inspection on an exhibit (by GID, across all types).
     */
    setInspection: async (gid, lastInspectionDate, inspectionNotes) => {
        const found = await ExhibitService._findByGid(gid);
        if (!found) return null;
        const updated = await found.model.findOneAndUpdate(
            { gid },
            { lastInspectionDate, inspectionNotes },
            { new: true, runValidators: true }
        );
        return updated ? { ...updated.toObject(), _exhibitType: found.type } : null;
    },

    /**
     * Update conservation status of an exhibit (by GID, across all types).
     */
    updateConservationStatus: async (gid, conservationStatus) => {
        const found = await ExhibitService._findByGid(gid);
        if (!found) return null;
        const updated = await found.model.findOneAndUpdate(
            { gid },
            { conservationStatus },
            { new: true, runValidators: true }
        );
        return updated ? { ...updated.toObject(), _exhibitType: found.type } : null;
    },

    /**
     * Set coordinates on an exhibit (by GID, across all types).
     */
    setCoordinates: async (gid, x, y, z) => {
        const found = await ExhibitService._findByGid(gid);
        if (!found) return null;
        const updated = await found.model.findOneAndUpdate(
            { gid },
            { coordinates: { x, y, z } },
            { new: true, runValidators: true }
        );
        return updated ? { ...updated.toObject(), _exhibitType: found.type } : null;
    },
};

module.exports = ExhibitService;
