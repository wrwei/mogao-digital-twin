// Generate Table 1 (tab:preset_response) for the paper directly from the
// runtime. Preset parameters are parsed out of the single source of truth,
// frontend/services/SimulationEngine.js, so this table can never silently
// drift from the deployed presets. Prints both a human-readable table and the
// LaTeX data rows to paste into Results.tex.
//
// Column model masks (which mechanisms each preset lists) follow the `models`
// array of each preset; a mechanism not listed is rendered as "---".
const fs = require('fs');
const D = require('../backend/runtime/services/domain/DeteriorationService.js');
const yr = 365.25;

const SRC = fs.readFileSync(__dirname + '/../frontend/services/SimulationEngine.js', 'utf8');
// Which presets appear in the paper table, and in what order:
const ROWS = ['museum', 'poorStorage', 'extreme', 'mogao200', 'tropical200',
              'demoChemical', 'demoMould', 'demoFatigue'];
const PRETTY = {
  museum: 'Museum 100y', poorStorage: 'Poor Storage 50y', extreme: 'Extreme 10y',
  mogao200: '200y Mogao', tropical200: '200y Tropical',
  demoChemical: 'Light Exposure 50y', demoMould: 'Humid Bloom 10y',
  demoFatigue: 'Large Swings 50y'
};

function parsePreset(key) {
  const m = SRC.match(new RegExp(key + '\\s*:\\s*\\{([^}]*)\\}'));
  if (!m) throw new Error('preset not found: ' + key);
  const body = m[1];
  const num = (f) => Number(body.match(new RegExp(f + '\\s*:\\s*(-?[0-9.]+)'))[1]);
  const models = (body.match(/models\s*:\s*\[([^\]]*)\]/)[1].match(/'([^']+)'/g) || [])
                   .map((s) => s.replace(/'/g, ''));
  return { temp: num('temp'), rh: num('rh'), years: num('years'),
           light: num('light'), amp: num('rhAmplitude'), models };
}

const f = (x, d = 1) => (x == null ? '---' : (+x).toFixed(d));
const tex = [];
console.log('preset               | chem% | LM   | M/6 | saltMPa | D');
for (const key of ROWS) {
  const p = parsePreset(key);
  const c = D.assess({ T_celsius: p.temp, RH_percent: p.rh, light_klux: p.light,
                       totalDays: p.years * yr, RH_amplitude: p.amp });
  const has = (m) => p.models.includes(m);
  const chem = has('chemical') ? c.chemical?.scientificDegradation : null;
  const lm   = has('lifetime') ? c.lifetime?.multiplier : null;
  const mould= has('mould')    ? c.mould?.mouldIndex : null;
  const salt = has('salt')     ? c.saltCryst?.pressure_MPa : null;
  const fat  = has('fatigue')  ? c.fatigue?.cumulativeDamage : null;
  const name = PRETTY[key];
  console.log(`${name.padEnd(20)} | ${f(chem)} | ${f(lm,2)} | ${f(mould,1)} | ${f(salt)} | ${f(fat,3)}`);
  // LaTeX row: round to the table's display precision
  const tf = (x, d) => (x == null ? '---' : (+x).toFixed(d));
  const chemR = chem == null ? '---' : Math.round(chem);
  const saltR = salt == null ? '---' : Math.round(salt);
  tex.push(`${name.padEnd(18)}& ${String(chemR).padEnd(4)} & ${tf(lm,1).padEnd(4)} & ${tf(mould,1).padEnd(3)} & ${String(saltR).padEnd(4)} & ${tf(fat,3)} \\\\`);
}
console.log('\n--- LaTeX rows ---');
console.log(tex.join('\n'));
