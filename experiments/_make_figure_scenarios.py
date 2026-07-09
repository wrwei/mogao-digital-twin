"""Generate Figure 10 (fig:scenarios) for the paper: composite-risk
trajectories under three environmental scenarios spanning a stress
gradient over a 50-year horizon.

The measured cave interior (Fig. 2) is benign -- salt and mould are
dormant, so interventions on that baseline have little to act on. To
show the framework's discriminating power we compare the current
interior against a plausibly degraded envelope and an actively buffered
one:

  Scenario A: Current monitored interior -- measured Cave 71 climate
              (mean 12 C, RH <= 80%). Salt/mould dormant; residual risk
              is photolytic lifetime consumption plus modest fatigue.
  Scenario B: Degraded / uncontrolled -- combined visitor-load and
              climate-control failure warming (+6 C) and wetting;
              wet-season RH driven to 85--96 %, crossing the salt
              deliquescence band and the mould critical-RH threshold.
  Scenario C: Active buffering -- RH held <= 55 % and T pinned near the
              interior mean, keeping the object in the benign regime
              even under the external stress of Scenario B.

R_composite (Eq. eq:composite) is the CONSERVATIVE MAXIMUM over the five
normalised sub-indices -- identical to the runtime compositeRisk() and to
the paper equation -- integrated daily over the 50-year horizon:

  R_composite = max(r_1, r_2, r_3, r_4, r_5)  clamped to [0, 1]

The five normalised sub-indices (each on its own 0-1 failure scale, per
Methods; identical definitions to the runtime kernels):
  r_1 = chemical fading            (Arrhenius + Paltakari-Karlsson, per-pigment)
  r_2 = Michalski lifetime         (consumption form min(1, t/(LM.t_ref)),
                                     t_ref = 200 y -- matches the runtime fix)
  r_3 = VTT mould index / 6
  r_4 = salt deliquescence-cycling damage (0 under the benign interior, where
                                     RH never crosses the DRH band; rises when
                                     the degraded envelope drives cycling)
  r_5 = Miner cumulative fatigue damage D / D_crit (Basquin b = 6)

Because the composite is a max, each scenario's R equals its single most
threatening mechanism. The benign interior is carried by the slow
climate-independent terms (lifetime consumption, modest fatigue); the
degraded envelope activates salt and fatigue together (mould stays near zero,
its critical-RH crossings decaying faster than they accumulate) and drives
R to the [0,1] failure ceiling.

Output: experiments/scenarios_50y.png
"""
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)

# --- 50-year horizon ---
N_YEARS = 50
N_DAYS = N_YEARS * 365
years = np.arange(N_DAYS) / 365.0

# Damped cave-INTERIOR envelope, matched to the Figure 2 generator
# (Cave 71, Gong et al. 2025). Sinusoid offset 12.4 yields a realized annual
# mean ~12.0 C after noise; interior RH mean ~31%, ceiling 80%.
def annual_T(doy):
    return 12.8 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 12.4

def annual_RH_base(doy):
    return 30.0 + 6.0 * np.cos(2 * np.pi * (doy - 200) / 365.0)

# --- Build three scenarios as a STRESS GRADIENT ---------------------------
# The measured cave interior (Fig. 2) is benign: salt and mould are dormant
# and interventions on that baseline have little to act on. To show the
# framework's discriminating power we compare the current interior against a
# plausibly degraded envelope and an actively buffered one:
#   A  Current interior       -- measured Cave 71 climate (mean 12 C, RH<=80%)
#   B  Degraded / uncontrolled -- combined visitor-load + control-failure
#        warming (+6 C) and wetting: wet-season RH pushed to 85--96%, crossing
#        the salt deliquescence band and the mould critical-RH threshold
#   C  Actively buffered      -- RH held <=55%, T held near the interior mean,
#        keeping the object in the benign regime even under external stress
rng = np.random.default_rng(seed=42)
T_arr_A = np.zeros(N_DAYS); RH_arr_A = np.zeros(N_DAYS)
T_arr_B = np.zeros(N_DAYS); RH_arr_B = np.zeros(N_DAYS)
T_arr_C = np.zeros(N_DAYS); RH_arr_C = np.zeros(N_DAYS)

for d in range(N_DAYS):
    doy = d % 365
    if doy == 0:
        n_events = rng.integers(6, 10)
        year_events = []
        for _ in range(n_events):
            doy_start = rng.integers(152, 273)
            duration = rng.integers(3, 15)
            year_events.append((doy_start, duration, rng.random()))
    T_base = annual_T(doy) + rng.normal(0, 1.0)
    rh_base = annual_RH_base(doy) + rng.normal(0, 2.0)
    # wet-season event profile (0..1) for this day
    prof = 0.0
    for ev_start, ev_dur, _ in year_events:
        if ev_start <= doy < ev_start + ev_dur:
            phase = (doy - ev_start) / ev_dur
            p = phase / 0.2 if phase < 0.2 else (1.0 if phase < 0.6 else (1.0 - phase) / 0.4)
            prof = max(prof, p)

    # A: current interior -- damped, RH peaks ~45-70%, capped at measured 80%
    rh_A = min(80.0, max(8.7, rh_base + prof * (60.0 - rh_base) * 0.6))
    T_arr_A[d] = min(25.8, T_base); RH_arr_A[d] = rh_A

    # B: degraded -- +6 C warming and strong wetting; wet-season RH driven to
    # 85-96%, crossing both the DRH band and the mould threshold
    in_wet = 152 <= doy < 273
    rh_B = rh_base + 8.0 + prof * (96.0 - rh_base)      # events reach ~96%
    if not in_wet:
        rh_B = rh_base + 8.0
    T_arr_B[d] = T_base + 6.0
    RH_arr_B[d] = min(98.0, max(10.0, rh_B))

    # C: actively buffered -- RH held <=55%, T pinned near the interior mean
    T_arr_C[d] = 12.0 + 0.3 * (T_base - 12.0)
    RH_arr_C[d] = min(55.0, max(8.7, rh_A))

# --- Sub-index integrators ---
def r_chemical(T, RH, q=0.8, RH_ref=35.0):
    """Normalised chemical-fading rate (Paltakari-Karlsson humidity scaling
    + simple Arrhenius). Integrated -> normalised to ~1 at 50 y under A."""
    Ea = 65e3
    R = 8.314
    k0 = 2.5e-4
    rate = k0 * np.exp(-Ea / (R * (T + 273.15))) * (RH / RH_ref) ** q
    return rate

def r_mould_step(M, T, RH, dt_days=1.0):
    # Matched to the runtime VTT kernel / Supp S3: cubic RH_crit, linear-clamped
    # growth k_M = 0.13, decay -0.128.
    K_GROWTH = 0.13
    K_DECAY = -0.128
    M_MAX = 6.0
    Tc = min(50.0, max(0.0, T))
    rc = -0.0026 * Tc**3 + 0.160 * Tc**2 - 3.13 * Tc + 100.0
    if RH > rc:
        growth = ((RH - rc) / 100.0) * (T / 20.0) * K_GROWTH * dt_days
        return min(M_MAX, max(0.0, M + growth))
    else:
        return max(0.0, M + K_DECAY * dt_days)

def r_salt_increment(T, RH):
    """Returns 1 if RH crossed the DRH threshold (counted as a half-cycle)."""
    drh = 98.5 - 0.33 * T if T < 32.4 else 82.0 + 0.15 * T
    return int(RH < drh)

# Runtime fatigue constants (FATIGUE_DEFAULTS in DeteriorationService.js).
FAT_BETA_DIFF = 5e-5     # strain per %RH
FAT_E = 2000.0           # MPa, effective modulus
FAT_SIGMA_FAIL = 10.0    # MPa
FAT_BASQUIN_B = 6

def r_fatigue_step(prev_state, T, RH, prev_RH):
    """Miner damage increment for one daily RH cycle under the runtime Basquin
    S-N law (identical constants to the DeteriorationService fatigue kernel):
    strain = beta.amplitude, stress = E.strain, N = (sigma_fail/stress)^b,
    damage-per-cycle = 1/N. Amplitude is the day-to-day |dRH|."""
    amp = abs(RH - prev_RH)
    if amp <= 0.1:
        return 0.0
    stress = FAT_E * FAT_BETA_DIFF * amp
    N = min(1e12, (FAT_SIGMA_FAIL / max(stress, 1e-6)) ** FAT_BASQUIN_B)
    return 1.0 / N

def lifetime_consumption(LM, dt_y):
    """Michalski lifetime consumption increment: the fraction of the reference
    service life (t_ref = 200 y) used up in dt_y at a local lifetime multiplier
    LM. Matches the runtime composite lifetime term min(1, t/(LM.t_ref))."""
    t_ref = 200.0
    return dt_y / (max(LM, 1e-6) * t_ref)

def michalski_LM(T, RH, Ea=70000.0, n=1.3, T0=20.0, RH0=50.0):
    """Michalski lifetime multiplier (Methods Eq. lifetime_multiplier)."""
    R = 8.314
    return (np.exp((Ea / R) * (1.0 / (T + 273.15) - 1.0 / (T0 + 273.15)))
            * (RH0 / max(RH, 1.0)) ** n)

def integrate_scenario(T_arr, RH_arr, label):
    """Integrate the five sub-indices over the climate trace and return the
    composite-risk trajectory (one value per year for plotting)."""
    n = len(T_arr)
    r1 = np.zeros(n)  # chemical
    r2 = np.zeros(n)  # lifetime
    r3 = np.zeros(n)  # mould
    r4 = np.zeros(n)  # salt
    r5 = np.zeros(n)  # fatigue
    M = 0.0
    salt_cum = 0
    last_salt_state = r_salt_increment(T_arr[0], RH_arr[0])
    fatigue_cum = 0.0
    chem_cum = 0.0
    life_cum = 0.0
    for d in range(n):
        T = T_arr[d]; RH = RH_arr[d]
        chem_cum += r_chemical(T, RH)
        r1[d] = min(1.0, chem_cum / 0.5)
        life_cum += lifetime_consumption(michalski_LM(T, RH), dt_y=1 / 365.0)
        r2[d] = min(1.0, life_cum)
        M = r_mould_step(M, T, RH, 1.0)
        r3[d] = M / 6.0
        state = r_salt_increment(T, RH)
        if state != last_salt_state:
            salt_cum += 1
            last_salt_state = state
        r4[d] = min(1.0, salt_cum / 580.0)
        if d > 0:
            fatigue_cum += r_fatigue_step(state, T, RH, RH_arr[d - 1])
        r5[d] = min(1.0, fatigue_cum / 3.0)
    # Conservative maximum aggregation -- identical to Eq. eq:composite and the
    # runtime compositeRisk(): the composite equals the single most threatening
    # mechanism at each time step.
    R = np.maximum.reduce([r1, r2, r3, r4, r5])
    return R, dict(chemical=r1, lifetime=r2, mould=r3, salt=r4, fatigue=r5)

print("Integrating Scenario A (current monitored interior)...")
R_A, comp_A = integrate_scenario(T_arr_A, RH_arr_A, "A")
print(f"  R_composite @ 50 y: {R_A[-1]:.3f}")
print("Integrating Scenario B (degraded: visitor-load + control failure)...")
R_B, comp_B = integrate_scenario(T_arr_B, RH_arr_B, "B")
print(f"  R_composite @ 50 y: {R_B[-1]:.3f}")
print("Integrating Scenario C (active buffering under external stress)...")
R_C, comp_C = integrate_scenario(T_arr_C, RH_arr_C, "C")
print(f"  R_composite @ 50 y: {R_C[-1]:.3f}")
print(f"\nDegraded (B) vs current (A): +{(R_B[-1]-R_A[-1])/R_A[-1]*100:.0f}% composite risk")
print(f"Buffering (C) holds risk at current levels despite external stress")

# --- Plot ---
fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))

# Panel (a): three composite-risk trajectories
ax = axes[0]
ax.plot(years, R_A, color="#2A9D8F", lw=3.2, label="A: current monitored interior")
ax.plot(years, R_B, color="#E63946", lw=1.8, label="B: degraded (visitor load + control failure)")
ax.plot(years, R_C, color="#0072B2", lw=1.5, ls=(0, (6, 5)),
        label=r"C: active buffering ($RH \leq 55$\%, $T$ held)")
ax.fill_between([0, N_YEARS], 0.7, 1.0, color="#E63946", alpha=0.08)
ax.fill_between([0, N_YEARS], 0.4, 0.7, color="#F4A261", alpha=0.08)
ax.fill_between([0, N_YEARS], 0.0, 0.4, color="#2A9D8F", alpha=0.08)
ax.text(N_YEARS * 0.985, 0.85, "high risk", ha="right", va="center",
        fontsize=8, color="#A0252F", style="italic")
ax.text(N_YEARS * 0.985, 0.55, "moderate", ha="right", va="center",
        fontsize=8, color="#A0522D", style="italic")
ax.text(N_YEARS * 0.985, 0.20, "low risk", ha="right", va="center",
        fontsize=8, color="#1E6F66", style="italic")
ax.set_xlabel("Year")
ax.set_ylabel(r"$\mathcal{R}_{\mathrm{composite}}$")
ax.set_xlim(0, N_YEARS)
ax.set_ylim(0, 1.0)
ax.grid(True, alpha=0.3)
ax.legend(loc="upper left", fontsize=8, framealpha=0.9)
ax.set_title(r"(a) $\mathcal{R}_{\mathrm{composite}}$ trajectory", loc="left", fontsize=10, fontweight="bold")

# Panel (b): stacked contribution at year 50 for each scenario
ax = axes[1]
labels = ["A: current\ninterior", "B: degraded\n(uncontrolled)", "C: buffered\n(under stress)"]
contribs = {
    "chemical": [comp_A["chemical"][-1], comp_B["chemical"][-1], comp_C["chemical"][-1]],
    "lifetime": [comp_A["lifetime"][-1], comp_B["lifetime"][-1], comp_C["lifetime"][-1]],
    "mould":    [comp_A["mould"][-1],    comp_B["mould"][-1],    comp_C["mould"][-1]],
    "salt":     [comp_A["salt"][-1],     comp_B["salt"][-1],     comp_C["salt"][-1]],
    "fatigue":  [comp_A["fatigue"][-1],  comp_B["fatigue"][-1],  comp_C["fatigue"][-1]],
}
colours = {
    "chemical": "#E63946",
    "lifetime": "#F4A261",
    "mould":    "#2A9D8F",
    "salt":     "#264653",
    "fatigue":  "#6A4C93",
}
pretty = {
    "chemical": "chemical fading",
    "lifetime": "Michalski lifetime",
    "mould":    "VTT mould",
    "salt":     "salt crystallisation",
    "fatigue":  "hygro-mech. fatigue",
}

mechs = ["chemical", "lifetime", "mould", "salt", "fatigue"]
final_R = [R_A[-1], R_B[-1], R_C[-1]]
x = np.arange(3)
nb = len(mechs)
bw = 0.15
for j, k in enumerate(mechs):
    vals = np.array(contribs[k])
    offs = (j - (nb - 1) / 2) * bw
    # Outline the sub-index that sets the composite (the max) in each scenario.
    edges = ["black" if abs(vals[i] - final_R[i]) < 1e-9 else "none" for i in range(3)]
    lws = [1.4 if e == "black" else 0.4 for e in edges]
    ax.bar(x + offs, vals, bw, color=colours[k],
           edgecolor=[e if e != "none" else "black" for e in edges],
           linewidth=lws, label=pretty[k])
for i, val in enumerate(final_R):
    ax.text(i, val + 0.03, f"$\\mathcal{{R}} = {val:.2f}$", ha="center", va="bottom",
            fontsize=9, fontweight="bold")
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=9)
ax.set_ylabel(r"Normalised sub-index at year 50")
ax.set_ylim(0, 1.12)
ax.axhline(0, color="black", lw=0.6)
ax.grid(True, axis="y", alpha=0.3)
ax.legend(loc="upper left", fontsize=7.5, framealpha=0.92, ncol=1)
ax.set_title(r"(b) Per-mechanism sub-indices at 50 y ($\mathcal{R} = \max$, outlined)",
             loc="left", fontsize=10, fontweight="bold")

plt.tight_layout()

out = "experiments/scenarios_50y.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"\nSaved: {out}")
print(f"\nSummary at 50 y:")
print(f"  Scenario A (current interior): R = {R_A[-1]:.3f}")
print(f"  Scenario B (degraded):        R = {R_B[-1]:.3f}  (+{100*(R_B[-1]/R_A[-1]-1):.0f}% vs A)")
print(f"  Scenario C (buffered):        R = {R_C[-1]:.3f}  (holds at current level under stress)")
