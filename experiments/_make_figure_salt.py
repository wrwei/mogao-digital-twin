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
    # Peak summer ~32 C, winter ~-5 C, mean ~13.5 C -- captures the Mogao
    # range that occasionally crosses the 32.4 C peritectic in summer
    return 18.0 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 13.5

def annual_RH(doy):
    return 35.0 + 5.0 * np.cos(2 * np.pi * (doy - 60) / 365.0)

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
            peak = rng.uniform(70, 95) * intensity
            year_events.append((doy_start, duration, peak))
    # Add summer heat-event tail (occasional +3-5 C heat dome)
    heat_event_kick = 0.0
    if 180 < doy < 240 and rng.random() < 0.04:
        heat_event_kick = rng.uniform(3.0, 6.0)
    T_arr[d] = annual_T(doy) + rng.normal(0, 1.2) + heat_event_kick
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
    RH_arr[d] = min(98, max(15, rh_base + rh_spike))

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
ax.set_title(f"(a) Steiger crystallisation pressure (first {zoom_years} y shown for clarity)",
             fontsize=10)
ax.grid(True, alpha=0.3, which="both")
ax.legend(loc="upper right", fontsize=8, framealpha=0.9)
ax.text(0.04, 0.06,
        f"peak $\\Delta p$ (mir): {dp_mir.max():.1f} MPa\n"
        f"peak $\\Delta p$ (the): {dp_the.max():.1f} MPa\n"
        f"both well above $\\sigma_t = 0.1$--$0.5$ MPa",
        transform=ax.transAxes, fontsize=7.5, va="bottom", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#FFF8E1", edgecolor="#999", alpha=0.85))

# Panel (b): cumulative half-cycle count
ax = axes[1]
ax.plot(times, cycles, color="#6A4C93", lw=1.4)
# Mark monsoon years (intensity > 1) with vertical light-orange spans
for yr in range(N_YEARS):
    if monsoon_intensity[yr] > 1.2:
        ax.axvspan(yr, yr + 1, color="orange", alpha=0.10)
ax.set_xlabel("Year")
ax.set_ylabel("Cumulative half-cycle count")
ax.set_title(f"(b) Cumulative DRH crossings over {N_YEARS} years",
             fontsize=10)
ax.set_xlim(0, N_YEARS)
ax.grid(True, alpha=0.3)
mean_per_year = cycles[-1] / N_YEARS
ax.text(0.04, 0.92,
        f"total half-cycles in {N_YEARS} y: {int(cycles[-1])}\n"
        f"mean ${{\\sim}}{mean_per_year:.1f}$ /year\n"
        f"orange shading = above-average monsoon years",
        transform=ax.transAxes, fontsize=8, va="top", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#F3E5F5", edgecolor="#6A4C93", alpha=0.85))

fig.suptitle("Salt crystallisation under the Cave 1 microclimate (Model 5)",
             y=1.02, fontsize=11.5, fontweight="bold")
fig.text(0.5, -0.04,
         r"Steiger ideal-solution form: $\Delta p = \nu R T / V_m \cdot \ln(S)$ with $\nu=3$ for Na$_2$SO$_4$ dissociation, "
         r"$V_m = 218 \times 10^{-6}$ m$^3$/mol (mirabilite, $T<32.4$ \textdegree{}C) or $53.3 \times 10^{-6}$ m$^3$/mol "
         r"(thenardite, $T \geq 32.4$ \textdegree{}C), $S = \mathrm{DRH}/RH$.  "
         r"DRH$_{\mathrm{mir}}(T) = 98.5 - 0.33 T_C$, DRH$_{\mathrm{the}}(T) = 82.0 + 0.15 T_C$ (linear fits to Steiger \& Asmussen Pitzer curves).",
         ha="center", va="bottom", fontsize=7.5, style="italic", color="#555555", wrap=True)
plt.tight_layout()

out = "experiments/salt_crystallisation.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
print(f"Mirabilite peak pressure: {dp_mir.max():.2f} MPa")
print(f"Thenardite peak pressure: {dp_the.max():.2f} MPa")
print(f"Cumulative half-cycles over {N_YEARS} y: {int(cycles[-1])}")
print(f"Mean cycles per year: {mean_per_year:.2f}")
