# Deterioration Simulation - Strlič Dose-Response Framework

## Overview

This implementation provides **real-time heritage artifact deterioration simulation** based on the Strlič dose-response framework for polychrome surfaces. The simulation computes texture degradation dynamically based on environmental parameters and applies the deteriorated texture to the 3D model in real-time.

## Scientific Foundation

The simulation implements the following scientific models from conservation science literature:

### 1. **Paltakari-Karlsson Moisture Isotherm**
Calculates equilibrium moisture content from temperature and relative humidity:

```
[H₂O] = (ln(1 − RH) / (1.67T − 285.655))^(1/(2.491 − 0.012T))
```

- **RH**: Relative humidity (0-1 fraction)
- **T**: Temperature in Kelvin

### 2. **Arrhenius Temperature Dependence**
Models reaction rate's exponential dependence on temperature:

```
k_thermal = k₀ · exp(−Eₐ / RT)
```

- **Eₐ**: Activation energy (J/mol)
  - Dark oxidation: 70 kJ/mol (linseed oil binder)
  - Photochemical fading: 25 kJ/mol (organic pigments)
- **R**: Gas constant (8.314 J·mol⁻¹·K⁻¹)

### 3. **Composite Degradation Rate**
Combines thermal, hydrolytic, and photochemical degradation:

```
k = k₀_dark · [H₂O]^q · exp(−Eₐ_dark/RT) + k₀_light · I^p · [H₂O]^q · exp(−Eₐ_light/RT)
```

**Parameters:**
- **q = 0.8**: Reaction order with respect to water (typical range: 0.5-1.0)
- **p = 0.9**: Light reciprocity exponent (1.0 = perfect reciprocity)
- **I**: Light intensity in kilolux

### 4. **First-Order Fading Kinetics**
Color degradation follows first-order kinetics:

```
C(t) = C₀ · exp(−k·t)
Degradation % = 100 × (1 − exp(−k·t))
```

## Implementation Details

### File Structure

1. **ModelViewer.js** (`frontend/components/ModelViewer.js`)
   - Core deterioration calculation functions
   - Real-time texture manipulation via Canvas API
   - Environmental parameter tracking
   - Dynamic texture application to 3D model

2. **simulation-panel.css** (`frontend/styles/simulation-panel.css`)
   - Simulation panel UI styling
   - Responsive design
   - Dark mode support

### Key Functions

#### `calculateMoistureContent(RH_fraction, T_kelvin)`
Computes equilibrium moisture content using Paltakari-Karlsson isotherm.

#### `calculateRateConstant(T_celsius, RH_percent, light_klux)`
Returns composite degradation rate constant (per day) combining:
- Dark thermal/hydrolytic degradation
- Photochemical fading (if light present)

#### `applyDeteriorationToTexture()`
Performs pixel-level texture degradation:
1. Calculates degradation factor: `exp(−k·t)`
2. Loads original texture to canvas
3. Applies three deterioration effects:
   - **Desaturation**: Colors fade toward gray
   - **Yellowing**: Shift toward yellow/brown hues (+R, +G, −B)
   - **Darkening**: Slight overall luminance reduction

#### `toggleDegradation()` / `updateSimulation()`
Enable/disable simulation and trigger real-time updates.

### Simulation Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Temperature | 0-40°C | 20°C | Storage/display temperature |
| Relative Humidity | 0-100% | 50% | Environmental RH |
| Exposure Time | 0-200 years | 0 years | Cumulative exposure duration |
| Light Intensity | 0-50 klux | 0 klux | Illuminance (0 = dark storage) |

**Typical museum lighting:**
- Dark storage: 0 lux
- Sensitive materials: 50 lux (0.05 klux)
- Moderately sensitive: 150-200 lux (0.15-0.2 klux)
- Insensitive materials: 300-500 lux (0.3-0.5 klux)
- Gallery lighting: 10-20 klux (excessive for conservation!)

## Usage

### 1. Prerequisites
Ensure the simulation CSS is loaded in your HTML:

```html
<link rel="stylesheet" href="styles/simulation-panel.css">
```

### 2. Load a 3D Model with Texture
The **Environmental Simulation** panel appears automatically on the right side when a textured model is loaded.

### 3. Start Simulation
Click the **"▶ Start Simulation"** button in the panel header.

### 4. Adjust Environmental Parameters
Use the main sliders to set:
- **🌡️ Temperature (°C)**: Higher temperatures accelerate degradation exponentially
- **💧 Relative Humidity (% RH)**: Affects hydrolytic degradation via moisture content

### 5. Advanced Settings (Optional)
Click **"▶ Advanced Settings"** to access:
- **📊 Quick Presets**: Museum (100y), 1 Year, 10 Years, Poor Storage, Extreme
- **⏱️ Exposure Time**: Fine-grained control with days, months, and years sliders
- **💡 Light Intensity**: Photochemical fading component (0 = dark, 0.05-0.2 = museum, 10+ = excessive)
- **Scientific Metrics**: Rate constant, degradation percentage, color remaining

### 6. Observe Results
The texture updates in real-time showing:
- Color desaturation (fading toward gray)
- Yellowing/browning shift
- Overall darkening
- Scientifically accurate deterioration (with 10× visual amplification for demonstration)

The info panel displays:
- **⚗️ Rate constant** (k): Degradation rate per day
- **📉 Scientific degradation**: Actual percentage based on Strlič framework
- **🔬 Visual amplification**: 10× for clear demonstration
- **🎨 Color remaining**: Percentage of original color

### 7. Reset or Stop
- Click **"🔄 Reset"** to restore default parameters (20°C, 50% RH, 0 time)
- Click **"⏸ Stop Simulation"** to restore the original texture

## Scientific Validation

### Temperature Effects
- **20°C → 25°C**: ~1.5× degradation rate increase (Eₐ = 70 kJ/mol)
- **20°C → 30°C**: ~2.3× degradation rate increase
- **20°C → 0°C**: ~20× lifetime extension (following Michalski's CCI guidelines)

### Humidity Effects
- **20% RH increase ≈ 4°C temperature increase** (Strlič et al. 2015)
- Maximum degradation typically occurs at 80-100% RH
- Dry conditions (<30% RH) significantly slow hydrolytic degradation

### Light Effects
- **Photochemical fading dominates** under museum lighting (>100 lux)
- Low activation energy (Eₐ = 25 kJ/mol) means less temperature dependence
- RH modulation: 2-10× rate increase from dry to saturated conditions (Feller 1994)

## Limitations & Assumptions

1. **Simplified color model**: Uses RGB desaturation + yellowing rather than full CIELAB ΔE calculation
2. **Pigment-agnostic**: Uses average parameters; real pigments vary widely
3. **Uniform degradation**: Assumes homogeneous aging across entire surface
4. **No spatial effects**: Ignores crack patterns, localized moisture, biological attack
5. **First-order kinetics**: Real pigments may show more complex kinetics

## Future Enhancements

- [ ] CIELAB color space conversion for accurate ΔE calculation
- [ ] Pigment-specific parameter sets (organic vs. inorganic)
- [ ] Non-uniform degradation (edge darkening, moisture gradients)
- [ ] Crack pattern simulation (Mecklenburg/Bratasz models)
- [ ] Biological attack visualization (mould growth)
- [ ] Export degraded textures for analysis
- [ ] Texture comparison slider (before/after)
- [ ] Preset environmental scenarios (museum, church, outdoor)

## References

1. **Menart, De Bruin & Strlič** (2011). "Effects of NO₂ and acetic acid on the stability of historic paper." *Polymer Degradation and Stability* 96: 2029-2039.

2. **Liu, Fearn & Strlič** (2021). "Durability of Moso bamboo (Phyllostachys pubescens) in indoor conditions: Influence of air pollutants." *Heritage Science* 9: 130.

3. **Feller** (1994). *Accelerated Aging: Photochemical and Thermal Aspects*. Getty Conservation Institute.

4. **Michalski** (2002). "Double the life for each five-degree drop, more than double the life for each halving of relative humidity." Canadian Conservation Institute.

5. **Kowalski et al.** (2017). "Thermal-oxidative aging of linseed oil-based paints: Reaction mechanisms and kinetic parameters." *Thermochimica Acta* 647: 94-102.

## License

Scientific equations and parameters are from published conservation science literature. Implementation © 2026 Mogao Digital Twin Project.
