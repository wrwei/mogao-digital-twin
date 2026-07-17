// Emit real compositeRiskField output for the Figure 10 generator.
// Cave-baseline interior at the paper's 200-year calibration horizon.
const D = require('../backend/runtime/services/domain/DeteriorationService.js');
const fs = require('fs');
const params = { T_celsius: 13, RH_percent: 35, light_klux: 2, totalDays: 200 * 365.25, RH_amplitude: 10 };
const field = D.compositeRiskField(params);
const out = {
  params,
  zones: field.map(z => ({
    id: z.id, name: z.name, height: z.height, RH_local: z.RH_local,
    saltAvailability: z.saltAvailability,
    composite: z.composite.value, dominant: z.composite.dominant,
    components: z.composite.components
  }))
};
fs.writeFileSync(__dirname + '/composite_zone_data.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
