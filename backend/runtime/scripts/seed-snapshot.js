/**
 * Seed a Snapshot record by uploading a local image file against the
 * /snapshots/ingest endpoint using an existing sensor's API key.
 *
 * Usage (from backend/runtime):
 *     node scripts/seed-snapshot.js <path-to-image> <sensor-api-key> [artifactGid]
 *
 * Env vars:
 *     BACKEND_URL      default: http://localhost:8008
 *
 * Example:
 *     node scripts/seed-snapshot.js ./demo.jpg ab12cd34.theFullSecret cave-1-statue-1
 *
 * Notes:
 *   - The sensor identified by the API key MUST have channels including 'image'
 *     for this to be a camera-type sensor (semantic, not enforced by schema).
 *   - The script uses Node 18+'s built-in fetch + FormData.
 */

const fs = require('fs');
const path = require('path');

async function main() {
    const [, , imagePath, apiKey, artifactGid] = process.argv;
    if (!imagePath || !apiKey) {
        console.error('Usage: node scripts/seed-snapshot.js <path-to-image> <sensor-api-key> [artifactGid]');
        process.exit(2);
    }
    if (!fs.existsSync(imagePath)) {
        console.error(`Image not found: ${imagePath}`);
        process.exit(2);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8008';
    const buffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType =
        ext === '.png'  ? 'image/png'  :
        ext === '.webp' ? 'image/webp' :
        'image/jpeg';

    const form = new FormData();
    form.append('frame', new Blob([buffer], { type: mimeType }), path.basename(imagePath));
    form.append('capturedAt', new Date().toISOString());
    if (artifactGid) form.append('artifactGid', artifactGid);

    const res = await fetch(`${backendUrl}/snapshots/ingest`, {
        method: 'POST',
        headers: { 'X-Sensor-Key': apiKey },
        body: form
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error(`POST /snapshots/ingest → ${res.status}`);
        console.error(json);
        process.exit(1);
    }
    console.log('✔ Snapshot ingested:');
    console.log(JSON.stringify(json, null, 2));
}

main().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
