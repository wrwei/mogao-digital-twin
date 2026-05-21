/**
 * Register a sensor and print its API key (shown once).
 *
 * Usage (from backend/runtime):
 *     node scripts/seed-sensor.js
 *
 * Env vars (all optional):
 *     MONGO_URI        default: mongodb://localhost:27017/mogao_dt
 *     SENSOR_NAME      default: Demo Cave-1 Logger
 *     SENSOR_MODEL     default: HOBO MX2301A
 *     SENSOR_CAVE      default: cave-1     (Cave gid this sensor belongs to)
 *     SENSOR_CHANNELS  default: temperature,humidity
 *
 * Output:
 *     sensor gid + plaintext API key (store this; it is NEVER shown again).
 */

const mongoose = require('mongoose');
const TelemetryService = require('../services/domain/TelemetryService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mogao_dt';

(async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const fields = {
            name: process.env.SENSOR_NAME || 'Demo Cave-1 Logger',
            model: process.env.SENSOR_MODEL || 'HOBO MX2301A',
            channels: (process.env.SENSOR_CHANNELS || 'temperature,humidity').split(','),
            location: {
                cave: process.env.SENSOR_CAVE || 'cave-1',
                placementNote: 'Seeded for development — replace with real deployment metadata.'
            }
        };

        const { sensor, apiKey } = await TelemetryService.registerSensor(fields);

        console.log('✔ Sensor registered:');
        console.log(`    gid      : ${sensor.gid}`);
        console.log(`    name     : ${sensor.name}`);
        console.log(`    cave     : ${sensor.location.cave}`);
        console.log(`    channels : ${sensor.channels.join(', ')}`);
        console.log('');
        console.log('  API KEY (store this — it will NEVER be shown again):');
        console.log(`    ${apiKey}`);
        console.log('');
        console.log('  Use it to submit samples:');
        console.log('    curl -X POST http://localhost:8008/telemetry/samples/batch \\');
        console.log(`         -H "X-Sensor-Key: ${apiKey}" \\`);
        console.log('         -H "Content-Type: application/json" \\');
        console.log('         -d \'{"samples":[{"timestamp":"2026-04-18T10:00:00Z","temperature":13.2,"humidity":37.4}]}\'');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    }
})();
