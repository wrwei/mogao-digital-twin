"""Generate Figure 10 (fig:composite) for the paper: composite
deterioration index R_composite mapped onto the sculpture, with
per-zone bar-chart insets.

The three anchor zones (base, torso/drapery, face/crown) and their
per-mechanism sub-index breakdown are the REAL output of the runtime's
`compositeRiskField()` at the cave-baseline interior over the 200-year
calibration horizon (T = 13 C, RH = 35 %, 2 klux). Those values are
precomputed by `_emit_composite_zone_data.js` into
`composite_zone_data.json` and loaded here; the vertical risk profile
overlaid on the statue is a smooth interpolation between the three
computed anchor points (base highest, driven by capillary salt
availability; face second, driven by per-pigment chemical fading under
light exposure), and each inset bar chart plots that zone's five
computed normalised sub-indices. The vertical placement between anchors
is a schematic of the loading pattern, not a per-vertex simulation.

Output: experiments/composite_risk_map.png
"""
import json
import os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.cm import ScalarMappable
from PIL import Image

# --- Load the REAL per-zone composite output ---------------------------------
_here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_here, "composite_zone_data.json")) as _f:
    ZONE_DATA = json.load(_f)
# order base (low) -> face (high) by height
ZONES = sorted(ZONE_DATA["zones"], key=lambda z: z["height"])
print("Loaded computed zones:",
      {z["id"]: round(z["composite"], 3) for z in ZONES})

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

# Vertical risk profile -- linear interpolation between the three COMPUTED
# anchor zones. compositeRiskField reports each zone at a normalised height
# above the base (0 = base contact, 1 = crown); the statue image runs
# y_img = 0 (top/crown) to 1 (bottom/base), so image height maps as
# h = 1 - y_img. Interpolating R_composite(h) between the computed anchors
# makes the overlaid gradient a render of the runtime output rather than a
# hand-drawn curve.
_anchor_h = np.array([z["height"] for z in ZONES])          # ascending
_anchor_R = np.array([z["composite"] for z in ZONES])

def vertical_risk(y):
    """y in [0, 1] from top (crown) to bottom (base)."""
    h = 1.0 - y                                             # normalised height
    return float(np.interp(h, _anchor_h, _anchor_R))

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
ax_main.set_title(r"$\mathcal{R}_{\mathrm{composite}}$", loc="left", fontsize=11, fontweight="bold")

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

# Real per-zone sub-index vectors [chemical, lifetime, mould, salt, fatigue]
# from compositeRiskField (composite_zone_data.json).
_comp_order = ["chemical", "lifetime", "mould", "salt", "fatigue"]
_by_id = {z["id"]: z for z in ZONES}
zone_contributions = {
    "Face":    [_by_id["face"]["components"][k] for k in _comp_order],
    "Drapery": [_by_id["torso"]["components"][k] for k in _comp_order],
    "Base":    [_by_id["base"]["components"][k] for k in _comp_order],
}
zone_positions = {
    "Face":    {"img_xy": (0.30, 0.20), "inset_xy": (0.015, 0.68, 0.19, 0.22)},
    "Drapery": {"img_xy": (0.50, 0.55), "inset_xy": (0.015, 0.39, 0.19, 0.22)},
    "Base":    {"img_xy": (0.45, 0.92), "inset_xy": (0.015, 0.10, 0.19, 0.22)},
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


plt.tight_layout()

out = "experiments/composite_risk_map.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"Saved: {out}")
