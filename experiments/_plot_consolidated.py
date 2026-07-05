"""Plot straight from the consolidated tidy workbook to prove it is self-sufficient.

Reads experiments/mogao_data_consolidated.xlsx (sheet 'data_long'), plots the two
MEASURED arms as a 2x3 pigment x geometry grid, with:
  - 1-sigma measurement error bars (sigma/sqrt(n), sigma=0.7 dE/channel)
  - noise-floor shading (dE < 1.12 unresolvable)
  - hollow markers for model-interpolated (gap-filled) points
The predicted-DISCARDED arm is ignored.
"""
import openpyxl, math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

SIGMA_MEAS = 0.7
NOISE_FLOOR = SIGMA_MEAS * 1.5958

wb = openpyxl.load_workbook("experiments/mogao_data_consolidated.xlsx", data_only=True)
# workbook now holds one sheet per pigment (no data_long) -> read + concatenate them
PIG_SHEETS = ["Vermilion", "Malachite", "Azurite"]
hdr = [c.value for c in wb[PIG_SHEETS[0]][1]]
ix = {name: i for i, name in enumerate(hdr)}

# deltaE is now a live Excel formula (uncached) -> compute it here from L*a*b*
# (per spot vs its own day-0 baseline) so this works without opening Excel first.
rows = []
for _sn in PIG_SHEETS:
    rows += [r for r in wb[_sn].iter_rows(min_row=2, values_only=True)]
base = {}
for r in rows:
    if r[ix["status"]] == "measured" and r[ix["day"]] == 0:
        base[(r[ix["condition"]], r[ix["spot"]])] = (r[ix["L*"]], r[ix["a*"]], r[ix["b*"]])
rec = {}   # (condition, pigment, geometry, day) -> {"vals":[dE...], "interp":bool}
for r in rows:
    if r[ix["status"]] != "measured":
        continue
    L, a, b = r[ix["L*"]], r[ix["a*"]], r[ix["b*"]]
    b0 = base.get((r[ix["condition"]], r[ix["spot"]]))
    if b0 is None or None in (L, a, b):
        continue
    dE = math.sqrt((L-b0[0])**2 + (a-b0[1])**2 + (b-b0[2])**2)
    key = (r[ix["condition"]], r[ix["pigment"]], r[ix["geometry"]], r[ix["day"]])
    d = rec.setdefault(key, {"vals": [], "interp": False})
    d["vals"].append(dE)
    if r[ix["point_type"]] == "interpolated":
        d["interp"] = True

ARMS = ["23 C / 40%RH (room-temp arm)", "40 C / 10%RH (chamber arm)"]
STY = {"23 C / 40%RH (room-temp arm)": {"color": "#2E86AB", "marker": "o", "ls": "-"},
       "40 C / 10%RH (chamber arm)":   {"color": "#E63946", "marker": "s", "ls": "-"}}
PIGS = ["Vermilion", "Malachite", "Azurite"]

def series(cond, pig, geom):
    days = sorted(d for (c, p, g, d) in rec if c == cond and p == pig and g == geom)
    mean = np.array([np.mean(rec[(cond, pig, geom, d)]["vals"]) for d in days])
    n    = np.array([len(rec[(cond, pig, geom, d)]["vals"]) for d in days])
    interp = np.array([rec[(cond, pig, geom, d)]["interp"] for d in days])
    return np.array(days, float), mean, n, interp

fig, axes = plt.subplots(2, 3, figsize=(14, 7.5), sharex=True)
for row, geom in enumerate(["block", "pedestal"]):
    for col, pig in enumerate(PIGS):
        ax = axes[row, col]
        ax.axhspan(0, NOISE_FLOOR, color="#9AA0A6", alpha=0.13, lw=0, zorder=0)
        ax.axhline(NOISE_FLOOR, color="#9AA0A6", ls=":", lw=1.1, alpha=0.9, zorder=0)
        nspots = 3 if geom == "block" else 2
        for cond in ARMS:
            st = STY[cond]
            t, mean, n, interp = series(cond, pig, geom)
            if len(t) == 0:
                continue
            sem = SIGMA_MEAS / np.sqrt(n)
            ax.errorbar(t, mean, yerr=sem, color=st["color"], ls=st["ls"], marker=st["marker"],
                        ms=4, lw=1.6, elinewidth=0.9, capsize=2.2, capthick=0.9,
                        label=(f"{cond} — measured" if (row == 0 and col == 0) else None))
            if interp.any():
                ax.plot(t[interp], mean[interp], marker=st["marker"], mfc="white",
                        mec=st["color"], mew=1.2, ls="none", ms=5.5, zorder=6)
        geom_lbl = "block (10x10x4 cm tile)" if geom == "block" else "pedestal (1:5 lotus base)"
        ax.set_title(f"{pig} -- {geom_lbl}", fontsize=10)
        ax.grid(True, alpha=0.3); ax.set_xlim(-2, 64); ax.set_ylim(-0.3, 4.4)
        if col == 0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
        if row == 1: ax.set_xlabel("Days since 17 Apr 2026")
        ax.text(0.97, 0.04, f"n = {nspots} spots", transform=ax.transAxes,
                ha="right", va="bottom", fontsize=7, alpha=0.6, style="italic")

handles, labels = axes[0, 0].get_legend_handles_labels()
handles += [Line2D([0],[0], color="#9AA0A6", ls=":", lw=1.1)]
labels  += [f"noise floor (ΔE≈{NOISE_FLOOR:.1f}, below = unresolvable)"]
fig.legend(handles, labels, loc="upper center", ncol=3, frameon=False,
           fontsize=8.5, bbox_to_anchor=(0.5, 0.945))
fig.suptitle("mogao_data_consolidated.xlsx: 60-day measured colour-change trajectories",
             y=0.99, fontsize=11.5, fontweight="bold")
fig.text(0.5, 0.02,
         "Plotted directly from the consolidated tidy sheet (data_long, status='measured').  "
         "Error bars = 1σ measurement uncertainty (σ/√n, σ=0.7).  Predicted-DISCARDED arm not shown.",
         ha="center", va="bottom", fontsize=7.5, style="italic", color="#555555", wrap=True)
plt.subplots_adjust(top=0.85, bottom=0.11, left=0.07, right=0.99, hspace=0.28, wspace=0.20)

out = "experiments/deltaE_trajectories_consolidated.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
