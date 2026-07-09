"""Figure 4 (fig:pilot_ageing): per-pigment DeltaE trajectories from the pilot
accelerated-ageing campaign on the replica lotus pedestal.

  * Measured pilot data (recovered.xlsx, PEDESTAL specimens only, 3 spots/arm,
    days 0-61) for the two run arms: 23 C / 40 %RH (room) and 40 C / 10 %RH
    (chamber).
  * First-order saturating projection of each measured arm from day 61 to day
    90 (dashed), DeltaE(t) = DeltaE_max * (1 - exp(-k t)) with pigment-specific
    caps and k = |initial slope| / DeltaE_max.

Only the two run arms are shown -- no 40 C / 80 %RH condition was run, so no
speculative model-only arm is plotted. The block-tile geometry is likewise not
plotted: the recovered dataset is pedestal-only. Plot + legend only -- NO
title, NO footnote (caption goes in the paper).

Colours validated colourblind-safe (Wong): room #0072B2, chamber #E63946.
Markers o / s as redundant encoding.
"""
import openpyxl, math
import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
from collections import defaultdict

mpl.rcParams.update({
    "font.family": "sans-serif", "font.size": 9, "axes.linewidth": 0.8,
    "xtick.direction": "out", "ytick.direction": "out",
    "axes.edgecolor": "#444444", "pdf.fonttype": 42, "ps.fonttype": 42,
})

ROOM, CHAM, FLOORC = "#0072B2", "#E63946", "#9AA0A6"
DAY_MEAS_END = 61          # last measured timepoint
DAY_PROJ_END = 90          # projection horizon
CAPS = {"Vermilion": 60.0, "Malachite": 50.0, "Azurite": 40.0}

wb = openpyxl.load_workbook("experiments/mogao_data_measured_recovered.xlsx", data_only=True)
hdr = [c.value for c in wb["Vermilion"][1]]; ix = {n:i for i,n in enumerate(hdr)}
rows = []
for sn in ["Vermilion","Malachite","Azurite"]:
    rows += [r for r in wb[sn].iter_rows(min_row=2, values_only=True)]

# recovered.xlsx is pedestal-only; guard in case a future file mixes geometries
rows = [r for r in rows if str(r[ix["geometry"]]).lower().startswith("ped")]

# measurement sigma (per-channel residual sd about each spot's linear trend)
ser = defaultdict(list)
for r in rows:
    ser[(r[ix["condition"]], r[ix["spot"]])].append((r[ix["day"]], r[ix["L*"]], r[ix["a*"]], r[ix["b*"]]))
sig = []
for pts in ser.values():
    pts.sort(); t = np.array([p[0] for p in pts], float)
    for ch in (1,2,3):
        y = np.array([p[ch] for p in pts], float); s,i = np.polyfit(t,y,1)
        sig.append(np.std(y-(s*t+i), ddof=1))
SIG = float(np.mean(sig)); FLOOR = SIG*1.5958

base = {}
for r in rows:
    if r[ix["day"]]==0: base[(r[ix["condition"]], r[ix["spot"]])] = (r[ix["L*"]],r[ix["a*"]],r[ix["b*"]])
rec = defaultdict(list)
for r in rows:
    L,a,b = r[ix["L*"]],r[ix["a*"]],r[ix["b*"]]
    b0 = base.get((r[ix["condition"]], r[ix["spot"]]))
    if b0 is None or None in (L,a,b): continue
    rec[(r[ix["condition"]], r[ix["pigment"]], r[ix["day"]])].append(
        math.sqrt((L-b0[0])**2+(a-b0[1])**2+(b-b0[2])**2))

ROOM_ARM = "23 C / 40%RH (room-temp arm)"
CHAM_ARM = "40 C / 10%RH (chamber arm)"
PIGS = ["Vermilion","Malachite","Azurite"]

def sr(cond,pig):
    """days, mean DeltaE, SEM for one measured arm+pigment."""
    d = sorted(x for (c,p,x) in rec if c==cond and p==pig)
    m = np.array([np.mean(rec[(cond,pig,x)]) for x in d])
    n = np.array([len(rec[(cond,pig,x)]) for x in d])
    return np.array(d,float), m, SIG/np.sqrt(n)

def saturating_k(t, m, cap):
    """k for DeltaE = cap*(1-exp(-k t)), matched to the initial linear slope."""
    slope = np.polyfit(t, m, 1)[0]
    return abs(slope) / cap

def project(cond, pig):
    """Saturating projection days 61->90 anchored on the measured endpoint."""
    t, m, _ = sr(cond, pig)
    cap = CAPS[pig]
    k = saturating_k(t, m, cap)
    # anchor the envelope so it passes through the measured day-61 mean
    t_end, m_end = t[-1], m[-1]
    tp = np.linspace(t_end, DAY_PROJ_END, 40)
    # shift time origin so envelope value == m_end at t_end
    t0 = -math.log(max(1e-6, 1 - m_end/cap)) / k
    dp = cap * (1 - np.exp(-k * (tp - t_end + t0)))
    return tp, dp, k

fig, axes = plt.subplots(1, 3, figsize=(9.2, 3.2), sharey=True)
for col,pig in enumerate(PIGS):
    ax = axes[col]
    ax.axhspan(0, FLOOR, color=FLOORC, alpha=0.14, lw=0, zorder=0)
    ax.axhline(FLOOR, color=FLOORC, ls=(0,(1,1.5)), lw=0.9, zorder=0)
    ax.axvline(DAY_MEAS_END, color="#999999", ls=(0,(2,2)), lw=0.8, zorder=1)

    # --- measured arms (days 0-61) + saturating projection (61-90) ---
    for cond, color, mk in ((ROOM_ARM, ROOM, "o"), (CHAM_ARM, CHAM, "s")):
        t, m, sem = sr(cond, pig)
        ax.errorbar(t, m, yerr=sem, color=color, marker=mk, ms=4.2, lw=1.8,
                    mfc=color, mec="white", mew=0.5, elinewidth=1.0, capsize=2,
                    capthick=0.9, zorder=3, clip_on=False)
        tp, dp, _ = project(cond, pig)
        ax.plot(tp, dp, color=color, ls=(0,(4,2)), lw=1.4, zorder=2)

    ax.set_title(pig, loc="left", fontsize=10, fontweight="bold", pad=4)
    ax.set_xlim(0, DAY_PROJ_END); ax.set_ylim(0, 2.8)
    ax.set_xticks([0,30,61,90])
    ax.set_xlabel("Ageing time (days)")
    if col == 0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
    ax.grid(True, axis="y", color="#E6E6E6", lw=0.6, zorder=0)
    for sp in ("top","right"): ax.spines[sp].set_visible(False)
    ax.tick_params(length=3, colors="#444444")

handles = [
    Line2D([0],[0], color=ROOM, marker="o", ms=5, lw=1.8, mec="white", mew=0.5),
    Line2D([0],[0], color=CHAM, marker="s", ms=5, lw=1.8, mec="white", mew=0.5),
    Line2D([0],[0], color="#777777", ls=(0,(4,2)), lw=1.4),
    Patch(facecolor=FLOORC, alpha=0.30),
]
labels = [
    "23 °C / 40 %RH (measured)",
    "40 °C / 10 %RH (measured)",
    "saturating projection (days 61–90)",
    f"noise floor (ΔE ≈ {FLOOR:.1f})",
]
fig.legend(handles, labels, loc="upper center", ncol=4, frameon=False,
           fontsize=8, bbox_to_anchor=(0.5, 1.04), handletextpad=0.5, columnspacing=1.4)

fig.subplots_adjust(left=0.075, right=0.99, bottom=0.16, top=0.82, wspace=0.12)
out = "experiments/pilot_ageing_trajectories.png"
fig.savefig(out, dpi=300, bbox_inches="tight")
fig.savefig("experiments/pilot_ageing_trajectories.pdf", bbox_inches="tight")
print(f"sigma={SIG:.2f}, floor={FLOOR:.2f}")
for pig in PIGS:
    _,_,kr = project(ROOM_ARM, pig); _,_,kc = project(CHAM_ARM, pig)
    print(f"  {pig}: k_room={kr:.2e} k_cham={kc:.2e} cap={CAPS[pig]}")
print(f"Saved: {out}")
