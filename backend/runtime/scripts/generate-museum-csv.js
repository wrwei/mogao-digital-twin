/**
 * Generate sample sensor CSV files mimicking museum environments, for
 * exercising the Bulk CSV import path on the Sensor Fleet page.
 *
 * Output: backend/runtime/sample-data/csv/*.csv
 *
 * Profiles:
 *   museum-controlled-30d.csv       Tight HVAC control: T 20 ± 0.5 °C, RH 50 ± 1.5 %
 *                                   Lighting follows museum opening hours.
 *
 *   museum-hvac-event-30d.csv       Same baseline as above, but with a 48-hour
 *                                   HVAC failure on day 14 — T climbs to 25 °C,
 *                                   RH spikes to 72 %, then recovers.
 *
 *   museum-seasonal-1y.csv          1 full year with looser control showing
 *                                   modest seasonal variation: T 17–22 °C,
 *                                   RH 42–55 %. Useful for the Live Data chart's
 *                                   1-year range and for testing the lifetime /
 *                                   chemical fading models against a museum case.
 *
 *   museum-cycling-event-30d.csv    30 days with daily 5 % RH cycles to stress
 *                                   the hygro-mechanical fatigue model — useful
 *                                   for demonstrating accelerated cracking risk.
 *
 * Columns: timestamp,temperature,humidity,lightKlux
 *   timestamp: ISO-8601 in UTC (Z suffix)
 *   temperature: °C, 2 d.p.
 *   humidity: %, 2 d.p.
 *   lightKlux: klux, 2 d.p. (0 outside opening hours)
 *
 * All series use a 10-minute cadence (matching the runtime's expected period).
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'sample-data', 'csv');

// ─── Helpers ──────────────────────────────────────────────────────────────

const TEN_MIN = 10 * 60 * 1000;

function annualPhase(t) {
    const dayOfYear = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
    return Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);     // peaks late July
}

function diurnalPhase(t) {
    const hour = t.getHours() + t.getMinutes() / 60;
    return Math.sin(((hour - 14) / 24) * 2 * Math.PI);            // peaks 14:00
}

function gauss(scale) {
    // crude Box-Muller; std-dev ≈ `scale`.
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
}

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function museumLight(t) {
    // 09:00–18:00 lit at ~1 klux, mid-day peaks slightly. Closed museum = 0.
    const hour = t.getHours() + t.getMinutes() / 60;
    if (hour < 9 || hour >= 18) return 0;
    const mid = 13.5;                                           // peak 13:30
    const span = 4.5;
    const k = Math.exp(-Math.pow((hour - mid) / span, 2));      // gaussian in time
    return 0.8 + 0.4 * k + gauss(0.05);
}

// ─── Profiles ─────────────────────────────────────────────────────────────

function pMuseumControlled(t) {
    return {
        temperature: 20 + 0.3 * annualPhase(t) + 0.2 * diurnalPhase(t) + gauss(0.08),
        humidity:    50 + 1.0 * annualPhase(t) + 0.4 * diurnalPhase(t) + gauss(0.3),
        lightKlux:   museumLight(t)
    };
}

function pMuseumHvacEvent(t, eventStart, eventEnd) {
    const base = pMuseumControlled(t);
    if (t >= eventStart && t <= eventEnd) {
        const progress = (t - eventStart) / (eventEnd - eventStart);
        // Failure ramps up over first 25 %, holds 25–75 %, ramps down to 100 %.
        let intensity;
        if (progress < 0.25)      intensity = progress / 0.25;
        else if (progress < 0.75) intensity = 1;
        else                      intensity = 1 - (progress - 0.75) / 0.25;
        base.temperature += 5 * intensity + gauss(0.15);
        base.humidity    += 22 * intensity + gauss(1.0);
    }
    return base;
}

function pMuseumSeasonal(t) {
    return {
        temperature: 19.5 + 2.0 * annualPhase(t) + 0.5 * diurnalPhase(t) + gauss(0.15),
        humidity:    48   + 4.0 * annualPhase(t) + 1.0 * diurnalPhase(t) + gauss(0.8),
        lightKlux:   museumLight(t)
    };
}

function pMuseumCyclingEvent(t) {
    // Hygro-mechanical stress profile: hourly RH cycles ±2.5% on top of a
    // controlled baseline. Diurnal modulation amplified vs the baseline.
    const base = pMuseumControlled(t);
    const minutes = t.getHours() * 60 + t.getMinutes();
    const hourlyCycle = Math.sin((minutes / 60) * 2 * Math.PI);
    base.humidity += 2.5 * hourlyCycle;
    return base;
}

// ─── Series writer ────────────────────────────────────────────────────────

function writeSeries(filename, startMs, days, generator) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, filename);
    const stream  = fs.createWriteStream(outPath);
    stream.write('timestamp,temperature,humidity,lightKlux\n');

    const endMs = startMs + days * 86400_000;
    let rows = 0;
    for (let ts = startMs; ts < endMs; ts += TEN_MIN) {
        const d = new Date(ts);
        const s = generator(d);
        const T  = clamp(s.temperature, -10, 50).toFixed(2);
        const RH = clamp(s.humidity, 0, 100).toFixed(2);
        const L  = clamp(s.lightKlux, 0, 200).toFixed(2);
        stream.write(`${d.toISOString()},${T},${RH},${L}\n`);
        rows++;
    }
    stream.end();
    return new Promise((resolve) => stream.on('finish', () => resolve({ outPath, rows })));
}

// ─── Run ──────────────────────────────────────────────────────────────────

async function main() {
    const now = Date.now();
    const day = 86400_000;

    // Anchor the series so their END is "now" — bulk-import lands them as
    // recent history, which is what the History modal will show first.
    const tasks = [
        {
            file: 'museum-controlled-30d.csv',
            days: 30,
            start: now - 30 * day,
            gen: pMuseumControlled
        },
        {
            file: 'museum-hvac-event-30d.csv',
            days: 30,
            start: now - 30 * day,
            gen: (t) => {
                // 48-hour event centred on day 14 of the 30-day window.
                const eventStart = (now - 30 * day) + 14 * day;
                const eventEnd   = eventStart + 2 * day;
                return pMuseumHvacEvent(t, eventStart, eventEnd);
            }
        },
        {
            file: 'museum-seasonal-1y.csv',
            days: 365,
            start: now - 365 * day,
            gen: pMuseumSeasonal
        },
        {
            file: 'museum-cycling-event-30d.csv',
            days: 30,
            start: now - 30 * day,
            gen: pMuseumCyclingEvent
        }
    ];

    console.log(`Writing CSVs to ${OUT_DIR}\n`);
    for (const t of tasks) {
        const { outPath, rows } = await writeSeries(t.file, t.start, t.days, t.gen);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`  ✓ ${t.file}  (${rows.toLocaleString()} rows, ${kb} KB)`);
    }
    console.log('\nDone. Upload via the Bulk CSV Import panel on the Sensors page.');
    console.log('Filenames matter — the importer auto-matches a file to a sensor if');
    console.log('the filename contains the sensor\'s gid or name. Otherwise pick a sensor manually.');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
