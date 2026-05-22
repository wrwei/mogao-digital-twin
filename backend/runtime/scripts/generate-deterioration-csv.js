/**
 * Generate sample sensor CSV files that exercise the five deterioration
 * models in the Prediction panel. Each profile is designed to push one
 * model towards (and past) its threshold, so loading the CSV against a
 * sensor linked to an artefact lets you visualise that specific failure
 * mode on the replay chart.
 *
 * Output: backend/runtime/sample-data/csv/*.csv
 *
 * Profiles:
 *   1. deterioration-cave-baseline-1y.csv         — Mogao reference, all 5 models stay near zero
 *   2. deterioration-chemical-stress-1y.csv       — drives chemical fading + Michalski lifetime
 *   3. deterioration-mould-risk-180d.csv          — drives VTT mould index past 3
 *   4. deterioration-fatigue-cycling-180d.csv     — drives Basquin/Miner fatigue D past 1
 *   5. deterioration-salt-cycling-180d.csv        — drives Steiger salt cumulative past 1
 *
 * Columns: timestamp,temperature,humidity,lightKlux  (10-min cadence)
 *
 * Choice of conditions is informed by:
 *   - chemical fading: Arrhenius temperature scaling + Paltakari–Karlsson moisture
 *     coupling means each +10 °C roughly doubles rate; +RH boosts via sorption.
 *   - mould: VTT critical RH at 22 °C ≈ 80 %, so 82 % at 22 °C sits just over.
 *   - fatigue: Basquin–Miner damage accumulates with the cube/sixth power of strain
 *     amplitude, so large daily RH swings dominate.
 *   - salt: Na2SO4 deliquescence is ~62 % at 20 °C; one DRH crossing = half a
 *     dissolution-crystallisation cycle, so we cross it ~twice per day.
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'sample-data', 'csv');
const TEN_MIN = 10 * 60 * 1000;

function gauss(scale) {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
}
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function annualPhase(t) {
    const dayOfYear = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
    return Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);    // peaks late July
}

function diurnalPhase(t) {
    const hour = t.getHours() + t.getMinutes() / 60;
    return Math.sin(((hour - 14) / 24) * 2 * Math.PI);
}

// ─── Profiles ─────────────────────────────────────────────────────────────

function pCaveBaseline(t) {
    // Mogao reference microclimate. All five models should hover near zero,
    // making this the "control" series for visual comparison.
    return {
        temperature: 13 + 2.0 * annualPhase(t) + 0.5 * diurnalPhase(t) + gauss(0.15),
        humidity:    35 + 6.0 * annualPhase(t) + 1.5 * diurnalPhase(t) + gauss(1.2),
        lightKlux:   0
    };
}

function pChemicalStress(t) {
    // Sustained warm + moist — accelerates chemical fading (Arrhenius) and
    // burns Michalski lifetime quickly while staying below mould threshold.
    return {
        temperature: 28 + 1.2 * annualPhase(t) + 0.6 * diurnalPhase(t) + gauss(0.18),
        humidity:    65 + 1.5 * annualPhase(t) + 0.5 * diurnalPhase(t) + gauss(0.9),
        lightKlux:   0
    };
}

function pMouldRisk(t) {
    // Moderate T with sustained RH above the VTT critical (~80 % at 22 °C).
    // The mould index should climb monotonically and pass 3 within weeks.
    return {
        temperature: 22 + 0.4 * annualPhase(t) + 0.6 * diurnalPhase(t) + gauss(0.15),
        humidity:    82 + 0.8 * annualPhase(t) + 0.7 * diurnalPhase(t) + gauss(1.0),
        lightKlux:   0
    };
}

function pFatigueCycling(t) {
    // Aggressive daily RH cycles 35 % ↔ 65 % on a stable T baseline.
    // Each daily cycle contributes to Miner damage; D should exceed 1 well
    // within the 180-day window.
    const minutes = t.getHours() * 60 + t.getMinutes();
    const daily = Math.sin((minutes / (24 * 60)) * 2 * Math.PI);
    return {
        temperature: 20 + 0.4 * diurnalPhase(t) + gauss(0.12),
        humidity:    50 + 15 * daily + gauss(0.8),
        lightKlux:   0
    };
}

function pSaltCycling(t) {
    // RH oscillates across the Na2SO4 DRH (~62 % at 20 °C) twice per day, with
    // a slow annual envelope so the crossing count varies seasonally. Steiger
    // damage cumulates with crossing count and crystallisation pressure.
    const minutes = t.getHours() * 60 + t.getMinutes();
    const semiDiurnal = Math.sin((minutes / (12 * 60)) * 2 * Math.PI);
    return {
        temperature: 20 + 0.4 * diurnalPhase(t) + gauss(0.12),
        humidity:    62 + 12 * semiDiurnal + 3.0 * annualPhase(t) + gauss(0.6),
        lightKlux:   0
    };
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
        const T  = clamp(s.temperature, -10, 60).toFixed(2);
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

    const tasks = [
        { file: 'deterioration-cave-baseline-1y.csv',      days: 365, gen: pCaveBaseline },
        { file: 'deterioration-chemical-stress-1y.csv',    days: 365, gen: pChemicalStress },
        { file: 'deterioration-mould-risk-180d.csv',       days: 180, gen: pMouldRisk },
        { file: 'deterioration-fatigue-cycling-180d.csv',  days: 180, gen: pFatigueCycling },
        { file: 'deterioration-salt-cycling-180d.csv',     days: 180, gen: pSaltCycling }
    ];

    console.log(`Writing CSVs to ${OUT_DIR}\n`);
    for (const t of tasks) {
        const startMs = now - t.days * day;
        const { outPath, rows } = await writeSeries(t.file, startMs, t.days, t.gen);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`  ✓ ${t.file}  (${rows.toLocaleString()} rows, ${kb} KB)`);
    }
    console.log('\nLoad these via the Bulk CSV Import panel on the Sensors page.');
    console.log('Use a DIFFERENT sensor per profile so the (sensor, timestamp) unique');
    console.log('index doesn\'t dedupe rows across scenarios with overlapping wall-clock.');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
