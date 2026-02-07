# Mathematical models for polychrome heritage deterioration under temperature and humidity

**No single universal equation exists that predicts colour change (ΔE) of a painted heritage surface purely as a closed-form function of temperature and relative humidity.** This is the central finding of this review. Instead, conservation science relies on a modular framework: Arrhenius kinetics for temperature dependence, sorption isotherms for moisture coupling, first-order kinetics for pigment fading, and Kubelka–Munk theory for translating concentration loss into colorimetric change. For painted surfaces specifically, the literature divides sharply between *chemical* degradation models (colour change, binder breakdown) and *mechanical* damage models (cracking, delamination from hygrothermal cycling), with a smaller body of work on biological and salt-related attack. What follows is a systematic compilation of every major published model, with equations, parameters, and applicability ranges.

---

## The Arrhenius backbone and Michalski's lifetime multiplier

Nearly all chemical degradation models for heritage materials rest on the Arrhenius equation, which relates a reaction rate constant *k* to absolute temperature:

**k = A · exp(−Eₐ / RT)**

where *k* is the rate constant (yr⁻¹ or s⁻¹), *A* is the pre-exponential factor, **Eₐ is the activation energy (J/mol)**, *R* = 8.314 J·mol⁻¹·K⁻¹, and *T* is absolute temperature in Kelvin. Stefan Michalski (Canadian Conservation Institute, 2002) operationalised this into a **lifetime multiplier**:

**LM(T) = exp[(Eₐ/R) · (1/T₂ − 1/T₁)]**

where T₁ is a reference temperature (typically 293.15 K = 20 °C). The famous rule of thumb — **"double the life for each 5 °C drop"** — holds when Eₐ ≈ 100 kJ/mol. At Eₐ ≈ 70 kJ/mol (relevant to linseed oil oxidation), the doubling interval stretches to roughly 7 °C. The CCI provides benchmark lifetime multipliers at Eₐ = 100 kJ/mol: storage at 0 °C gives a **20× longer lifetime** than at 20 °C; at −20 °C the factor reaches **~750×**.

Published activation energies relevant to paint systems include:

| Material / process | Eₐ (kJ/mol) | Source |
|---|---|---|
| Cellulose hydrolysis (paper, canvas) | 100–110 | Zou et al. 1996; Menart et al. 2011 |
| Cellulose triacetate deacetylation | ~92 | Adelstein et al. 1992; IPI/Reilly 1995 |
| Linseed oil autoxidation (peroxide) | ~71 | Kowalski et al. 2017 |
| Linseed oil oxidative stability (PDSC) | 93–95 | Kowalski et al. 2017 |
| Damar resin varnish yellowing | 60–80 | Lafontaine/Michalski, CCI |
| Orpiment pigment (As₂S₃) oxidation | **59.1** | Broers et al. 2023, *JACS* |
| Photochemical fading of organic dyes/pigments | 15–40 | Feller 1994 (Getty) |
| Wood thermal decay | ~85 | Froidevaux & Navi 2013 |

For oil paint and egg tempera binders, Michalski's CCI classification places them in the **1000-year lifetime category** at ~20 °C / ~50 % RH — making them among the most chemically durable organic heritage materials and explaining why few researchers have derived explicit dose-response models for their chemical colour change in the dark.

---

## Sebera's isoperm and the Strang–Grattan revision

Donald Sebera (1994) introduced the **isoperm** — a curve of constant permanence in T–RH space — by coupling Arrhenius temperature dependence with a linear humidity term:

**rate₂/rate₁ = (RH₂/RH₁) · exp[(Eₐ/R) · (1/T₁ − 1/T₂)]**

Here permanence P is the reciprocal of rate, so isoperm curves connect all (T, RH) pairs yielding the same P relative to a reference of 20 °C / 50 % RH. The linear RH assumption was a known weakness; Sebera himself noted it is reasonable only between roughly 30–65 % RH.

Strang and Grattan (2009, *e-Preservation Science* 6: 122–128) replaced the linear assumption with the **Guggenheim–Anderson–de Boer (GAB) sorption isotherm**, which models equilibrium moisture content (MC) more faithfully across the full RH range:

**MC = (m₀ · C_G · K · aᵥ) / [(1 − K·aᵥ)(1 − K·aᵥ + C_G·K·aᵥ)]**

where aᵥ ≈ RH/100, and m₀, C_G, K are material-specific GAB parameters. The revised isoperm becomes:

**rate₂/rate₁ = [MC(RH₂,T₂) / MC(RH₁,T₁)]ⁿ · exp[(Eₐ/R)(1/T₁ − 1/T₂)]**

with *n* typically ≈ 1 for hydrolytic degradation. While developed for paper and cellulose, **the mathematical structure is directly transferable to any hydrolysable organic binder** — including proteinaceous glues in gesso and tempera, and to a lesser extent the ester linkages in drying oils — provided appropriate Eₐ and GAB parameters are substituted.

---

## Strlič's dose-response functions and isochrones for cellulose

Matija Strlič and colleagues at UCL built the most quantitatively developed dose-response framework for heritage organic materials. The core equation (Menart, De Bruin & Strlič, 2011, *Polymer Degradation and Stability* 96: 2029–2039) is based on the Ekenstam chain-scission relation:

**1/DP(t) − 1/DP₀ = k · t**

where DP is the degree of polymerisation and the rate constant incorporates Arrhenius temperature dependence, moisture content via the Paltakari–Karlsson isotherm, and acid catalysis:

**k = (A₀ + A₂·[H₂O] + A₅·[H₂O]·[H⁺]) · exp(−Eₐ/RT)**

The moisture content [H₂O] is computed from:

**[H₂O] = (ln(1 − RH) / (1.67T − 285.655))^(1/(2.491 − 0.012T))**

where RH is a fraction (0–1) and T in Kelvin. Fitted parameters from **121 accelerated ageing experiments** yielded Eₐ ≈ 100–110 kJ/mol. Strlič et al. (2015, *Heritage Science* 3: 40) further developed **isochrones** — contour plots in T–RH space of equal time to reach a fitness-for-use threshold (e.g., DP = 300). A key quantitative finding: **a 20 % RH increase produces roughly the same degradation acceleration as a 4 °C temperature increase** for typical acidic paper.

Liu, Fearn & Strlič (2021, *Heritage Science* 9: 130) extended this to photodegradation using a 2³ factorial design, modelling the colour-change rate constant as:

**k_ΔE = β₀ + β₁x₁ + β₂x₂ + β₃x₃ + β₁₂x₁x₂ + β₁₃x₁x₃ + β₂₃x₂x₃**

where x₁ = [O₂] (5–21 %), x₂ = RH (30–65 %), x₃ = illuminance (18–35 klx), coded as ±1. **RH had the strongest main effect** on discolouration rate; oxygen was second; illuminance (visible, no UV) was weakest. Discolouration followed first-order kinetics: R(t) = R₀·exp(−k_R·t), with ΔE*_ab = √[(ΔL*)² + (Δa*)² + (Δb*)²]. These models address paper rather than paint, but the multivariate regression framework is directly transferable.

---

## Pigment fading kinetics under light, temperature, and humidity

### First-order kinetics of organic pigment fading

Johnston-Feller, Feller, Bailie & Curran (1984, *JAIC* 23(2): 114–129) established the canonical model for opaque paint films pigmented with **alizarin lake and TiO₂** in PVA vehicle:

**ln(C/C₀) = −k₁ · t**

where C is pigment concentration (determined via Kubelka–Munk theory: K/S = (1−R∞)²/(2R∞)), k₁ is a first-order rate constant, and *t* is cumulative radiant exposure at 420 nm in kJ/m². The rate constant was independent of initial pigment concentration and pigment volume concentration. Conditions: Xenon-arc Fade-ometer, ~30–35 °C, ~20 % RH, with 14.8 kJ/m² at 420 nm ≈ 1 hour exposure.

### RH modulation of fading

Saunders & Kirby (1988, *MRS Proceedings* 123: 287–292, National Gallery London) demonstrated that fading rates of **carmine lake, gamboge, alizarin lake, and Vandyke brown** all increase with RH under illumination. The relationship was approximately linear to superlinear, varying by pigment. Feller (1994, *Accelerated Aging*, Getty Conservation Institute) generalised: across many organic dye systems, the maximum fading rate increase from 0 % to 100 % RH ranges from **2–3× for moderately moisture-sensitive systems** up to **5–10× for highly sensitive systems**. For photochemical fading, Eₐ values are characteristically low (**15–40 kJ/mol**), reflecting that the primary activation comes from photon absorption rather than thermal energy.

### General composite rate equation

From the body of literature, the general empirical framework for organic pigment fading can be assembled as:

**dC/dt = −k₀ · I^p · [H₂O(RH,T)]^q · exp(−Eₐ/RT) · C**

| Symbol | Meaning | Typical values |
|---|---|---|
| C | Coloured species concentration | — |
| k₀ | Material-specific pre-exponential | — |
| I | Light intensity (lux or W/m²) | — |
| p | Reciprocity exponent | 1.0 (reciprocity), ~0.5 for some systems |
| [H₂O] | Equilibrium moisture content | From GAB or Paltakari–Karlsson isotherm |
| q | Reaction order w.r.t. water | 0.5–1.0 |
| Eₐ | Activation energy | 15–40 kJ/mol (photochemical); 80–120 kJ/mol (thermal) |
| T | Absolute temperature (K) | — |

Colour change in CIE Lab space is then: **ΔE*_ab(t) ≈ α · [1 − exp(−k·t)]^β**, where α, β are system-specific. This is a framework, not a single fitted equation; no universal closed-form ΔE(T, RH, t) for painted surfaces has been published.

### Inorganic pigment degradation

Inorganic pigments degrade through specific chemical pathways rather than general photofading. Broers et al. (2023, *JACS*) derived an Arrhenius rate law for **orpiment (As₂S₃)** oxidation in paint with **Eₐ = 59.1 kJ/mol** (pH 7.5, 25–40 °C), with the rate R = k·[DO]ⁿ·[H⁺]ᵐ. Other inorganic pigment transformations — smalt alkali leaching (humidity-driven), vermilion darkening (light + chloride), lead white blackening (H₂S), azurite-to-malachite conversion (humid conditions) — are described qualitatively or via chemical equilibria rather than dose-response functions.

---

## Mechanical damage from hygrothermal cycling

### Mecklenburg's laminar structural model

Marion Mecklenburg (Smithsonian, 1982–2007) modelled paintings as laminar composites where each layer (canvas, glue size, ground, paint) responds independently to RH changes. The key equations are:

**Hygroscopic strain:** ε_RH = α_RH · ΔRH, where α_RH is the moisture coefficient of dimensional change per 1 % RH.

**Stress under restraint:** σ = E · α_RH · ΔRH, where E = elastic modulus.

Failure occurs when strain reaches the yield or fracture strain. Critical material properties include: **hide glue α_RH ≈ 4.2 × 10⁻⁴ per % RH**; gesso (glue + CaCO₃) α_RH ≈ 1–2 × 10⁻⁴ per % RH; egg yolk binder α_RH ≈ 1 × 10⁻⁴ per % RH; lead white oil paint α_RH ≈ very low (essentially stable from 0–100 % RH); earth pigment oil paints tolerate only **30–64 % RH**.

### Bratasz's model for painted wood and the HERIe tool

Bratasz and colleagues (Jerzy Haber Institute, Polish Academy of Sciences) developed finite-element models coupling moisture diffusion through wood substrates with mechanical stress in gesso layers. The governing moisture equation is:

**∂M/∂t = ∇·(D(M)·∇M)**

where M = moisture content, D(M) = diffusion coefficient. Equilibrium moisture content is calculated via the GAB isotherm. Dimensional change follows: **ε = α_T · ΔM** (tangential; for lime wood α_T ≈ 0.28). The **critical failure strain for new gesso is ε_crit ≈ 0.002 (0.2 %)**.

Rachwał, Bratasz et al. (2012, *Strain* 48: 474–481) determined fatigue behaviour: single-event fracture occurs at ε ≈ 0.004, while the fatigue endurance limit (10⁴–10⁶ cycles) drops to ε ≈ 0.002 or below. This translates to a **safe RH variation of approximately ±15 % around 50 % RH** for single panels, reducing to **±13 % for 30 mm thick panels with 0.5 mm gesso**. Crucially, panel paintings do not respond significantly to diurnal fluctuations.

Bratasz, Akoglu & Kékicheff (2020, *Heritage Science* 8: 11) introduced the concept of **fracture saturation**: once craquelure is fully developed (crack spacing/gesso thickness ratio S/t drops below ~3–6), no new cracks can form because stress in the gesso is relieved. This makes historically cracked paintings *less* vulnerable than virgin specimens.

The **HERIe web tool** (herie.pl) operationalises these models, accepting T and RH time-series as input and computing strain histories and risk indices for polychrome painted wood objects (Kupczak et al., 2018, *Studies in Conservation* 63(sup1): 151–155; Grøntoft & Stoveland, 2023, *Heritage* 6(3): 3089–3112).

### Michalski's proofed fluctuation concept

Any object that has survived a maximum historical RH fluctuation (the "proofed fluctuation" PF) will not suffer new mechanical damage from future fluctuations of equal or lesser amplitude. Fatigue corrections apply: **~100 additional cycles at PF may produce cracks requiring 1.1×PF for single-event fracture**; conversely, groups of ~100 cycles must remain ≤ 0.9×PF to avoid new damage. This concept underpins the ASHRAE climate control classes for museums (AA: ±5 % RH; A: ±5 % RH with seasonal drift; B: ±10 % RH; C: 25–75 % RH year-round).

---

## Mould growth and biological attack models

Two dominant models predict mould growth on heritage substrates as a function of T and RH:

**The VTT/Finnish Mould Growth Model** (Hukka & Viitanen, 1999, *Wood Science and Technology* 33: 475–485; Ojanen et al. 2011) defines a critical RH threshold below which no mould grows:

**RH_crit = −0.0026T³ + 0.160T² − 3.13T + 100.0** (for T ≤ 20 °C)

When RH ≥ RH_crit, the mould index M (0–6 scale: 0 = no growth, 6 = tight coverage) evolves via:

**dM/dt = (k₁·k₂) / [7·exp(−p_T·ln T − p_RH·ln RH + 0.14W − 0.33SQ + p_C)]**

where W = wood species, SQ = surface quality, and k₁, k₂ are intensity and saturation correction factors. Four material sensitivity classes extend the model beyond wood. Decline when conditions become unfavourable follows step functions (−0.032 for first 6 hours, then −0.016 after 24 hours of dry conditions). Validity: T = 0–50 °C, RH above the material-dependent critical threshold (~80 % for sensitive materials such as untreated wood substrates of panel paintings).

**Sedlbauer's Isopleth Model** (Dissertation, Stuttgart, 2001; Fraunhofer IBP) maps spore germination time and mycelial growth rate on T–RH diagrams for four substrate classes. The **Lowest Isopleth for Mould (LIM)** boundary for biodegradable substrates (Class I, including wood-based heritage) runs approximately from **80 % RH at 20 °C** to **90 % RH at 5 °C**. The biohygrothermal extension models transient spore moisture balance under fluctuating conditions. Krus, Kilian & Sedlbauer (2007) applied this specifically to historic buildings.

---

## Salt crystallisation models relevant to polychrome surfaces

Salt damage is a major deterioration mechanism for wall paintings and polychrome stone. The theoretical framework is anchored by **Steiger's crystallisation pressure equation** (2005, *Journal of Crystal Growth* 282: 455–481):

**Δp = (νRT / V_m) · ln(S)**

where Δp = crystallisation pressure (Pa), ν = number of ions in the salt formula, V_m = molar volume of the solid phase, and S = supersaturation ratio. For NaCl at supersaturation S ≈ 1.5, **Δp ≈ 135 MPa** — vastly exceeding the tensile strength of most stone and plaster substrates (~0.9 MPa for sandstone).

The **ECOS/RUNSALT thermodynamic model** (Price, 2000; Steiger et al., 2008; Godts et al., 2022, *Heritage* 5(4): 3648–3663) uses Pitzer ion-interaction equations to predict crystallisation and dissolution RH thresholds for complex salt mixtures as a function of temperature. The NOAH's ARK project simplified this to counting annual cycles crossing the NaCl deliquescence RH (~75.3 % at 25 °C): **N_salt = 0.5 × number of RH threshold crossings per year**. Grossi, Brimblecombe et al. (2011, *Science of the Total Environment* 409: 2577–2585) mapped these climatologically across Europe.

---

## European heritage programme dose-response functions

### ICP Materials and NOAH's ARK equations for stone and metals

The most mature dose-response functions come from the **UN/ECE ICP Materials** programme, incorporated into the NOAH's ARK and Climate for Culture damage mapping. For **Portland limestone surface recession** (Kucera et al., 2007, *Water Air Soil Pollution: Focus* 7: 249–258):

**R = 2.7·[SO₂]^0.48 · e^(−0.018T) · Rn^0.54 + 0.019·Rain·[H⁺] + 0.175·[HNO₃]^0.41 · Rn^0.61**

where R = surface recession (µm, first year), [SO₂] and [HNO₃] in µg/m³, T in °C, Rn = precipitation (mm). Analogous functions exist for carbon steel, zinc, copper, and bronze corrosion, all incorporating **temperature-dependent terms and time-of-wetness (Rh₆₀ = fraction of time with RH > 60 %)**.

### Soiling of painted surfaces

For **white painted steel** soiling (MULTI-ASSESS / Grossi et al., 2008):

**ΔR = 100·(1 − exp(−3.96 × 10⁻⁶ · PM₁₀ · t))**

where ΔR = reflectance loss (%), PM₁₀ in µg/m³, t in days. Calibrated from Athens, Krakow, and London data at PM₁₀ = 20–80 µg/m³. This is the closest published dose-response function to colour change of an actual painted surface, though it addresses soiling rather than intrinsic pigment degradation.

### Climate for Culture equivalent Lifetime Multiplier (eLM)

The Climate for Culture project (2009–2014; Leissner et al. 2015, *Heritage Science* 3: 38) adopted an Arrhenius-based eLM for indoor heritage:

**eLM = exp[(Eₐ/R) · (1/T₀ − 1/T)] · (RH₀/RH)ⁿ**

with reference conditions T₀ = 293 K, RH₀ = 50 %, Eₐ ≈ 100 kJ/mol for cellulose, and humidity exponent n ≈ 1.3. **eLM < 0.75 flags high chemical degradation risk.** This was applied across European historic buildings using whole-building hygrothermal simulation coupled with regional climate models to project future indoor conditions.

### PROPAINT dosimeter equations for painting varnishes

The PROPAINT project (Grøntoft et al., 2010, *Journal of Cultural Heritage* 11: 411–419) developed dose-response equations for early-warning dosimeters mimicking painting varnish degradation:

**ΔF_EWO = a₁·[NO₂]·t + a₂·[O₃]·t + a₃·RH·t**

where pollutant concentrations are in µg/m³ and t in days. While these are surrogate-material models, they quantify the combined effect of indoor pollutants and RH on organic coatings relevant to painted surfaces.

---

## Chemo-mechanical coupling: the frontier

The most sophisticated recent models couple chemical and mechanical degradation. Eumelen, Bosco & Suiker (2019, *J. Mechanics and Physics of Solids* 132: 103683; 2023, *European J. Mechanics A/Solids* 97: 104827) modelled **metal soap formation in oil paintings** — where free fatty acids diffuse and react with lead or zinc ions to form crystalline aggregates that induce volumetric growth strain ε_g:

**σ = C : (ε − ε_g)**

with fracture modelled via cohesive zone elements. This captures the protrusions and paint loss observed in many Old Master paintings. Bosco, Suiker & Fleck (2021, *Theoretical and Applied Fracture Mechanics* 112: 102779) further modelled **moisture-induced cracking** in flexural bilayer paint systems using standard hygro-mechanical coupling:

**σ_ij = C_ijkl · (ε_kl − β_kl · ΔM)**

where β is the hygroscopic expansion tensor and fracture initiates when the energy release rate G ≥ G_c. These computational models represent the state of the art but require finite-element simulation rather than simple analytical equations.

---

## Conclusion: a modular toolkit rather than a master equation

The conservation science literature provides a rich but fragmented landscape of deterioration models. **Chemical colour change of pigments is overwhelmingly light-driven**, with temperature and humidity as modifying factors; this is why no standalone ΔE = f(T, RH, t) equation has been validated for painted surfaces. The closest general framework combines first-order fading kinetics (Johnston-Feller), Arrhenius temperature scaling (Eₐ = 15–40 kJ/mol for photofading, 60–110 kJ/mol for thermal/hydrolytic processes), and moisture coupling via GAB or Paltakari–Karlsson isotherms — but this must be parameterised for each specific pigment–binder system.

For *binder degradation* causing yellowing or embrittlement, the Strlič/Menart dose-response framework is the most empirically grounded, though validated only for cellulose. Michalski's lifetime multiplier and the Climate for Culture eLM offer practical T–RH screening tools applicable to organic heritage materials broadly. For *mechanical damage*, the Bratasz/HERIe model and Mecklenburg's material property data provide quantitative predictions of cracking risk from RH fluctuations, with the proofed fluctuation concept offering a pragmatic risk threshold. The field's critical gap remains the absence of pigment-specific, experimentally fitted dose-response functions linking ΔE to T and RH for the most common heritage paint systems — oil, tempera, fresco — under realistic indoor museum or church conditions. Future work integrating microfading spectroscopy data with Arrhenius humidity corrections, validated against naturally aged reference collections, would begin to close this gap.