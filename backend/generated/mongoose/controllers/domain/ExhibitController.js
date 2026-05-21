const ExhibitService = require('../../services/domain/ExhibitService');
const TelemetryService = require('../../services/domain/TelemetryService');
const ReplayService = require('../../services/domain/DeteriorationReplayService');

/**
 * ExhibitController
 * Cross-entity query endpoints for all exhibit types.
 * Migrated from Micronaut EOL ExhibitOperations.
 */
const ExhibitController = {

    // GET /exhibits — all exhibits across all types
    getAll: async (req, res) => {
        try {
            const results = await ExhibitService.getAll();
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits:', error);
            res.status(500).json({ message: 'Failed to get exhibits', error: error.message });
        }
    },

    // GET /exhibits/status/:status — filter by conservation status
    getByStatus: async (req, res) => {
        try {
            const results = await ExhibitService.getByStatus(req.params.status);
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits by status:', error);
            res.status(500).json({ message: 'Failed to get exhibits by status', error: error.message });
        }
    },

    // GET /exhibits/critical — exhibits in critical condition
    getCritical: async (req, res) => {
        try {
            const results = await ExhibitService.getCritical();
            res.json(results);
        } catch (error) {
            console.error('Failed to get critical exhibits:', error);
            res.status(500).json({ message: 'Failed to get critical exhibits', error: error.message });
        }
    },

    // GET /exhibits/material/:material — filter by material
    getByMaterial: async (req, res) => {
        try {
            const results = await ExhibitService.getByMaterial(req.params.material);
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits by material:', error);
            res.status(500).json({ message: 'Failed to get exhibits by material', error: error.message });
        }
    },

    // GET /exhibits/period/:period — filter by period
    getByPeriod: async (req, res) => {
        try {
            const results = await ExhibitService.getByPeriod(req.params.period);
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits by period:', error);
            res.status(500).json({ message: 'Failed to get exhibits by period', error: error.message });
        }
    },

    // GET /exhibits/with-defects — exhibits that have defects
    getWithDefects: async (req, res) => {
        try {
            const results = await ExhibitService.getWithDefects();
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits with defects:', error);
            res.status(500).json({ message: 'Failed to get exhibits with defects', error: error.message });
        }
    },

    // GET /exhibits/requiring-attention — exhibits with critical/severe defects
    getRequiringAttention: async (req, res) => {
        try {
            const results = await ExhibitService.getRequiringAttention();
            res.json(results);
        } catch (error) {
            console.error('Failed to get exhibits requiring attention:', error);
            res.status(500).json({ message: 'Failed to get exhibits requiring attention', error: error.message });
        }
    },

    // PUT /exhibits/:gid/inspection — record inspection
    setInspection: async (req, res) => {
        try {
            const { lastInspectionDate, inspectionNotes } = req.body;
            if (lastInspectionDate == null || inspectionNotes == null) {
                return res.status(400).json({ message: 'Missing required fields: lastInspectionDate, inspectionNotes' });
            }
            const result = await ExhibitService.setInspection(req.params.gid, lastInspectionDate, inspectionNotes);
            if (!result) {
                return res.status(404).json({ message: 'Exhibit not found' });
            }
            res.json(result);
        } catch (error) {
            console.error('Failed to set inspection:', error);
            res.status(500).json({ message: 'Failed to set inspection', error: error.message });
        }
    },

    // PUT /exhibits/:gid/conservation-status — update conservation status
    updateConservationStatus: async (req, res) => {
        try {
            const { conservationStatus } = req.body;
            if (!conservationStatus) {
                return res.status(400).json({ message: 'Missing required field: conservationStatus' });
            }
            const result = await ExhibitService.updateConservationStatus(req.params.gid, conservationStatus);
            if (!result) {
                return res.status(404).json({ message: 'Exhibit not found' });
            }
            res.json(result);
        } catch (error) {
            console.error('Failed to update conservation status:', error);
            res.status(500).json({ message: 'Failed to update conservation status', error: error.message });
        }
    },

    // PUT /exhibits/:gid/coordinates — set coordinates
    setCoordinates: async (req, res) => {
        try {
            const { x, y, z } = req.body;
            if (x == null || y == null || z == null) {
                return res.status(400).json({ message: 'Missing required fields: x, y, z' });
            }
            const result = await ExhibitService.setCoordinates(req.params.gid, x, y, z);
            if (!result) {
                return res.status(404).json({ message: 'Exhibit not found' });
            }
            res.json(result);
        } catch (error) {
            console.error('Failed to set coordinates:', error);
            res.status(500).json({ message: 'Failed to set coordinates', error: error.message });
        }
    },

    // ── Defects: per-exhibit observation log ────────────────────────────

    // GET /exhibits/:gid/defects
    listDefects: async (req, res) => {
        try {
            const defects = await ExhibitService.listDefects(req.params.gid);
            if (defects === null) return res.status(404).json({ message: 'Exhibit not found' });
            res.json(defects);
        } catch (error) {
            console.error('Failed to list defects:', error);
            res.status(500).json({ message: 'Failed to list defects', error: error.message });
        }
    },

    // POST /exhibits/:gid/defects
    addDefect: async (req, res) => {
        try {
            const created = await ExhibitService.addDefect(req.params.gid, req.body || {});
            if (!created) return res.status(404).json({ message: 'Exhibit not found' });
            res.status(201).json(created);
        } catch (error) {
            console.error('Failed to add defect:', error);
            res.status(500).json({ message: 'Failed to add defect', error: error.message });
        }
    },

    // PUT /exhibits/:gid/defects/:defectGid
    updateDefect: async (req, res) => {
        try {
            const updated = await ExhibitService.updateDefect(
                req.params.gid, req.params.defectGid, req.body || {}
            );
            if (updated === null) return res.status(404).json({ message: 'Exhibit or defect not found' });
            res.json(updated);
        } catch (error) {
            console.error('Failed to update defect:', error);
            res.status(500).json({ message: 'Failed to update defect', error: error.message });
        }
    },

    // DELETE /exhibits/:gid/defects/:defectGid
    removeDefect: async (req, res) => {
        try {
            const result = await ExhibitService.removeDefect(req.params.gid, req.params.defectGid);
            if (result === null) return res.status(404).json({ message: 'Exhibit not found' });
            if (result === false) return res.status(404).json({ message: 'Defect not found' });
            res.json({ message: 'Defect removed' });
        } catch (error) {
            console.error('Failed to remove defect:', error);
            res.status(500).json({ message: 'Failed to remove defect', error: error.message });
        }
    },

    // GET /exhibits/:gid/deterioration/replay?from=...&to=...&forecast=true&maxYears=200
    replayDeterioration: async (req, res) => {
        try {
            const { gid } = req.params;
            const { from, to, forecast, maxYears } = req.query;
            const result = await ReplayService.replayHistory(gid, {
                from, to,
                forecast: forecast === 'true' || forecast === '1',
                maxYears: maxYears ? parseInt(maxYears) : 200
            });
            res.json(result);
        } catch (error) {
            console.error('Failed to replay deterioration:', error);
            res.status(500).json({ message: 'Failed to replay deterioration', error: error.message });
        }
    },

    // GET /exhibits/:gid/environment?from=...&to=...&interval=raw|hourly|daily
    getEnvironment: async (req, res) => {
        try {
            const { gid } = req.params;
            const { from, to, interval = 'hourly' } = req.query;

            // Resolve artifact and its parent cave
            const found = await ExhibitService._findByGid(gid);
            if (!found) return res.status(404).json({ error: `Exhibit ${gid} not found` });
            const caveGid = await ExhibitService._findParentCaveGid(gid);

            // Resolve which sensors speak for this artifact
            const sensors = await TelemetryService.sensorsForArtifact(gid, caveGid);
            if (sensors.length === 0) {
                return res.json({
                    artifactGid: gid,
                    artifactType: found.type,
                    caveGid,
                    sensors: [],
                    samples: [],
                    summary: null,
                    note: 'No sensors are linked to this artifact or its parent cave.'
                });
            }

            const sensorIds = sensors.map(s => s._id);
            const result = await TelemetryService.queryEnvironment(sensorIds, {
                from, to, interval, limit: 50000
            });

            res.json({
                artifactGid: gid,
                artifactType: found.type,
                caveGid,
                sensors: sensors.map(s => ({ gid: s.gid, name: s.name, model: s.model })),
                interval,
                ...result
            });
        } catch (error) {
            console.error('Failed to query environment:', error);
            res.status(500).json({ message: 'Failed to query environment', error: error.message });
        }
    }
};

module.exports = ExhibitController;
