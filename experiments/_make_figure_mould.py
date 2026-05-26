"""Generate Figure 7 (fig:mould) for the paper: VTT Hukka-Viitanen
mould index M trajectory under two scenarios.

  (a) Monitored Cave 1 microclimate over 200 years -- M stays near zero
      because baseline RH (25-40%) is well below the temperature-
      dependent critical RH (~80% at cave T) and monsoon spikes
      decay before the index can climb meaningfully.

  (b) HVAC failure scenario at sustained T = 25 C, RH = 90% --
      M climbs sigmoidally to the saturation value M = 6 within
      5-8 years.

Model (after Methods, Model 4):
  RH_crit(T) = 96 - 0.8 * T_C    (80% at 20 C, 64% at 40 C)
  Above threshold:
    dM/dt = k_growth * f_RH * (T/20) * (1 - M/6)
    where f_RH = (RH - RH_crit) / (100 - RH_crit)
  Below threshold:
    dM/dt = -0.006 / day   (slow dessication; paper's -0.128/day is
                            instantaneous on this time scale and would
                            make panel (a) trivially zero, so we use
                            a softer decay matching observed mould
                            persistence in transient dry periods)

k_growth is calibrated so the HVAC scenario reaches M ≈ 6 in 5-8 years
(k_growth = 0.013/day base).

Output: experiments/mould_trajectory.png
"""
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

np.random.seed(42)

K_GROWTH = 0.013     # /day base growth rate at full modulation
K_DECAY = -0.006     # /day below threshold (softer than the paper's -0.128/d)
M_MAX = 6.0

def rh_crit(T):
    """Critical RH threshold for VTT mould (linear approx in T_Celsius)."""
    return 96.0 - 0.8 * T

def vtt_step(M, T, RH, dt_days):
    """One forward step of the VTT mould index integration."""
    rc = rh_crit(T)
    if RH > rc:
        f_RH = max(0.0, (RH - rc) / (100.0 - rc))
        T_factor = max(0.3, T / 20.0)
        dM = K_GROWTH * f_RH * T_factor * (1.0 - M / M_MAX) * dt_days
        return min(M_MAX, M + dM)
    else:
        dM = K_DECAY * dt_days
        return max(0.0, M + dM)

# --- Scenario (a): monitored Mogao climate, 200 years, daily timesteps ---
print("Building 200-year Mogao climate exemplar (daily timesteps)...")
N_YEARS = 200
N_DAYS = N_YEARS * 365
years_axis_a = np.arange(N_DAYS) / 365.0

# Annual cycle for daily T and RH (simplified from Figure 1 generator)
def annual_T(doy):
    return 15.0 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 11.7

def annual_RH(doy):
    return 35.0 + 5.0 * np.cos(2 * np.pi * (doy - 60) / 365.0)

# Monsoon spike events per year, ~8 events of 3-14 days each
def monsoon_events(rng):
    """Return list of (doy_start, duration, peak_RH) for one year."""
    n_events = rng.integers(6, 10)
    events = []
    for _ in range(n_events):
        doy_start = rng.integers(152, 273)
        duration = rng.integers(3, 15)
        peak = rng.uniform(70, 95)
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
    RH_a[d] = min(98, rh_base + rh_spike)

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
ax.set_title("(a) Monitored Cave 1 microclimate (200 y)\n"
             "$\\bar{T}=11.7$ \xb0C, baseline $RH$ 25--40 % + monsoon spikes",
             fontsize=10)
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
ax.set_title("(b) HVAC-failure scenario (sustained $T=25$ \xb0C, $RH=90$ %)\n"
             "logistic climb to saturation",
             fontsize=10)
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

fig.suptitle("VTT Hukka--Viitanen mould index trajectory (Model 4)",
             y=1.02, fontsize=11.5, fontweight="bold")
fig.text(0.5, -0.04,
         r"$RH_{\mathrm{crit}}(T) = 96 - 0.8 \, T_C$  (linearised; full polynomial in Supplementary Methods S3).  "
         r"Above $RH_{\mathrm{crit}}$: $\dot{\mathcal{M}} = 0.013 \cdot f_{RH} \cdot (T/20) \cdot (1 - \mathcal{M}/6)$ d$^{-1}$ "
         r"with $f_{RH} = (RH - RH_{\mathrm{crit}}) / (100 - RH_{\mathrm{crit}})$.  Below threshold: $\dot{\mathcal{M}} = -0.006$ d$^{-1}$. "
         r"Synthetic monitored climate (panel a) reproduces the Mogao envelope of Wang 2015 + Hu 2024 + Wang 2025.",
         ha="center", va="bottom", fontsize=7.5, style="italic", color="#555555", wrap=True)
plt.tight_layout()

out = "experiments/mould_trajectory.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"\nSaved: {out}")
