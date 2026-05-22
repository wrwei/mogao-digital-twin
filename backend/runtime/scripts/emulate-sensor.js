/**
 * Sensor data emulator — pushes synthetic climate samples to the runtime
 * telemetry endpoint using a sensor's API key. Useful for demos (live
 * mode, visible ticking in the UI) and for populating recent history
 * (catchup mode, bulk-backfill the last N days at 10-min cadence).
 *
 * Usage (from backend/runtime):
 *     node scripts/emulate-sensor.js <api-key> [options]
 *
 * Options:
 *     --mode=live|catchup     default: live
 *     --cadence-sec=N         live mode: real seconds between samples (default 10)
 *     --days=N                catchup mode: days of history to fill (default 7)
 *     --channels=T,RH,...     comma-separated; default: temperature,humidity
 *                             use 'temperature' / 'humidity' / 'light'
 *     --backend=URL           default: http://localhost:8008
 *
 * The synthetic generator targets Mogao-realistic conditions:
 *     T  : ~13 °C annual mean, ±2 °C annual cycle, ±0.8 °C diurnal swing, 0.4 °C noise
 *     RH : ~40 %  annual mean, ±8 %  annual cycle, ±2  % diurnal swing,
 *          occasional summer rainfall spikes (jumps to 60–75 %)
 *     I  : 0 klux (cave interior baseline)
 *
 * Examples:
 *     # Live demo: one sample every 5s forever
 *     node scripts/emulate-sensor.js ab12cd34.<secret> --cadence-sec=5
 *
 *     # Backfill the last 30 days of 10-min samples
 *     node scripts/emulate-sensor.js ab12cd34.<secret> --mode=catchup --days=30
 *
 *     # Single-channel temperature-only sensor (no humidity)
 *     node scripts/emulate-sensor.js ab12cd34.<secret> --channels=temperature
 */

function parseArgs(argv) {
    const opts = { _: [] };
    for (const a of argv.slice(2)) {
        if (a.startsWith('--')) {
            const eq = a.indexOf('=');
            if (eq === -1) opts[a.slice(2)] = true;
            else            opts[a.slice(2, eq)] = a.slice(eq + 1);
        } else {
            opts._.push(a);
        }
    }
    return opts;
}

function genSample(timestamp, channels) {
    const t = new Date(timestamp);
    // Annual cycle — peaks around late July (day 200ish), troughs in January.
    const dayOfYear = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
    const annual = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
    // Diurnal cycle — peaks at 15:00, troughs at 03:00.
    const hourOfDay = t.getHours() + t.getMinutes() / 60;
    const diurnal = Math.sin(((hourOfDay - 9) / 24) * 2 * Math.PI);

    const sample = { timestamp: t.toISOString() };

    if (channels.includes('temperature')) {
        sample.temperature = 13 + 2 * annual + 0.8 * diurnal + (Math.random() - 0.5) * 0.4;
        sample.temperature = Math.round(sample.temperature * 100) / 100;
    }
    if (channels.includes('humidity')) {
        let rh = 40 + 8 * annual + 2 * diurnal + (Math.random() - 0.5) * 3;
        const month = t.getMonth();   // 0–11; summer = Jun–Sep at Mogao
        const isSummer = month >= 5 && month <= 8;
        if (isSummer && Math.random() < 0.02) {
            rh += 15 + Math.random() * 15;          // rainfall spike
        }
        sample.humidity = Math.max(15, Math.min(95, Math.round(rh * 100) / 100));
    }
    if (channels.includes('light')) {
        sample.lightKlux = 0;                        // cave interior baseline
    }

    return sample;
}

async function postBatch(backendUrl, apiKey, samples) {
    const res = await fetch(`${backendUrl}/telemetry/samples/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Sensor-Key': apiKey },
        body: JSON.stringify({ samples })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`POST /telemetry/samples/batch -> ${res.status}: ${JSON.stringify(json)}`);
        err.status = res.status;
        throw err;
    }
    return json;
}

function summarise(sample, channels) {
    const parts = [];
    if (channels.includes('temperature')) parts.push(`T=${sample.temperature.toFixed(2)}°C`);
    if (channels.includes('humidity'))    parts.push(`RH=${sample.humidity.toFixed(2)}%`);
    if (channels.includes('light'))       parts.push(`I=${sample.lightKlux.toFixed(2)}klux`);
    return parts.join(' · ');
}

async function runLive({ backendUrl, apiKey, cadenceSec, channels }) {
    console.log(`[emulator] Live mode — channels: ${channels.join(', ')}; cadence: ${cadenceSec}s`);
    console.log('[emulator] Ctrl+C to stop.\n');
    let n = 0;
    const tick = async () => {
        const sample = genSample(Date.now(), channels);
        try {
            const r = await postBatch(backendUrl, apiKey, [sample]);
            n++;
            console.log(`[${n}] ${sample.timestamp} ${summarise(sample, channels)} -> accepted=${r.accepted}, dup=${r.duplicates}, rejected=${r.rejected}`);
        } catch (err) {
            console.error(`[${n + 1}] Failed:`, err.message);
        }
    };
    await tick();
    setInterval(tick, cadenceSec * 1000);
    // Keep alive; setInterval doesn't block process exit on its own when there are no other refs.
    await new Promise(() => {});
}

async function runCatchup({ backendUrl, apiKey, days, channels }) {
    console.log(`[emulator] Catchup mode — filling ${days} days of 10-min samples for: ${channels.join(', ')}`);
    const intervalMs = 10 * 60 * 1000;
    const now = Date.now();
    const startMs = now - days * 86400_000;
    const samples = [];
    for (let ts = startMs; ts < now; ts += intervalMs) {
        samples.push(genSample(ts, channels));
    }
    console.log(`[emulator] Generated ${samples.length} samples; uploading in batches of 1000…`);

    let totalAccepted = 0, totalDup = 0, totalRej = 0;
    for (let i = 0; i < samples.length; i += 1000) {
        const chunk = samples.slice(i, i + 1000);
        const r = await postBatch(backendUrl, apiKey, chunk);
        totalAccepted += r.accepted || 0;
        totalDup      += r.duplicates || 0;
        totalRej      += r.rejected || 0;
        console.log(`  batch ${Math.floor(i/1000) + 1}: +${r.accepted} accepted, ${r.duplicates} dup, ${r.rejected} rejected`);
    }
    console.log(`\n[emulator] Done. Total: ${totalAccepted} accepted, ${totalDup} duplicates, ${totalRej} rejected.`);
}

async function main() {
    const args = parseArgs(process.argv);
    const apiKey = args._[0];
    if (!apiKey) {
        console.error('Usage: node scripts/emulate-sensor.js <api-key> [--mode=live|catchup] [--cadence-sec=N] [--days=N] [--channels=temperature,humidity]');
        process.exit(2);
    }
    const ctx = {
        backendUrl: args.backend || 'http://localhost:8008',
        apiKey,
        mode:        args.mode      || 'live',
        cadenceSec:  Number(args['cadence-sec'] || 10),
        days:        Number(args.days || 7),
        channels:    (args.channels || 'temperature,humidity')
                        .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    };
    if (ctx.mode === 'catchup') await runCatchup(ctx);
    else                       await runLive(ctx);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
