const EmulatorService = require('../../services/domain/EmulatorService');

function requireAdmin(req, res) {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Only admin can control the emulator' });
        return false;
    }
    return true;
}

module.exports = {

    /** GET /emulator/status — list every sensor with its current runner state. */
    async status(req, res) {
        try {
            if (!requireAdmin(req, res)) return;
            const out = await EmulatorService.status();
            res.json({
                defaults: EmulatorService.DEFAULT_PARAMS,
                sensors: out
            });
        } catch (err) {
            console.error('Emulator.status error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /emulator/sensors/:gid/start — body: { cadenceSec, channels, params } */
    async start(req, res) {
        try {
            if (!requireAdmin(req, res)) return;
            const snap = await EmulatorService.start(req.params.gid, req.body || {});
            res.status(200).json(snap);
        } catch (err) {
            console.error('Emulator.start error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /emulator/sensors/:gid/stop */
    async stop(req, res) {
        try {
            if (!requireAdmin(req, res)) return;
            const snap = EmulatorService.stop(req.params.gid);
            res.status(200).json(snap);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * PATCH /emulator/sensors/:gid/config  — live config update (no restart).
     * Body: any of { cadenceSec, channels, params }. Returns 404 if the
     * runner isn't currently running.
     */
    async updateConfig(req, res) {
        try {
            if (!requireAdmin(req, res)) return;
            const snap = EmulatorService.updateConfig(req.params.gid, req.body || {});
            if (!snap) return res.status(404).json({ error: 'Emulator not running for this sensor' });
            res.status(200).json(snap);
        } catch (err) {
            console.error('Emulator.updateConfig error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /** POST /emulator/sensors/:gid/catchup — body: { days, channels, params } */
    async catchup(req, res) {
        try {
            if (!requireAdmin(req, res)) return;
            const result = await EmulatorService.catchup(req.params.gid, req.body || {});
            res.status(201).json(result);
        } catch (err) {
            console.error('Emulator.catchup error:', err);
            res.status(500).json({ error: err.message });
        }
    }
};
