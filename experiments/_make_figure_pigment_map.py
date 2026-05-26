"""Generate Figure 6 (fig:pigment_map) for the paper.

Three panels:
  (a) photogrammetric baseline texture of the central Buddha statue
  (b) per-pixel pigment-class map from the Model 1 HSV-threshold segmenter
      (8 mineralogical classes + class legend with percentages)
  (c) 200-year projected colour state under cave-baseline conditions
      (T = 13 C, RH = 35%, I = 2 klux), from the chemical-fading render

The HSV-threshold logic is a faithful Python port of the JavaScript
segmenter in frontend/pigment/PigmentIdentifier.js (see _inferHeuristic).

Output: experiments/pigment_segmentation.png
"""
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
import colorsys

# Match the JS segmenter thresholds exactly
PIGMENT_NAMES = [
    "background",   # 0
    "azurite",      # 1
    "malachite",    # 2
    "vermilion",    # 3
    "lead white",   # 4
    "gold leaf",    # 5
    "red ochre",    # 6
    "carbon black", # 7
]

# Colour palette for the segmentation map (RGB 0-1)
PALETTE = {
    0: (0.85, 0.78, 0.65),  # background  -- pale tan
    1: (0.20, 0.45, 0.75),  # azurite     -- blue
    2: (0.20, 0.65, 0.35),  # malachite   -- green
    3: (0.80, 0.20, 0.20),  # vermilion   -- red
    4: (0.97, 0.97, 0.97),  # lead white  -- white
    5: (0.95, 0.80, 0.20),  # gold leaf   -- yellow
    6: (0.65, 0.40, 0.20),  # red ochre   -- brown
    7: (0.15, 0.15, 0.15),  # carbon black -- near-black
}

def rgb_to_hsv_np(rgb):
    """Vectorised RGB->HSV. rgb shape (H, W, 3) in [0, 255]. Returns (h, s, v)
    where h is in [0, 360), s and v in [0, 1]."""
    r = rgb[..., 0] / 255.0
    g = rgb[..., 1] / 255.0
    b = rgb[..., 2] / 255.0
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin
    h = np.zeros_like(cmax)
    # avoid div by zero
    nonzero = delta > 1e-9
    rmax = (cmax == r) & nonzero
    gmax = (cmax == g) & nonzero
    bmax = (cmax == b) & nonzero
    h[rmax] = 60.0 * (((g[rmax] - b[rmax]) / delta[rmax]) % 6.0)
    h[gmax] = 60.0 * (((b[gmax] - r[gmax]) / delta[gmax]) + 2.0)
    h[bmax] = 60.0 * (((r[bmax] - g[bmax]) / delta[bmax]) + 4.0)
    h = h % 360.0
    s = np.where(cmax > 0, delta / cmax, 0.0)
    v = cmax
    return h, s, v

def segment_hsv(rgb):
    """Apply the same per-pixel HSV-threshold rules as the JS segmenter."""
    h, s, v = rgb_to_hsv_np(rgb)
    cls = np.zeros(h.shape, dtype=np.uint8)  # default background
    # Carbon black (very dark, achromatic)
    m = (s < 0.06) & (v < 0.12)
    cls[m] = 7
    # Lead white (bright, achromatic) -- but not overwriting carbon black
    m = (cls == 0) & (s < 0.08) & (v > 0.75)
    cls[m] = 4
    # Gold leaf (saturated yellow)
    m = (cls == 0) & (h >= 35) & (h < 60) & (s > 0.50) & (v > 0.50)
    cls[m] = 5
    # Red family
    red_band = ((h >= 345) | (h < 15)) & (s > 0.35) & (v > 0.30)
    vermilion = red_band & (s > 0.50)
    cls[(cls == 0) & vermilion] = 3
    cls[(cls == 0) & red_band] = 6  # red ochre catches the rest
    # Brownish-orange red ochre
    m = (cls == 0) & (h >= 15) & (h < 40) & (s > 0.30) & (v > 0.25)
    cls[m] = 6
    # Malachite (green)
    m = (cls == 0) & (h >= 90) & (h < 165) & (s > 0.25) & (v > 0.20)
    cls[m] = 2
    # Azurite (blue)
    m = (cls == 0) & (h >= 195) & (h < 255) & (s > 0.25) & (v > 0.20)
    cls[m] = 1
    return cls

# --- Load images ---
baseline_path = "../Heritage-Sciences/figures/central_buddha_baseline.png"
projected_path = "../Heritage-Sciences/figures/central_buddha_chemical.png"
baseline = np.array(Image.open(baseline_path).convert("RGB"))
projected = np.array(Image.open(projected_path).convert("RGB"))

# Run segmenter
print(f"Baseline shape: {baseline.shape}")
seg = segment_hsv(baseline)
print(f"Segmentation shape: {seg.shape}")

# Class percentages
total = seg.size
counts = np.bincount(seg.ravel(), minlength=8)
percentages = 100.0 * counts / total
print("\nClass distribution on the baseline:")
for i in range(8):
    print(f"  {i} {PIGMENT_NAMES[i]:13s}: {counts[i]:>9d} pixels  ({percentages[i]:5.2f}%)")

# Build the colour-mapped segmentation image
seg_rgb = np.zeros((seg.shape[0], seg.shape[1], 3), dtype=np.float32)
for cls_id, colour in PALETTE.items():
    seg_rgb[seg == cls_id] = colour

# --- Plot 3 panels ---
fig, axes = plt.subplots(1, 3, figsize=(15, 6), constrained_layout=True)

axes[0].imshow(baseline)
axes[0].set_title("(a) Photogrammetric baseline texture\n(Central Buddha, Cave~1, Tang dynasty surface)",
                  fontsize=10)
axes[0].axis("off")

axes[1].imshow(seg_rgb)
axes[1].set_title("(b) Per-pixel pigment-class map\n(HSV-threshold segmenter, 8 mineralogical classes)",
                  fontsize=10)
axes[1].axis("off")

axes[2].imshow(projected)
axes[2].set_title("(c) 200-year projection at cave baseline\n($T = 13$ \xb0C, $RH = 35\\%$, $I = 2$ klux)",
                  fontsize=10)
axes[2].axis("off")

# Legend for panel (b)
legend_patches = [
    Patch(facecolor=PALETTE[i], edgecolor="black", linewidth=0.5,
          label=f"{PIGMENT_NAMES[i]} ({percentages[i]:.1f}%)")
    for i in range(8)
]
axes[1].legend(handles=legend_patches, loc="upper center", bbox_to_anchor=(0.5, -0.02),
               ncol=2, fontsize=8, frameon=True, framealpha=0.9, title="Mineral class (% pixels)")

fig.suptitle("Pigment-class segmentation and differentiated degradation (Central Buddha, Cave 1)",
             fontsize=11.5, fontweight="bold")
fig.text(0.5, -0.04,
         "(a) The photogrammetric baseline texture as input to Model 1. "
         "(b) Per-pixel mineralogical classification by the HSV-threshold segmenter (frontend/pigment/PigmentIdentifier.js); "
         "percentages are real classifier output on this surface, dominated by substrate and red ochre with localised vermilion traces. "
         "(c) Predicted 200-year colour state under cave-baseline conditions from the chemical-fading kernel (Model 2, Eq. 2) "
         "driven per pixel by the class-specific Arrhenius parameters of Table 2.",
         ha="center", va="top", fontsize=7.5, style="italic", color="#555555", wrap=True)

out = "experiments/pigment_segmentation.png"
plt.savefig(out, dpi=150, bbox_inches="tight")
print(f"\nSaved: {out}")
