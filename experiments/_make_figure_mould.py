"""Generate Figure 7 (fig:mould) for the paper: VTT Hukka-Viitanen
mould index M trajectory under two scenarios.

  (a) Monitored Cave 1 microclimate over 200 years -- M stays near zero
      because baseline RH (25-40%) is well below the temperature-
      dependent critical RH (~80% at cave T) and monsoon spikes
      decay before the index can climb meaningfully.

  (b) HVAC failure scenario at sustained T = 25 C, RH = 90% --
      M ramps to the saturation value M = 6 within ~1 year.

Model (Supplementary Methods S3, Eqs. s_rh_crit / s_mould_rate; identical
to the runtime kernel DeteriorationService.mouldGrowth):
  RH_crit(T) = -0.0026*T^3 + 0.160*T^2 - 3.13*T + 100   (0 <= T <= 50 C)
               (~80.6% at 20 C, ~79.9% at 30 C, ~64.4% at 40 C)
  Above threshold (RH >= RH_crit):
    dM/dt = ((RH - RH_crit) / 100) * (T / 20) * k_M,  k_M = 0.13 /day
    (linear accumulation, clamped to the VTT 0-6 scale; no logistic term)
  Below threshold:
    dM/dt = -0.128 /day   (dessication of hyphae)

Output: experiments/mould_trajectory.png
"""
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

np.random.seed(42)

K_GROWTH = 0.13      # /day  (k_M, Supplementary S3 Eq. s_mould_rate)
K_DECAY = -0.128     # /day  below threshold (Supplementary S3)
M_MAX = 6.0

def rh_crit(T):
    """Critical RH threshold for VTT mould — cubic fit, Supplementary S3
    Eq. s_rh_crit, valid 0-50 C (clamped)."""
    Tc = min(50.0, max(0.0, T))
    return -0.0026 * Tc**3 + 0.160 * Tc**2 - 3.13 * Tc + 100.0

def vtt_step(M, T, RH, dt_days):
    """One forward step of the VTT mould index integration (paper/code form:
    linear growth clamped to [0, 6], constant decay below threshold)."""
    rc = rh_crit(T)
    if RH >= rc and T > 0:
        dM = ((RH - rc) / 100.0) * (T / 20.0) * K_GROWTH * dt_days
    else:
        dM = K_DECAY * dt_days
    return max(0.0, min(M_MAX, M + dM))

# --- Scenario (a): monitored Mogao climate, 200 years, daily timesteps ---
print("Building 200-year Mogao climate exemplar (daily timesteps)...")
N_YEARS = 200
N_DAYS = N_YEARS * 365
years_axis_a = np.arange(N_DAYS) / 365.0

# Annual cycle for daily T and RH -- damped cave-INTERIOR envelope, matched to
# the Figure 2 generator (Cave 71, Gong et al. 2025). The sinusoid offset 12.4
# yields a realized annual mean ~12.0 C after noise; interior RH mean ~31%,
# ceiling 80%.
def annual_T(doy):
    return 12.8 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 12.4

def annual_RH(doy):
    return 30.0 + 6.0 * np.cos(2 * np.pi * (doy - 200) / 365.0)

# Wet-season events per year -- damped indoors, peaks approach but stay below
# the measured 80% interior ceiling.
def monsoon_events(rng):
    """Return list of (doy_start, duration, peak_RH) for one year."""
    n_events = rng.integers(6, 10)
    events = []
    for _ in range(n_events):
        doy_start = rng.integers(152, 273)
        duration = rng.integers(3, 15)
        peak = rng.uniform(45, 70)
        events.append((doy_start, duration, peak))
    return events

rng = np.random.default_rng(seed=42)
T_a = np.zeros(N_DAYS)
RH_a = np.zeros(N_DAYS)
for d in range(N_DAYS):
    doy = d % 365
    if doy == 0:
        # Refresh monsoon events at start of each year
        year_events = monsoon_events(rng)
    T_a[d] = annual_T(doy) + rng.normal(0, 1.0)
    rh_base = annual_RH(doy) + rng.normal(0, 2.0)
    # Apply any active monsoon event
    rh_spike = 0.0
    for ev_start, ev_dur, ev_peak in year_events:
        if ev_start <= doy < ev_start + ev_dur:
            # triangular: rise / sustain / decay
            phase = (doy - ev_start) / ev_dur
            if phase < 0.2:
                profile = phase / 0.2
            elif phase < 0.6:
                profile = 1.0
            else:
                profile = (1.0 - phase) / 0.4
            rh_spike = max(rh_spike, (ev_peak - rh_base) * profile)
    RH_a[d] = min(80.0, max(8.7, rh_base + rh_spike))  # measured interior extremes (Gong et al. 2025)

# Integrate VTT model
M_a = np.zeros(N_DAYS)
for d in range(1, N_DAYS):
    M_a[d] = vtt_step(M_a[d - 1], T_a[d], RH_a[d], 1.0)
print(f"  Final M after 200 years: {M_a[-1]:.4f}")
print(f"  Max M over 200 years:   {M_a.max():.4f}")
print(f"  Days with M > 0.1:      {(M_a > 0.1).sum()} ({100 * (M_a > 0.1).mean():.2f}%)")

# --- Scenario (b): HVAC failure, 10 years ---
print("\nBuilding HVAC-failure scenario (10 years, T = 25 C, RH = 90%, daily)...")
N_DAYS_B = 10 * 365
years_axis_b = np.arange(N_DAYS_B) / 365.0
T_b = np.full(N_DAYS_B, 25.0)
RH_b = np.full(N_DAYS_B, 90.0)
M_b = np.zeros(N_DAYS_B)
for d in range(1, N_DAYS_B):
    M_b[d] = vtt_step(M_b[d - 1], T_b[d], RH_b[d], 1.0)
# When does M cross 3 and 5.7?
M_cross3 = np.argmax(M_b >= 3.0) if (M_b >= 3.0).any() else None
M_cross_sat = np.argmax(M_b >= 5.7) if (M_b >= 5.7).any() else None
print(f"  M reaches 3 at day {M_cross3} = {M_cross3 / 365.0:.2f} y" if M_cross3 else "  M did not reach 3")
print(f"  M reaches 5.7 at day {M_cross_sat} = {M_cross_sat / 365.0:.2f} y" if M_cross_sat else "  M did not reach 5.7")

# --- Plot ---
fig, axes = plt.subplots(1, 2, figsize=(13, 5))

ax = axes[0]
ax.plot(years_axis_a, M_a, color="#2E86AB", lw=0.8, alpha=0.85)
ax.axhline(3.0, color="gray", ls="--", lw=0.8, alpha=0.7,
           label=r"visible sparse growth threshold ($\mathcal{M}=3$)")
ax.axhline(6.0, color="black", ls=":", lw=0.6, alpha=0.5,
           label=r"saturation ($\mathcal{M}=6$)")
ax.set_xlabel("Year")
ax.set_ylabel(r"VTT mould index $\mathcal{M}$")
ax.set_title("(a) Monitored cave-interior microclimate", loc="left", fontsize=10, fontweight="bold")
ax.set_xlim(0, N_YEARS)
ax.set_ylim(-0.2, 6.5)
ax.grid(True, alpha=0.3)
ax.legend(loc="upper right", fontsize=8)

# Annotation showing the result
ax.text(0.04, 0.92,
        f"max $\\mathcal{{M}}$ over 200 y: {M_a.max():.3f}\nfinal $\\mathcal{{M}}$ at year 200: {M_a[-1]:.3f}",
        transform=ax.transAxes, fontsize=8, va="top", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#E8F4FF", edgecolor="#2E86AB", alpha=0.85))

ax = axes[1]
ax.plot(years_axis_b, M_b, color="#E63946", lw=1.4, alpha=0.95)
ax.axhline(3.0, color="gray", ls="--", lw=0.8, alpha=0.7,
           label=r"visible sparse growth ($\mathcal{M}=3$)")
ax.axhline(6.0, color="black", ls=":", lw=0.6, alpha=0.5,
           label=r"saturation ($\mathcal{M}=6$)")
if M_cross3 is not None:
    ax.axvline(M_cross3 / 365.0, color="gray", ls=":", lw=0.6, alpha=0.5)
ax.set_xlabel("Year")
ax.set_ylabel(r"VTT mould index $\mathcal{M}$")
ax.set_title("(b) HVAC-failure scenario", loc="left", fontsize=10, fontweight="bold")
ax.set_xlim(0, 10)
ax.set_ylim(-0.2, 6.5)
ax.grid(True, alpha=0.3)
ax.legend(loc="lower right", fontsize=8)

ax.text(0.04, 0.92,
        (f"$\\mathcal{{M}}=3$ crossed at year {M_cross3 / 365.0:.1f}\n"
         f"$\\mathcal{{M}} \\approx 5.7$ reached at year {M_cross_sat / 365.0:.1f}" if M_cross_sat else
         f"$\\mathcal{{M}}=3$ crossed at year {M_cross3 / 365.0:.1f}"),
        transform=ax.transAxes, fontsize=8, va="top", ha="left",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#FDE0E0", edgecolor="#E63946", alpha=0.85))


plt.tight_layout()

out = "experiments/mould_trajectory.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"\nSaved: {out}")
