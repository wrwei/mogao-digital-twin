const bcrypt = require('bcryptjs');
const { Sensor } = require('../models/Sensor');

/**
 * Sensor API-key authentication.
 *
 * Expects header:
 *     X-Sensor-Key: <prefix>.<secret>
 *
 * The <prefix> is the first 8 characters of the key (stored in plaintext
 * on the Sensor document) — used as an index lookup. The full key is
 * verified against the bcrypt hash.
 *
 * On success: req.sensor is set to the Sensor document.
 */
async function sensorAuth(req, res, next) {
    const header = req.headers['x-sensor-key'];
    if (!header || typeof header !== 'string' || !header.includes('.')) {
        return res.status(401).json({ error: 'Missing or malformed X-Sensor-Key header' });
    }
    const [prefix, secret] = header.split('.', 2);
    if (!prefix || !secret) {
        return res.status(401).json({ error: 'Malformed sensor key' });
    }

    try {
        // Lookup by prefix narrows to usually a single candidate
        const sensor = await Sensor.findOne({ apiKeyPrefix: prefix });
        if (!sensor) {
            return res.status(401).json({ error: 'Unknown sensor key' });
        }
        const ok = await bcrypt.compare(header, sensor.apiKeyHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid sensor key' });
        }
        if (!sensor.status.active) {
            return res.status(403).json({ error: 'Sensor is inactive' });
        }
        req.sensor = sensor;
        next();
    } catch (err) {
        console.error('sensorAuth error:', err);
        return res.status(500).json({ error: 'Sensor authentication failed' });
    }
}

module.exports = { sensorAuth };
