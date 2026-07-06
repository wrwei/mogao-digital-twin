"""Validation figure: bootstrap 95% CIs on the pilot effective activation energies,
recomputed from the recovered pedestal data (vermilion 53 [48,57], azurite 49 [34,60],
malachite 43 [29,63] kJ/mol). Single-panel; plot + labels only (caption in paper).
Writes to the Heritage-Sciences paper figures folder (and a local copy).
"""
import matplotlib as mpl
import matplotlib.pyplot as plt

mpl.rcParams.update({"font.family": "sans-serif", "font.size": 9, "axes.linewidth": 0.8,
                     "pdf.fonttype": 42, "ps.fonttype": 42})
INK = "#333333"; MARK = "#0072B2"

# pigment: (point, lo, hi)  -- recomputed from recovered pedestal data
data = [("Vermilion", 53, 48, 57), ("Azurite", 49, 34, 60), ("Malachite", 43, 29, 63)]
y = list(range(len(data)))[::-1]   # first pigment at top

fig, ax = plt.subplots(figsize=(5.2, 2.4))
for (name, est, lo, hi), yi in zip(data, y):
    ax.plot([lo, hi], [yi, yi], color=MARK, lw=2.2, solid_capstyle="round", zorder=2)
    ax.plot([lo, lo], [yi-0.09, yi+0.09], color=MARK, lw=1.4)
    ax.plot([hi, hi], [yi-0.09, yi+0.09], color=MARK, lw=1.4)
    ax.plot(est, yi, "o", color=MARK, mec="white", mew=0.8, ms=7, zorder=3)
    ax.annotate(f"{est}  [{lo}, {hi}]", (hi, yi), xytext=(6, 0), textcoords="offset points",
                va="center", fontsize=8.5, color=INK)

ax.set_yticks(y); ax.set_yticklabels([d[0] for d in data], fontsize=10)
ax.set_ylim(-0.6, len(data)-0.4)
ax.set_xlim(0, 90); ax.set_xlabel(r"effective activation energy $E_a$ (kJ/mol)")
ax.set_xticks([0, 20, 40, 60, 80])
ax.grid(True, axis="x", color="#E6E6E6", lw=0.6, zorder=0)
for sp in ("top", "right", "left"): ax.spines[sp].set_visible(False)
ax.tick_params(length=0, colors=INK)
fig.subplots_adjust(left=0.24, right=0.97, bottom=0.22, top=0.96)

for path in (r"C:/Users/Will/Git/Heritage-Sciences/figures/validation_predicted_vs_observed.png",
             "experiments/validation_predicted_vs_observed.png"):
    fig.savefig(path, dpi=300, bbox_inches="tight")
print("Saved validation figure (bootstrap Ea CIs).")
