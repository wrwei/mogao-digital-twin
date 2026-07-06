"""Publication figure: recovered pedestal ΔE trajectories (vermilion/malachite/azurite,
room vs chamber). Plot + legend only — NO title, NO caption (caption goes in the paper).

Colours validated colourblind-safe (dataviz skill): room #0072B2 (Wong blue),
chamber #E63946; markers ○/■ as redundant encoding.  Outputs PDF (vector) + PNG.
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

wb = openpyxl.load_workbook("experiments/mogao_data_measured_recovered.xlsx", data_only=True)
hdr = [c.value for c in wb["Vermilion"][1]]; ix = {n:i for i,n in enumerate(hdr)}
rows = []
for sn in ["Vermilion","Malachite","Azurite"]:
    rows += [r for r in wb[sn].iter_rows(min_row=2, values_only=True)]

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

ARMS = [("23 C / 40%RH (room-temp arm)", ROOM, "o"),
        ("40 C / 10%RH (chamber arm)",   CHAM, "s")]
PIGS = ["Vermilion","Malachite","Azurite"]

def sr(cond,pig):
    d = sorted(x for (c,p,x) in rec if c==cond and p==pig)
    m = np.array([np.mean(rec[(cond,pig,x)]) for x in d])
    n = np.array([len(rec[(cond,pig,x)]) for x in d])
    return np.array(d,float), m, SIG/np.sqrt(n)

fig, axes = plt.subplots(1, 3, figsize=(9.2, 3.0), sharey=True)
for col,pig in enumerate(PIGS):
    ax = axes[col]
    ax.axhspan(0, FLOOR, color=FLOORC, alpha=0.14, lw=0, zorder=0)
    ax.axhline(FLOOR, color=FLOORC, ls=(0,(1,1.5)), lw=0.9, zorder=0)
    for cond,color,mk in ARMS:
        t,m,sem = sr(cond,pig)
        ax.errorbar(t, m, yerr=sem, color=color, marker=mk, ms=4.5, lw=1.8,
                    mfc=color, mec="white", mew=0.5, elinewidth=1.0, capsize=2, capthick=0.9,
                    zorder=3, clip_on=False)
    ax.set_title(pig, fontsize=10, pad=6)
    ax.set_xlim(0, 62); ax.set_ylim(0, 2.6)
    ax.set_xticks([0,15,30,45,60])
    ax.set_xlabel("Aging time (days)")
    if col == 0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
    ax.grid(True, axis="y", color="#E6E6E6", lw=0.6, zorder=0)
    for sp in ("top","right"): ax.spines[sp].set_visible(False)
    ax.tick_params(length=3, colors="#444444")

handles = [Line2D([0],[0], color=ROOM, marker="o", ms=5, lw=1.8, mec="white", mew=0.5),
           Line2D([0],[0], color=CHAM, marker="s", ms=5, lw=1.8, mec="white", mew=0.5),
           Patch(facecolor=FLOORC, alpha=0.30)]
labels = ["23 °C / 40 %RH", "40 °C / 10 %RH", f"noise floor (ΔE ≈ {FLOOR:.1f})"]
fig.legend(handles, labels, loc="upper center", ncol=3, frameon=False,
           fontsize=9, bbox_to_anchor=(0.5, 1.02), handletextpad=0.5, columnspacing=1.8)

fig.subplots_adjust(left=0.075, right=0.99, bottom=0.17, top=0.83, wspace=0.12)
for ext in ("pdf","png"):
    fig.savefig(f"experiments/pigment_deltaE_pedestal.{ext}", dpi=300, bbox_inches="tight")
print(f"sigma={SIG:.2f}, floor={FLOOR:.2f}")
print("Saved: experiments/pigment_deltaE_pedestal.pdf / .png")
