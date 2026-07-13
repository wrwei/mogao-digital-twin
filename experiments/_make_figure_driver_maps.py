"""
Publication figure: baked spatial driver maps (height + illumination) in UV space.

Reads the committed single-channel driver maps produced by _bake_driver_maps.py
and the JSON sidecar, decodes 0-255 -> physical [0,1], and renders a two-panel
figure. These two fields spatially modulate the Stage-2 composite risk on the
mesh: height drives the capillary-rise moisture / soluble-salt availability;
illumination drives the photolytic and lifetime terms.

Plot only -- caption lives in the paper.
"""
import json, os
import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from PIL import Image

MODEL = "statue_models/model"
h_img  = np.array(Image.open(os.path.join(MODEL, "height_map.png"))).astype(float)
il_img = np.array(Image.open(os.path.join(MODEL, "illumination_map.png"))).astype(float)
meta = json.load(open(os.path.join(MODEL, "driver_maps_meta.json")))

# decode 0-255 -> physical [0,1] exposure / normalised height
h_phys  = h_img  / 255.0
il_phys = il_img / 255.0

mpl.rcParams.update({
    "font.size": 8, "axes.titlesize": 8, "figure.dpi": 150,
    "font.family": "DejaVu Sans",
})

fig, axes = plt.subplots(1, 2, figsize=(7.0, 3.5))

im0 = axes[0].imshow(h_phys, cmap="viridis", vmin=0, vmax=1, origin="upper")
axes[0].set_title("Height above base (UV space)")
cb0 = fig.colorbar(im0, ax=axes[0], shrink=0.82, pad=0.03)
cb0.set_label("normalised height  (0 = base, 1 = crown)")
cb0.set_ticks([0, 0.25, 0.5, 0.75, 1.0])

im1 = axes[1].imshow(il_phys, cmap="inferno", vmin=0, vmax=1, origin="upper")
axes[1].set_title("Surface illumination (UV space)")
cb1 = fig.colorbar(im1, ax=axes[1], shrink=0.82, pad=0.03)
cb1.set_label("exposure  (0 = occluded, 1 = fully lit)")
cb1.set_ticks([0, 0.25, 0.5, 0.75, 1.0])

for ax in axes:
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values(): s.set_visible(False)

fig.subplots_adjust(left=0.02, right=0.93, bottom=0.04, top=0.92, wspace=0.28)
out = "experiments/driver_maps_preview.png"
fig.savefig(out, dpi=300, bbox_inches="tight")
fig.savefig("experiments/driver_maps_preview.pdf", bbox_inches="tight")
print("saved:", out, "| coverage_fraction:", meta.get("coverage_fraction"))
