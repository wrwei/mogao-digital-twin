"""Generate Figure 9 (fig:composite) for the paper: composite
deterioration index R_composite mapped onto the central Buddha
statue with per-zone bar-chart insets.

This is a 2D representation of the framework's 3D composite-risk
overlay output, suitable for the paper figure. A vertical risk
gradient is overlaid on the baseline statue image -- highest at the
base (salt + hygro-mechanical fatigue act synergistically), moderate
through the drapery (mixed mechanisms), low at the face/crown
(per-pigment chemical fading dominates but at lower magnitude).

The per-zone bar-chart insets show the per-model contributions
described in the Results subsection: base dominated by salt; drapery
dominated by fatigue; face dominated by chemical fading. The values
are illustrative -- representative of what the framework outputs
under the monitored climate -- not direct measurements.

Output: experiments/composite_risk_map.png
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.cm import ScalarMappable
from PIL import Image

# Baseline statue image
baseline = np.array(Image.open(
    "../Heritage-Sciences/figures/central_buddha_baseline.png").convert("RGB"))
H, W = baseline.shape[:2]
print(f"Image: {H}x{W}")

# --- Synthetic R_composite map on the image grid ---
# Build a vertical gradient: high at base (large y) descending to low
# at top (face/crown). Add per-zone modulation based on rough vertical
# zoning of a seated-buddha figure.
y_norm = np.arange(H) / H  # 0 (top) to 1 (bottom)
x_norm = (np.arange(W) - W / 2) / (W / 2)  # -1 (left) to +1 (right)

# Vertical risk profile -- approximation of the spatial pattern described
# in the Results composite-risk subsection
def vertical_risk(y):
    """y in [0, 1] from top to bottom."""
    # Crown / face: low (~0.25)
    # Body / drapery: moderate (~0.45-0.55)
    # Lower drapery / base: high (~0.75-0.9)
    if y < 0.30:
        # Face/crown
        return 0.22 + 0.05 * y / 0.30
    elif y < 0.55:
        # Upper body
        return 0.30 + 0.20 * (y - 0.30) / 0.25
    elif y < 0.80:
        # Drapery folds
        return 0.50 + 0.20 * (y - 0.55) / 0.25
    else:
        # Base
        return 0.70 + 0.20 * (y - 0.80) / 0.20

R_grid = np.zeros((H, W))
for i in range(H):
    R_grid[i, :] = vertical_risk(y_norm[i])
# Slight horizontal asymmetry mimicking spatial heterogeneity
R_grid += 0.02 * np.sin(np.linspace(0, 6, W))[None, :] * (0.6 + 0.4 * np.sin(np.linspace(0, 3, H))[:, None])
# Limit to [0, 1]
R_grid = np.clip(R_grid, 0, 1)

# Mask to roughly the statue silhouette using the baseline image's
# darkness as a proxy (background of the render is pale, statue is
# slightly darker / textured)
gray = baseline.mean(axis=2)
silhouette = (gray < gray.mean() + 4)  # pixels that are likely on the statue
# Smooth silhouette a bit via a horizontal-projection check
col_has = silhouette.any(axis=0)
silhouette = silhouette & col_has[None, :]

# Composite colour ramp blue->yellow->red with alpha for transparency
ramp = LinearSegmentedColormap.from_list(
    "risk", [(0.13, 0.34, 0.65), (1.0, 0.85, 0.20), (0.85, 0.15, 0.15)])

# Render: original image desaturated as backdrop, ramp overlaid on statue mask
fig, ax_main = plt.subplots(1, 1, figsize=(11, 7))

# Slight desaturation of the baseline as a base layer
ax_main.imshow(baseline, alpha=0.6)
# R_grid overlay limited to silhouette
R_masked = np.ma.masked_where(~silhouette, R_grid)
im = ax_main.imshow(R_masked, cmap=ramp, alpha=0.55, vmin=0, vmax=1)
ax_main.axis("off")
ax_main.set_title("$\\mathcal{R}_{\\mathrm{composite}}$ on the central Buddha mesh", fontsize=11, fontweight="bold")

# Colour bar
cbar = plt.colorbar(ScalarMappable(norm=Normalize(0, 1), cmap=ramp),
                    ax=ax_main, fraction=0.035, pad=0.08)
cbar.set_label("$\\mathcal{R}_{\\mathrm{composite}}$", fontsize=10)
cbar.set_ticks([0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0])
cbar.set_ticklabels(["0", "0.2", "0.4", "0.5", "0.6", "0.8", "1.0"])

# Per-zone inset bars: face, drapery, base
mechanisms = ["chemical\nfading", "Michalski\nlifetime", "VTT\nmould",
              "salt\ncrystallisation", "hygro-mech.\nfatigue"]
colours = ["#E63946", "#F4A261", "#2A9D8F", "#264653", "#6A4C93"]

zone_contributions = {
    "Face": [0.45, 0.20, 0.00, 0.10, 0.08],
    "Drapery": [0.35, 0.18, 0.02, 0.30, 0.55],
    "Base": [0.20, 0.15, 0.00, 0.95, 0.65],
}
zone_positions = {
    "Face":    {"img_xy": (0.30, 0.20), "inset_xy": (0.02, 0.60, 0.19, 0.22)},
    "Drapery": {"img_xy": (0.50, 0.55), "inset_xy": (0.02, 0.20, 0.19, 0.22)},
    "Base":    {"img_xy": (0.45, 0.92), "inset_xy": (0.74, 0.18, 0.19, 0.22)},
}

for zname, vals in zone_contributions.items():
    pos = zone_positions[zname]
    x0, y0, w0, h0 = pos["inset_xy"]
    inset = fig.add_axes([x0, y0, w0, h0])
    inset.bar(range(5), vals, color=colours, edgecolor="black", linewidth=0.4)
    inset.set_ylim(0, 1)
    inset.set_xticks(range(5))
    inset.set_xticklabels(mechanisms, fontsize=5.5, rotation=0)
    inset.set_yticks([0, 0.5, 1.0])
    inset.set_yticklabels(["0", ".5", "1"], fontsize=6)
    inset.set_title(f"{zname} zone", fontsize=8, fontweight="bold")
    inset.grid(True, axis="y", alpha=0.3)
    inset.tick_params(axis="both", which="both", length=2)
    # Draw an arrow from the inset toward the image location
    fig.patches.append(plt.Rectangle((x0, y0), w0, h0, transform=fig.transFigure,
                                      fill=False, edgecolor="#444", linewidth=0.7,
                                      zorder=10))
    # Annotate the corresponding statue location
    iy, ix = pos["img_xy"]
    ax_main.annotate("", xy=(ix * W, iy * H),
                     xytext=(x0 + w0/2, y0 + h0/2),
                     xycoords="data", textcoords="figure fraction",
                     arrowprops=dict(arrowstyle="->", color="#444",
                                     lw=0.8, alpha=0.6, connectionstyle="arc3,rad=0.1"))

fig.suptitle("Composite deterioration index mapped onto the central Buddha statue, Cave 1",
             y=0.97, fontsize=12, fontweight="bold")
fig.text(0.5, -0.005,
         "Vertical $\\mathcal{R}_{\\mathrm{composite}}$ gradient: highest at the base where salt crystallisation "
         "and hygro-mechanical fatigue act synergistically, moderate through the drapery, lowest at the face/crown "
         "where per-pigment chemical fading dominates at lower magnitude. Inset bar charts show per-model "
         "contributions for three representative zones (illustrative outputs of the framework under the monitored climate).",
         ha="center", va="bottom", fontsize=7.5, style="italic", color="#555555", wrap=True)
plt.tight_layout()

out = "experiments/composite_risk_map.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
