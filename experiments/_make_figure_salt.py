"""Generate Figure 8 (fig:salt) for the paper: salt-crystallisation
pressure time-series and cumulative half-cycle count over 50 years.

  (a) Crystallisation pressure Delta_p time-series for mirabilite and
      thenardite (Methods Eq. eq:steiger), plotted against the
      substrate tensile-strength band 0.1--0.5 MPa (shaded), driven by
      the Mogao climate exemplar.
  (b) Cumulative half-cycle count over 50 years -- each DRH(T)
      crossing in either direction increments the cycle counter --
      with monsoon-year accumulation accelerated.

Steiger equation (ideal-solution form, Methods Eq. eq:steiger):
  Delta_p = nu * R * T_kelvin / V_m * ln(S)

where nu=3 for Na2SO4 dissociation, V_m is the molar volume of the
precipitating crystal phase, and S is the supersaturation ratio.

Mirabilite (Na2SO4 . 10H2O): V_m = 218e-6 m^3/mol, stable T < 32.4 C
Thenardite (Na2SO4):         V_m = 53.3e-6 m^3/mol, stable T > 32.4 C

DRH thresholds (linear fits to Steiger and Asmussen Pitzer):
  DRH_mir(T) = 98.5 - 0.33 * T_C   (valid 0..32 C)
  DRH_the(T) = 82.0 + 0.15 * T_C   (valid 10..40 C)

We compute Delta_p whenever RH < DRH (supersaturated, crystallisation
driving force present) using S = DRH/RH.

Output: experiments/salt_crystallisation.png
"""
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

np.random.seed(42)

R = 8.314           # J/(mol*K)
NU = 3
V_M_MIR = 218e-6    # m^3/mol
V_M_THE = 53.3e-6
T_PERI_C = 32.4     # mirabilite/thenardite peritectic
SIGMA_T_LO = 0.1e6  # Pa  (lower substrate tensile strength)
SIGMA_T_HI = 0.5e6  # Pa  (upper substrate tensile strength)

def drh_mir(T_C):
    return 98.5 - 0.33 * T_C

def drh_the(T_C):
    return 82.0 + 0.15 * T_C

def crystallisation_pressure(T_C, RH, mirabilite=True):
    """Steiger ideal-solution form. Return Delta_p in Pa (0 if not
    supersaturated)."""
    drh = drh_mir(T_C) if mirabilite else drh_the(T_C)
    if RH >= drh or RH <= 0:
        return 0.0
    V_m = V_M_MIR if mirabilite else V_M_THE
    S = drh / RH
    if S <= 1.0:
        return 0.0
    T_K = T_C + 273.15
    return NU * R * T_K / V_m * np.log(S)

# --- Generate 50-year hourly Mogao climate exemplar ---
N_YEARS = 50
N_DAYS = N_YEARS * 365
times = np.arange(N_DAYS) / 365.0

def annual_T(doy):
    # Damped cave-interior temperature (mean 12.4 C, this simplified sinusoid
    # spans ~-0.4..+25.2 C). Only the upper end matters for the salt phase:
    # the interior never reaches the 32.4 C mirabilite/thenardite peritectic
    # (measured Cave-71 interior max ~25.8 C, Gong et al. 2025), so mirabilite
    # is the stable phase year-round. The measured interior annual minimum is
    # lower (-6.7 C) but is immaterial here, as salt behaviour is governed by
    # the RH-vs-DRH gap, not by the cold extreme.
    return 12.8 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 12.4

def annual_RH(doy):
    # Interior baseline RH (mean ~31%, drier winter/spring, modest wet-season
    # rise). Capped at the measured 80% interior ceiling downstream.
    return 30.0 + 6.0 * np.cos(2 * np.pi * (doy - 200) / 365.0)

rng = np.random.default_rng(seed=42)
T_arr = np.zeros(N_DAYS)
RH_arr = np.zeros(N_DAYS)
monsoon_intensity = np.zeros(N_YEARS)
for d in range(N_DAYS):
    doy = d % 365
    yr = d // 365
    if doy == 0:
        n_events = rng.integers(6, 11)
        # Monsoon intensity varies year to year
        intensity = rng.uniform(0.5, 1.5)
        monsoon_intensity[yr] = intensity
        year_events = []
        for _ in range(n_events):
            doy_start = rng.integers(152, 273)
            duration = rng.integers(3, 15)
            # Interior wet-season rises are damped: peaks approach but stay
            # below the measured 80% interior ceiling (rock-mass buffering).
            peak = rng.uniform(45, 70) * min(intensity, 1.15)
            year_events.append((doy_start, duration, peak))
    # Interior temperature is rock-damped: no sharp summer heat domes, and the
    # 32.4 C peritectic is never reached (interior max ~25.8 C).
    T_arr[d] = min(25.8, annual_T(doy) + rng.normal(0, 0.6))
    rh_base = annual_RH(doy) + rng.normal(0, 2.0)
    rh_spike = 0.0
    for ev_start, ev_dur, ev_peak in year_events:
        if ev_start <= doy < ev_start + ev_dur:
            phase = (doy - ev_start) / ev_dur
            if phase < 0.2:
                profile = phase / 0.2
            elif phase < 0.6:
                profile = 1.0
            else:
                profile = (1.0 - phase) / 0.4
            rh_spike = max(rh_spike, (ev_peak - rh_base) * profile)
    RH_arr[d] = min(80.0, max(8.7, rh_base + rh_spike))  # measured interior extremes (Gong et al. 2025)

# --- Compute crystallisation pressure time-series (panel a) ---
dp_mir = np.zeros(N_DAYS)
dp_the = np.zeros(N_DAYS)
for d in range(N_DAYS):
    T = T_arr[d]; RH = RH_arr[d]
    if T < T_PERI_C:
        dp_mir[d] = crystallisation_pressure(T, RH, mirabilite=True) / 1e6  # MPa
    else:
        dp_the[d] = crystallisation_pressure(T, RH, mirabilite=False) / 1e6

# --- Count DRH crossings (half-cycles) ---
# A half-cycle = transition above->below or below->above the DRH threshold
# for the currently stable phase
phase_drh = np.where(T_arr < T_PERI_C, drh_mir(T_arr), drh_the(T_arr))
state = RH_arr < phase_drh  # True = supersaturated / crystallising
cycles = np.zeros(N_DAYS)
last_state = state[0]
n_cycles = 0
for d in range(1, N_DAYS):
    if state[d] != last_state:
        n_cycles += 1
        last_state = state[d]
    cycles[d] = n_cycles

# --- Plot ---
fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# Panel (a): pressure time-series (sampled at weekly resolution for visibility)
ax = axes[0]
ax.fill_between([0, N_YEARS], SIGMA_T_LO / 1e6, SIGMA_T_HI / 1e6,
                color="gray", alpha=0.20, label=r"substrate $\sigma_t$ band (0.1--0.5 MPa)")
# Plot only the first 10 years for visual clarity in panel (a)
zoom_years = 10
mask = times < zoom_years
ax.plot(times[mask], dp_mir[mask], color="#2E86AB", lw=0.7, alpha=0.85,
        label="mirabilite ($T<32.4$ \xb0C)")
ax.plot(times[mask], dp_the[mask], color="#E63946", lw=0.7, alpha=0.85,
        label="thenardite ($T \\geq 32.4$ \xb0C)")
ax.set_yscale("log")
ax.set_ylim(0.01, 200)
ax.set_xlim(0, zoom_years)
ax.set_xlabel("Year")
ax.set_ylabel(r"Crystallisation pressure $\Delta p$ (MPa, log scale)")
ax.set_title("(a) Steiger crystallisation pressure", loc="left", fontsize=10, fontweight="bold")
ax.grid(True, alpha=0.3, which="both")
ax.legend(loc="upper right", fontsize=8, framealpha=0.9)
ax.text(0.04, 0.06,
        f"peak $\\Delta p$ (mir): {dp_mir.max():.1f} MPa\n"
        f"peak $\\Delta p$ (the): {dp_the.max():.1f} MPa\n"
        f"both well above $\\sigma_t = 0.1$--$0.5$ MPa",
        transform=ax.transAxes, fontsize=7.5, va="bottom", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#FFF8E1", edgecolor="#999", alpha=0.85))

# Panel (b): interior RH vs mirabilite DRH over a representative year --
# shows the deliquescence gap never closes, hence zero wet--dry cycles and
# a persistently supersaturated (statically stressed) crystalline phase.
ax = axes[1]
rep = np.arange(365)                       # one representative year
RH_year = RH_arr[:365]
drh_mir_year = drh_mir(T_arr[:365])
ax.plot(rep, RH_year, color="#2E86AB", lw=0.9, label="interior $RH$")
ax.plot(rep, drh_mir_year, color="#888", lw=1.4, ls=":",
        label=r"$\mathrm{DRH}_{\mathrm{mir}}(T)$ (deliquescence)")
ax.fill_between(rep, RH_year, drh_mir_year, where=(drh_mir_year > RH_year),
                color="#2E86AB", alpha=0.12,
                label="supersaturation gap (always $>0$)")
ax.axhline(80.0, color="#2E86AB", lw=0.8, ls="--", alpha=0.6,
           label="measured $RH$ ceiling (80%)")
ax.set_xlabel("Day of year")
ax.set_ylabel("Relative humidity (%)")
ax.set_title(r"(b) Interior $RH$ vs deliquescence threshold", loc="left", fontsize=10, fontweight="bold")
ax.set_xlim(0, 365)
ax.set_ylim(0, 100)
ax.grid(True, alpha=0.3)
ax.legend(loc="lower center", fontsize=7.5, framealpha=0.9, ncol=2)
ax.text(0.035, 0.52,
        f"DRH crossings in {N_YEARS} y: {int(cycles[-1])}\n"
        f"phase: mirabilite, persistently supersaturated\n"
        f"$\\Rightarrow$ sustained static pressure, not cyclic",
        transform=ax.transAxes, fontsize=7.5, va="top", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#F3E5F5", edgecolor="#6A4C93", alpha=0.85))

plt.tight_layout()

out = "experiments/salt_crystallisation.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
print(f"Mirabilite peak pressure: {dp_mir.max():.2f} MPa")
print(f"Thenardite peak pressure: {dp_the.max():.2f} MPa")
print(f"Cumulative half-cycles over {N_YEARS} y: {int(cycles[-1])}")
print(f"Interior RH max: {RH_arr.max():.1f}%, min DRH_mir: {drh_mir(T_arr).min():.1f}%")
