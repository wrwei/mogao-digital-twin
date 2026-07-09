"""Generate the cave-microclimate figure (Fig. 2, fig:timeseries).

Reconstructs the Mogao CAVE-INTERIOR microclimate envelope as a
synthetic 1-year hourly time series, calibrated to the measured
Cave 71 interior statistics reported by Gong et al. 2025 (npj
Heritage Science 13:173, doi 10.1038/s40494-025-01740-9), from
Dunhuang Academy monitoring over 2019-2021.

The cave interior is strongly thermally and hygrically damped
relative to the outdoor Dunhuang climate: the surrounding rock's
low thermal conductivity suppresses daily swings and seasonal
extremes, and the arid setting keeps interior RH well below the
outdoor monsoon peaks. This is the environment the digital twin
sees at the statue's in-situ setting.

Measured envelope (Gong et al. 2025, Cave 71 interior | outdoor):
  - Temperature: mean 12.0 C | 11.7 C
      interior range -6.7 to +25.8 C  (outdoor -19.1 to +39.0 C)
      daily range ~2.8 C natural, up to ~4.2 C with visitors
  - Relative humidity: mean 30.8% | 29.1%
      interior range 8.7 to 80.0%  (outdoor 0.5 to 99.3%)

Annotates the RH panel with mirabilite and thenardite deliquescence
thresholds (Methods, Model 5):
  DRH_mir(T) = 98.5 - 0.33 * T   (valid 0-32 C)
  DRH_the(T) = 82.0 + 0.15 * T   (valid 10-40 C)
Note the interior RH ceiling (~80%) sits BELOW both thresholds
(86.9% / 94.6%): under normal cave conditions the salt model is
rarely triggered, and salt crystallisation is an extreme-/rain-event
risk rather than a routine one -- the honest reading of the data.

Output: figures/cave_microclimate.png (referenced as fig:timeseries).
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
from datetime import datetime, timedelta

np.random.seed(42)

# 1-year hourly time series, starting 1 January
N_HOURS = 365 * 24
start = datetime(2025, 1, 1, 0, 0, 0)
times = np.array([start + timedelta(hours=h) for h in range(N_HOURS)])
days_from_start = np.arange(N_HOURS) / 24.0

# --- Temperature: DAMPED interior annual sinusoid + small daily swing ---
# Cave 71 interior (Gong et al. 2025): mean 12.0 C, range -6.7 to +25.8 C.
# The rock mass damps the annual cycle; interior amplitude ~13 C peak-to-mean
# (vs ~27 C outdoors) and daily swings are small (~2.8 C natural).
doy = days_from_start
annual_T = 12.8 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 12.4
# Daily cycle: small, slightly larger in the warm season (~1.4 C amplitude
# => ~2.8 C daily range natural; visitor influence pushes this higher).
hod = (np.arange(N_HOURS) % 24).astype(float)
daily_T_amp = 1.0 + 0.6 * np.sin(2 * np.pi * (doy - 110) / 365.0).clip(min=0)
daily_T = daily_T_amp * np.sin(2 * np.pi * (hod - 14) / 24.0)  # peak mid-afternoon
# Small measurement noise; interior has no sharp synoptic fronts (rock-damped),
# only a gentle thermal-lag ripple.
T_noise = np.random.normal(0, 0.35, N_HOURS)
lag_ripple = 0.6 * np.sin(2 * np.pi * (doy - 60) / 182.5)
# A few attenuated winter cold spells so the interior reaches its measured
# annual minimum (-6.7 C, Gong et al. 2025); interior lags/damps the outdoor
# cold fronts rather than tracking them sharply.
cold_snaps = [(18, 4, -4.5), (38, 5, -6.0), (350, 4, -5.0)]  # (day, width_days, depth)
cold = np.zeros(N_HOURS)
for c, w, depth in cold_snaps:
    ch, wh = int(c * 24), int(w * 24)
    idx = np.arange(max(0, ch - wh * 2), min(N_HOURS, ch + wh * 2))
    cold[idx] += depth * np.exp(-((idx - ch) ** 2) / (2 * wh ** 2))
T = annual_T + daily_T + T_noise + lag_ripple + cold
T = np.clip(T, -6.7, 25.8)  # measured interior extremes (Gong et al. 2025)

# --- RH: DAMPED interior, mean ~30.8%, capped ~80% (Gong et al. 2025) ---
# Interior RH is buffered by the rock mass; it does NOT track the outdoor
# monsoon peaks (>90%). Baseline sits in the high-20s to high-30s, with a
# modest damped rise during the Jun-Sep wet season and rare, attenuated
# excursions toward the measured 80% ceiling during heavy-rain ingress.
baseline_RH = 30 + 6 * np.cos(2 * np.pi * (doy - 200) / 365.0)  # wetter mid-summer, drier winter
daily_RH = -daily_T * 1.5  # weak inverse-T daily cycle
RH = baseline_RH + daily_RH + np.random.normal(0, 1.8, N_HOURS)
# Wet-season (Jun-Sep) rain-ingress events: damped and attenuated indoors,
# a few reaching toward (not exceeding) the measured 80% ceiling.
wet_events = [
    (170, 5, 22),
    (188, 8, 34),   # a larger event approaching the ceiling
    (205, 6, 28),
    (225, 4, 18),
    (248, 5, 24),
]
for centre_day, dur_days, peak_height in wet_events:
    start_h = int(centre_day * 24)
    end_h = int((centre_day + dur_days) * 24)
    n = end_h - start_h
    profile = np.zeros(n)
    rise_n = int(n * 0.25)
    decay_n = int(n * 0.45)   # slow decay: interior takes ~days to dry back
    sustain_n = n - rise_n - decay_n
    profile[:rise_n] = np.linspace(0, 1, rise_n)
    profile[rise_n:rise_n + sustain_n] = 1.0
    profile[rise_n + sustain_n:] = np.linspace(1, 0, decay_n)
    RH[start_h:end_h] += peak_height * profile + np.random.normal(0, 2, n)
# Spring dust-season dry spells: interior RH dips toward its measured annual
# minimum (8.7%, Gong et al. 2025) during the driest, windiest part of the year.
dry_spells = [(70, 6, -18), (95, 5, -20), (120, 4, -16)]  # (day, width_days, depth)
for c, w, depth in dry_spells:
    ch, wh = int(c * 24), int(w * 24)
    idx = np.arange(max(0, ch - wh * 2), min(N_HOURS, ch + wh * 2))
    RH[idx] += depth * np.exp(-((idx - ch) ** 2) / (2 * wh ** 2))
# Small visitor-driven moisture pulses during opening hours (8am-5pm)
visitor_pulse = (1.2 * ((hod >= 8) & (hod <= 17)).astype(float)) * (np.sin(2 * np.pi * doy / 365.0) > -0.3).astype(float)
RH += visitor_pulse
RH = np.clip(RH, 8.7, 80.0)  # measured interior extremes (Gong et al. 2025)

# --- Plot ---
fig, axes = plt.subplots(2, 1, figsize=(13, 7.0), sharex=True)

ax = axes[0]
ax.plot(times, T, color="#E63946", lw=0.4, alpha=0.7)
# Seasonal envelope (5- and 95-percentile rolling over 7 days)
T_lo = np.array([np.percentile(T[max(0, i-3*24):i+3*24], 5)  for i in range(N_HOURS)])
T_hi = np.array([np.percentile(T[max(0, i-3*24):i+3*24], 95) for i in range(N_HOURS)])
ax.fill_between(times, T_lo, T_hi, color="#E63946", alpha=0.18, label="7-day 5--95 percentile envelope")
ax.axhline(12.0, color="black", lw=0.8, ls="--", alpha=0.5, label="interior annual mean (12.0 C)")
ax.set_ylabel("Temperature (\xb0C)")
ax.set_title("(a) Temperature", loc="left", fontsize=10, fontweight="bold")
ax.legend(loc="lower center", bbox_to_anchor=(0.5, 1.02), ncol=2, fontsize=8,
          frameon=False, borderaxespad=0, columnspacing=2.0)
ax.grid(True, alpha=0.3)
ax.set_ylim(-10, 30)

ax = axes[1]
ax.plot(times, RH, color="#2E86AB", lw=0.4, alpha=0.7)
RH_lo = np.array([np.percentile(RH[max(0, i-3*24):i+3*24], 5)  for i in range(N_HOURS)])
RH_hi = np.array([np.percentile(RH[max(0, i-3*24):i+3*24], 95) for i in range(N_HOURS)])
ax.fill_between(times, RH_lo, RH_hi, color="#2E86AB", alpha=0.18, label="7-day 5--95 percentile envelope")
# Mirabilite DRH at interior annual mean T = 12.0 -> 98.5 - 0.33*12.0 = 94.5
# Thenardite DRH at the peritectic (32.4 C) -> 82.0 + 0.15*32.4 = 86.9
drh_mir_at_mean = 98.5 - 0.33 * 12.0
drh_the_at_peritectic = 82.0 + 0.15 * 32.4
ax.axhline(drh_mir_at_mean, color="#888", lw=1.0, ls=":", label=f"$\\mathrm{{DRH}}_{{\\mathrm{{mir}}}}(T=12.0)$ = {drh_mir_at_mean:.1f}%")
ax.axhline(drh_the_at_peritectic, color="#444", lw=1.0, ls="-.", label=f"$\\mathrm{{DRH}}_{{\\mathrm{{the}}}}(T=32.4)$ = {drh_the_at_peritectic:.1f}%")
# Mark the measured interior RH ceiling (Gong et al. 2025) and make the gap explicit
ax.axhline(80.0, color="#2E86AB", lw=0.9, ls="--", alpha=0.7, label="measured interior RH ceiling (80.0%)")
ax.annotate("interior RH stays below both deliquescence\nthresholds all year: salt model rarely triggered",
            xy=(start + timedelta(days=25), 63), fontsize=7.0, color="#333333",
            ha="left", va="bottom")
# Annotate the wet season
ax.axvspan(start + timedelta(days=152), start + timedelta(days=273),
           color="orange", alpha=0.07, label="wet season (Jun--Sep)")
ax.set_ylabel("Relative humidity (\\%)")
ax.set_title("(b) Relative humidity", loc="left", fontsize=10, fontweight="bold")
ax.set_xlabel("Month (representative annual cycle)")
ax.legend(loc="lower center", bbox_to_anchor=(0.5, 1.02), ncol=3, fontsize=8,
          frameon=False, borderaxespad=0, columnspacing=1.6)
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 100)
ax.xaxis.set_major_formatter(DateFormatter("%b"))  # representative annual cycle; year omitted (synthetic)

plt.subplots_adjust(top=0.93, bottom=0.08, right=0.98, hspace=0.42)

out = "experiments/cave_microclimate.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
print(f"T range:  {T.min():.1f} to {T.max():.1f} C (mean {T.mean():.1f})")
print(f"RH range: {RH.min():.1f} to {RH.max():.1f} % (mean {RH.mean():.1f})")
print(f"RH > 60: {(RH > 60).sum()} hours ({100 * (RH > 60).mean():.1f}%)")
print(f"RH > 80: {(RH > 80).sum()} hours ({100 * (RH > 80).mean():.1f}%)")
print(f"RH > 90: {(RH > 90).sum()} hours ({100 * (RH > 90).mean():.1f}%)")
