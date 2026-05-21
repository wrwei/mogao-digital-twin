const { Statue } = require('../../models/Statue');
const { Mural } = require('../../models/Mural');
const { Painting } = require('../../models/Painting');
const { Inscription } = require('../../models/Inscription');
const { Cave } = require('../../models/Cave');

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

    // ── Defects: per-exhibit observation log ────────────────────────────

    /** Return the embedded defects array for a given exhibit. */
    listDefects: async (exhibitGid) => {
        const found = await ExhibitService._findByGid(exhibitGid);
        if (!found) return null;
        return Array.isArray(found.doc.defects) ? found.doc.defects : [];
    },

    /** Append a new defect to the exhibit's defects array. The caller may
     *  supply a gid; otherwise one is generated. detectionDate defaults to
     *  the server clock if missing. */
    addDefect: async (exhibitGid, defectData) => {
        const { v4: uuidv4 } = require('uuid');
        const found = await ExhibitService._findByGid(exhibitGid);
        if (!found) return null;
        const defect = {
            ...defectData,
            gid: defectData.gid || `defect-${uuidv4()}`,
            detectionDate: defectData.detectionDate ?? Date.now()
        };
        const defects = Array.isArray(found.doc.defects) ? [...found.doc.defects] : [];
        defects.push(defect);
        found.doc.defects = defects;
        // The defects field is Schema.Types.Mixed, which Mongoose cannot
        // change-track automatically — markModified is required.
        found.doc.markModified('defects');
        await found.doc.save();
        return defect;
    },

    /** Replace the named defect's fields with the provided patch. The gid is
     *  preserved. Returns the updated defect, or null if exhibit/defect
     *  cannot be found. */
    updateDefect: async (exhibitGid, defectGid, patch) => {
        const found = await ExhibitService._findByGid(exhibitGid);
        if (!found) return null;
        const defects = Array.isArray(found.doc.defects) ? [...found.doc.defects] : [];
        const idx = defects.findIndex(d => d && d.gid === defectGid);
        if (idx < 0) return null;
        defects[idx] = { ...defects[idx], ...patch, gid: defectGid };
        found.doc.defects = defects;
        found.doc.markModified('defects');
        await found.doc.save();
        return defects[idx];
    },

    /** Remove a defect by gid. Returns true if removed, false if not found,
     *  null if the exhibit itself cannot be located. */
    removeDefect: async (exhibitGid, defectGid) => {
        const found = await ExhibitService._findByGid(exhibitGid);
        if (!found) return null;
        const before = (found.doc.defects || []).length;
        found.doc.defects = (found.doc.defects || []).filter(d => !d || d.gid !== defectGid);
        if (found.doc.defects.length === before) return false;
        found.doc.markModified('defects');
        await found.doc.save();
        return true;
    },
};

module.exports = ExhibitService;
