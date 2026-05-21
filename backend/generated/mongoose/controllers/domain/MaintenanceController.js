const MaintenanceService = require('../../services/domain/MaintenanceService');
const AnomalyService = require('../../services/domain/AnomalyDetectionService');

module.exports = {
    /** GET /maintenance/queue — all artifacts scored and sorted */
    async queue(req, res) {
        try {
            const results = await MaintenanceService.scoreAll();
            res.json(results);
        } catch (err) {
            console.error('Maintenance queue failed:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /maintenance/artifact/:gid — score for a single artifact */
    async artifactScore(req, res) {
        try {
            const ExhibitService = require('../../services/domain/ExhibitService');
            const found = await ExhibitService._findByGid(req.params.gid);
            if (!found) return res.status(404).json({ error: 'Artifact not found' });
            const score = await MaintenanceService.scoreArtifact(found.doc.toObject(), found.type);
            res.json(score);
        } catch (err) {
            console.error('Artifact score failed:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /anomalies — every active anomaly across the fleet */
    async allAnomalies(req, res) {
        try {
            const results = await AnomalyService.detectAll();
            res.json(results);
        } catch (err) {
            console.error('Anomaly scan failed:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** GET /sensors/:gid/anomalies — anomalies for a single sensor */
    async sensorAnomalies(req, res) {
        try {
            const results = await AnomalyService.detectByGid(req.params.gid);
            if (results === null) return res.status(404).json({ error: 'Sensor not found' });
            res.json(results);
        } catch (err) {
            console.error('Sensor anomaly detection failed:', err);
            res.status(500).json({ error: err.message });
        }
    }
};
