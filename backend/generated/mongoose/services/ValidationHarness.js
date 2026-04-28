/**
 * ValidationHarness
 *
 * Compares the deterioration models' predictions against measured (or
 * literature-derived) ΔE time-series data. Pure functions — no DB, no
 * filesystem, no network — so the same code is exercised by Jest tests
 * and by the CLI script in scripts/validate.js.
 *
 * Dataset format (CSV with header):
 *
 *   dataset, citation, t_days, T_celsius, RH_pct, light_klux, deltaE_observed
 *
 * The first two columns are identifiers (any string); the remaining five
 * are the experimental conditions and the measured colour change. Each
 * row is treated as one (predicted, observed) pair; the harness can
 * therefore be used for accelerated-ageing experiments, side-by-side
 * panel-painting timelines, or any other paired (environment, ΔE) record.
 */

const { chemicalFading } = require('./DeteriorationService');

const REQUIRED_COLUMNS = ['t_days', 'T_celsius', 'RH_pct', 'light_klux', 'deltaE_observed'];

// ── Parser ───────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into { rows, errors }. Errors are non-fatal — a
 * malformed row is dropped and recorded with its line number so the
 * caller can surface them to the user.
 */
function parseCsv(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [], errors: [{ line: 0, error: 'empty input' }] };

    const headers = splitCsvLine(lines[0]).map(h => h.trim());
    const errors = [];
    for (const col of REQUIRED_COLUMNS) {
        if (!headers.includes(col)) errors.push({ line: 1, error: `missing required column "${col}"` });
    }
    if (errors.length > 0) return { headers, rows: [], errors };

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = splitCsvLine(lines[i]);
        if (cells.length !== headers.length) {
            errors.push({ line: i + 1, error: `expected ${headers.length} columns, got ${cells.length}` });
            continue;
        }
        const row = {};
        for (let j = 0; j < headers.length; j++) row[headers[j]] = cells[j].trim();

        // Coerce numeric columns; record (and drop) the row on parse failure
        let bad = false;
        for (const col of REQUIRED_COLUMNS) {
            const n = Number(row[col]);
            if (!Number.isFinite(n)) {
                errors.push({ line: i + 1, error: `non-numeric ${col}="${row[col]}"` });
                bad = true;
                break;
            }
            row[col] = n;
        }
        if (!bad) rows.push(row);
    }
    return { headers, rows, errors };
}

/** Split one CSV line, treating bare commas as separators. Quoted strings
 *  with embedded commas are not supported — fixture data should avoid them. */
function splitCsvLine(line) {
    return line.split(',');
}

// ── Metric helpers ──────────────────────────────────────────────────────

/** Root-mean-square error between observed and predicted arrays. */
function rmse(observed, predicted) {
    if (observed.length === 0 || observed.length !== predicted.length) return NaN;
    let sumSq = 0;
    for (let i = 0; i < observed.length; i++) {
        const d = predicted[i] - observed[i];
        sumSq += d * d;
    }
    return Math.sqrt(sumSq / observed.length);
}

/** Mean absolute error. */
function mae(observed, predicted) {
    if (observed.length === 0 || observed.length !== predicted.length) return NaN;
    let sumAbs = 0;
    for (let i = 0; i < observed.length; i++) sumAbs += Math.abs(predicted[i] - observed[i]);
    return sumAbs / observed.length;
}

/** Coefficient of determination R^2 = 1 - SS_res / SS_tot. Returns NaN on
 *  degenerate inputs (no variance in the observed series). */
function r2(observed, predicted) {
    if (observed.length === 0 || observed.length !== predicted.length) return NaN;
    const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < observed.length; i++) {
        const r = observed[i] - predicted[i];
        const t = observed[i] - mean;
        ssRes += r * r;
        ssTot += t * t;
    }
    if (ssTot === 0) return NaN;
    return 1 - ssRes / ssTot;
}

// ── Evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluate the chemical-fading model against a parsed dataset. For each
 * row, calls chemicalFading(T, RH, light, t_days) and treats its
 * scientificDegradation field (0–100, mapped to the same ΔE* scale used
 * by DeteriorationReplayService) as the predicted ΔE.
 *
 * Returns:
 *   { observed:    Number[],
 *     predicted:   Number[],
 *     residuals:   Number[],   // predicted - observed
 *     perRow:      [{ row, observed, predicted, residual }, ...],
 *     metrics:     { n, rmse, mae, r2, meanObserved, meanPredicted } }
 */
function evaluateChemicalFading(rows) {
    const observed = [];
    const predicted = [];
    const perRow = [];
    for (const row of rows) {
        const r = chemicalFading(row.T_celsius, row.RH_pct, row.light_klux, row.t_days);
        const pred = r.scientificDegradation;
        observed.push(row.deltaE_observed);
        predicted.push(pred);
        perRow.push({
            row,
            observed:  row.deltaE_observed,
            predicted: pred,
            residual:  pred - row.deltaE_observed
        });
    }
    const meanObs = observed.length ? observed.reduce((a, b) => a + b, 0) / observed.length : NaN;
    const meanPred = predicted.length ? predicted.reduce((a, b) => a + b, 0) / predicted.length : NaN;
    return {
        observed, predicted,
        residuals: perRow.map(p => p.residual),
        perRow,
        metrics: {
            n: rows.length,
            rmse: rmse(observed, predicted),
            mae:  mae(observed, predicted),
            r2:   r2(observed, predicted),
            meanObserved:  meanObs,
            meanPredicted: meanPred
        }
    };
}

module.exports = {
    REQUIRED_COLUMNS,
    parseCsv,
    rmse, mae, r2,
    evaluateChemicalFading
};
