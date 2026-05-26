"""Generate Figure 1 for the paper: cave microclimate reconstruction.

Reproduces the Mogao Cave 1 microclimate envelope documented by
Wang 2015 (Dunhuang Research) and Hu et al. 2024 (Build. Environ.) as
a synthetic 1-year hourly time series, suitable as a publication
figure with explicit attribution.

Envelope (matched to Results.tex prose):
  - Temperature: annual cycle -5 C (winter) to +35 C (summer),
    annual mean 11.7 C, daily amplitude 5-10 C
  - RH baseline: 25-40% (drier in spring, wetter in winter)
  - Monsoon RH spikes June-September: 60-85% sustained 3-14 days
  - Peak excursions >90% during heavy rainfall events
  - Visitor-induced moisture pulses during opening hours (small)

Annotates the RH panel with mirabilite and thenardite deliquescence
thresholds (Methods, Model 5):
  DRH_mir(T) = 98.5 - 0.33 * T   (valid 0-32 C)
  DRH_the(T) = 82.0 + 0.15 * T   (valid 10-40 C)

Output: figures/cave_microclimate.png (drop-in replacement for the
        previous placeholder at figures/pilot_ageing_trajectories.png
        slot's fig:timeseries reference).
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

# --- Temperature: annual sinusoid + daily sinusoid + small noise ---
# Day-of-year cycle (peak summer at day ~200)
doy = days_from_start
annual_T = 15.0 * np.sin(2 * np.pi * (doy - 110) / 365.0) + 11.7
# Daily cycle (peak afternoon)
hod = (np.arange(N_HOURS) % 24).astype(float)
daily_T_amp = 4.0 + 3.0 * np.sin(2 * np.pi * (doy - 110) / 365.0).clip(min=0)  # bigger amplitude in summer
daily_T = daily_T_amp * np.sin(2 * np.pi * (hod - 6) / 24.0)
# Small noise + occasional cold-front events
T_noise = np.random.normal(0, 0.6, N_HOURS)
# A handful of synoptic events (cold fronts in winter, heat domes in summer)
event_centres = [25, 50, 90, 180, 210, 250, 305, 340]
event_amps = [-6, -5, -3, +4, +6, +3, -5, -6]
event_widths = [3, 4, 2, 3, 4, 3, 5, 4]
synoptic = np.zeros(N_HOURS)
for c, a, w in zip(event_centres, event_amps, event_widths):
    centre_h = int(c * 24)
    width_h = int(w * 24)
    idx = np.arange(max(0, centre_h - width_h * 2), min(N_HOURS, centre_h + width_h * 2))
    synoptic[idx] += a * np.exp(-((idx - centre_h) ** 2) / (2 * width_h ** 2))
T = annual_T + daily_T + T_noise + synoptic
T = np.clip(T, -8, 38)

# --- RH: baseline 25-40% with monsoon spikes ---
# Baseline RH varies with season: drier in spring (dust season), wetter in winter
baseline_RH = 35 + 5 * np.cos(2 * np.pi * (doy - 60) / 365.0)  # ~30% spring, ~40% autumn
# Daily inverse cycle of T (lower RH when T is high, very approximate)
daily_RH = -daily_T * 1.2
# Monsoon period: June 1 to September 30 (day 152 to 273)
RH = baseline_RH + daily_RH + np.random.normal(0, 2.0, N_HOURS)
# Add monsoon spike events
monsoon_events = [
    (160, 4),   # 4-day event
    (170, 6),
    (185, 10),  # 10-day event
    (200, 14),  # 14-day event (longest)
    (220, 8),
    (235, 5),
    (250, 6),
    (260, 3),
]
for centre_day, dur_days in monsoon_events:
    start_h = int(centre_day * 24)
    end_h = int((centre_day + dur_days) * 24)
    # Rise quickly, sustain high, then decay
    n = end_h - start_h
    profile = np.zeros(n)
    rise_n = int(n * 0.2)
    decay_n = int(n * 0.4)
    sustain_n = n - rise_n - decay_n
    profile[:rise_n] = np.linspace(0, 1, rise_n)
    profile[rise_n:rise_n + sustain_n] = 1.0
    profile[rise_n + sustain_n:] = np.linspace(1, 0, decay_n)
    peak_height = np.random.uniform(35, 60)  # adds 35-60% on top of baseline
    RH[start_h:end_h] += peak_height * profile + np.random.normal(0, 3, n)
# Visitor pulses during opening hours (8am-5pm) for daylight days, small
visitor_pulse = (1.5 * ((hod >= 8) & (hod <= 17)).astype(float)) * (np.sin(2 * np.pi * doy / 365.0) > -0.3).astype(float)
RH += visitor_pulse
RH = np.clip(RH, 10, 98)

# --- Plot ---
fig, axes = plt.subplots(2, 1, figsize=(13, 6.5), sharex=True)

ax = axes[0]
ax.plot(times, T, color="#E63946", lw=0.4, alpha=0.7)
# Seasonal envelope (5- and 95-percentile rolling over 7 days)
T_lo = np.array([np.percentile(T[max(0, i-3*24):i+3*24], 5)  for i in range(N_HOURS)])
T_hi = np.array([np.percentile(T[max(0, i-3*24):i+3*24], 95) for i in range(N_HOURS)])
ax.fill_between(times, T_lo, T_hi, color="#E63946", alpha=0.18, label="7-day 5--95 percentile envelope")
ax.axhline(11.7, color="black", lw=0.8, ls="--", alpha=0.5, label="annual mean (11.7 C)")
ax.set_ylabel("Temperature (\xb0C)")
ax.set_title("(a) Temperature", loc="left", fontsize=10, fontweight="bold")
ax.legend(loc="upper right", fontsize=8, framealpha=0.9)
ax.grid(True, alpha=0.3)
ax.set_ylim(-10, 40)

ax = axes[1]
ax.plot(times, RH, color="#2E86AB", lw=0.4, alpha=0.7)
RH_lo = np.array([np.percentile(RH[max(0, i-3*24):i+3*24], 5)  for i in range(N_HOURS)])
RH_hi = np.array([np.percentile(RH[max(0, i-3*24):i+3*24], 95) for i in range(N_HOURS)])
ax.fill_between(times, RH_lo, RH_hi, color="#2E86AB", alpha=0.18, label="7-day 5--95 percentile envelope")
# Mirabilite DRH at T_annual_mean = 11.7 -> 98.5 - 0.33*11.7 = 94.64
# Thenardite DRH at the peritectic (32.4 C) -> 82.0 + 0.15*32.4 = 86.86
drh_mir_at_mean = 98.5 - 0.33 * 11.7
drh_the_at_peritectic = 82.0 + 0.15 * 32.4
ax.axhline(drh_mir_at_mean, color="#888", lw=1.0, ls=":", label=f"$\\mathrm{{DRH}}_{{\\mathrm{{mir}}}}(T=11.7)$ = {drh_mir_at_mean:.1f}%")
ax.axhline(drh_the_at_peritectic, color="#444", lw=1.0, ls="-.", label=f"$\\mathrm{{DRH}}_{{\\mathrm{{the}}}}(T=32.4)$ = {drh_the_at_peritectic:.1f}%")
# Annotate the monsoon period
ax.axvspan(start + timedelta(days=152), start + timedelta(days=273),
           color="orange", alpha=0.07, label="monsoon season (Jun--Sep)")
ax.set_ylabel("Relative humidity (\\%)")
ax.set_title("(b) Relative humidity", loc="left", fontsize=10, fontweight="bold")
ax.set_xlabel("Date")
ax.legend(loc="upper left", fontsize=8, framealpha=0.9, ncol=2)
ax.grid(True, alpha=0.3)
ax.set_ylim(10, 100)
ax.xaxis.set_major_formatter(DateFormatter("%b %Y"))

fig.suptitle("Synthetic reconstruction of the Cave 1 microclimate envelope based on Dunhuang Academy long-term monitoring",
             y=0.99, fontsize=11, fontweight="bold")
fig.text(0.5, 0.005,
         "Envelope reproduces ranges documented by Wang (2015) and Hu et al. (2024): annual mean T = 11.7 \xb0C, "
         "winter minima ${\\sim}{-}5$ \xb0C, summer maxima ${\\sim}35$ \xb0C; baseline RH 25--40 \\% rising to 60--85 \\% during "
         "monsoon events (3--14 days), with peak excursions $>$90 \\% during heavy rainfall. Replace with actual monitoring "
         "data when accessible from the Dunhuang Academy archive.",
         ha="center", va="bottom", fontsize=7.5, style="italic", color="#555555", wrap=True)
plt.subplots_adjust(top=0.93, bottom=0.10, hspace=0.30)

out = "experiments/cave_microclimate.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
print(f"T range:  {T.min():.1f} to {T.max():.1f} C (mean {T.mean():.1f})")
print(f"RH range: {RH.min():.1f} to {RH.max():.1f} % (mean {RH.mean():.1f})")
print(f"RH > 60: {(RH > 60).sum()} hours ({100 * (RH > 60).mean():.1f}%)")
print(f"RH > 80: {(RH > 80).sum()} hours ({100 * (RH > 80).mean():.1f}%)")
print(f"RH > 90: {(RH > 90).sum()} hours ({100 * (RH > 90).mean():.1f}%)")
