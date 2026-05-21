#!/usr/bin/env node
/**
 * Validate the chemical-fading model against a measured ΔE dataset.
 *
 * Usage (from backend/runtime):
 *     node scripts/validate.js path/to/data.csv [--json]
 *
 * The CSV must have a header row with at minimum these columns:
 *     dataset, citation, t_days, T_celsius, RH_pct, light_klux, deltaE_observed
 *
 * For each row the harness queries the chemical-fading model with the row's
 * (T, RH, light, t) and reports per-row residuals plus aggregate goodness-
 * of-fit metrics (RMSE, MAE, R²). No database is touched and no network is
 * used; the same code path is exercised by Jest in __tests__/ValidationHarness.test.js.
 *
 * Pass --json to emit machine-readable output instead of the human summary.
 *
 * Demo run:
 *     node scripts/validate.js __tests__/fixtures/validation-demo.csv
 */

const fs = require('fs');
const path = require('path');
const V = require('../services/domain/ValidationHarness');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const csvPath = args.find(a => !a.startsWith('--'));

if (!csvPath) {
    console.error('Usage: node scripts/validate.js <path/to/data.csv> [--json]');
    process.exit(2);
}

const fullPath = path.resolve(csvPath);
let text;
try {
    text = fs.readFileSync(fullPath, 'utf-8');
} catch (err) {
    console.error(`Cannot read ${fullPath}: ${err.message}`);
    process.exit(1);
}

const { rows, errors } = V.parseCsv(text);
if (errors.length > 0) {
    if (!jsonMode) console.warn(`Parse warnings (${errors.length}):`);
    for (const e of errors) {
        if (!jsonMode) console.warn(`  line ${e.line}: ${e.error}`);
    }
}
if (rows.length === 0) {
    console.error('No usable rows in dataset.');
    process.exit(1);
}

const result = V.evaluateChemicalFading(rows);
const m = result.metrics;

if (jsonMode) {
    process.stdout.write(JSON.stringify({
        file: fullPath,
        rowsAccepted: rows.length,
        parseErrors:  errors,
        metrics: m,
        perRow:  result.perRow.map(p => ({
            dataset:   p.row.dataset,
            citation:  p.row.citation,
            t_days:    p.row.t_days,
            T_celsius: p.row.T_celsius,
            RH_pct:    p.row.RH_pct,
            light_klux: p.row.light_klux,
            observed:  p.observed,
            predicted: p.predicted,
            residual:  p.residual
        }))
    }, null, 2));
    return;
}

// Human-readable summary
const fmt = (n, d = 3) => Number.isFinite(n) ? n.toFixed(d) : '—';
console.log('═══ Validation report ' + '═'.repeat(38));
console.log(`  File:          ${fullPath}`);
console.log(`  Rows accepted: ${m.n}` + (errors.length ? `  (parse errors: ${errors.length})` : ''));
console.log(`  ΔE observed:   mean ${fmt(m.meanObserved)}`);
console.log(`  ΔE predicted:  mean ${fmt(m.meanPredicted)}`);
console.log('  ─── Goodness-of-fit ─────────────────────────────────');
console.log(`  RMSE:    ${fmt(m.rmse)}`);
console.log(`  MAE:     ${fmt(m.mae)}`);
console.log(`  R²:      ${fmt(m.r2)}`);
console.log('  ─── Per-row residuals ───────────────────────────────');
console.log('  ' + ['dataset', 't_d', 'T °C', 'RH %', 'I klx', 'obs', 'pred', 'resid']
    .map(h => h.padStart(10)).join(''));
for (const p of result.perRow) {
    console.log('  ' + [
        p.row.dataset, p.row.t_days, p.row.T_celsius, p.row.RH_pct, p.row.light_klux,
        fmt(p.observed, 2), fmt(p.predicted, 2), fmt(p.residual, 2)
    ].map(v => String(v).padStart(10)).join(''));
}
console.log('═'.repeat(60));
