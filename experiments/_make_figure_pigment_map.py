"""Generate Figure 7 (fig:pigment_map) for the paper.

Three panels, all rendered from the SAME camera on the case-study statue's
real photogrammetric mesh (statue_models/model/statue.obj, ~500k vertices
carrying baked per-vertex colour sampled from the 8192x8192 texture atlas):

  (a) the photogrammetric 3D twin with its real texture (diffuse-shaded)
  (b) per-vertex pigment-class map from the Model 1 HSV-threshold segmenter
      (flat class colours, no shading)
  (c) 200-year projected colour state under cave-baseline conditions
      (T = 13 C, RH = 35%, I = 2 klux), computed by a faithful per-vertex
      port of the frontend chemical-fading pipeline
      (PigmentAnalysis.computePerPigmentParams + effects-worker.applyChemicalPigment)

The HSV-threshold logic is a faithful Python port of the JavaScript segmenter
in frontend/pigment/PigmentIdentifier.js (see _inferHeuristic).

Software painter's-algorithm renderer (matplotlib PolyCollection) is used so
the figure builds headless without an OpenGL context.

Run from the repo root:  python experiments/_make_figure_pigment_map.py
Output: experiments/pigment_segmentation.png
"""
import math
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import Patch

PIGMENT_NAMES = ["background", "azurite", "malachite", "vermilion",
                 "lead white", "gold leaf", "red ochre", "carbon black"]

PALETTE = {
    0: (0.85, 0.78, 0.65), 1: (0.20, 0.45, 0.75), 2: (0.20, 0.65, 0.35),
    3: (0.80, 0.20, 0.20), 4: (0.97, 0.97, 0.97), 5: (0.95, 0.80, 0.20),
    6: (0.65, 0.40, 0.20), 7: (0.15, 0.15, 0.15),
}

# Per-pigment kinetic parameters (verbatim from frontend/pigment/PigmentDatabase.js)
PIG = {
 0: dict(Ea_dark=70000, Ea_light=25000, k0_dark=0.16,  k0_light=1.6,  q=0.8,  p=0.9,  fadedRGB=(180,165,140), tint=None),
 1: dict(Ea_dark=39000, Ea_light=18000, k0_dark=0.080, k0_light=4.0,  q=0.8,  p=0.85, fadedRGB=(90,110,130),  tint=dict(a=8,  dR=0,  dG=0.4,  dB=-0.2)),
 2: dict(Ea_dark=43000, Ea_light=22000, k0_dark=0.048, k0_light=2.4,  q=0.8,  p=0.9,  fadedRGB=(80,120,80),   tint=None),
 3: dict(Ea_dark=60000, Ea_light=18000, k0_dark=0.13,  k0_light=4.8,  q=0.8,  p=0.95, fadedRGB=(130,80,70),   tint=dict(a=12, dR=-1, dG=-0.6, dB=-0.4)),
 4: dict(Ea_dark=65000, Ea_light=30000, k0_dark=0.95,  k0_light=5.1,  q=0.95, p=0.8,  fadedRGB=(200,190,170), tint=dict(a=10, dR=1,  dG=0.5,  dB=-0.4)),
 5: dict(Ea_dark=120000,Ea_light=50000, k0_dark=0.0000025, k0_light=0.00025, q=0.1, p=0.5, fadedRGB=(190,165,60), tint=None),
 6: dict(Ea_dark=95000, Ea_light=35000, k0_dark=0.0051, k0_light=0.13, q=0.6,  p=0.7,  fadedRGB=(155,100,75),  tint=None),
 7: dict(Ea_dark=110000,Ea_light=45000, k0_dark=0.000079,k0_light=0.0032,q=0.3, p=0.6,  fadedRGB=(50,50,50),    tint=None),
}
R = 8.314
# 200-year cave-baseline: T=13 C, RH=35%, I=2 klux
TC, RH, I_KLUX, DAYS, AMP = 13.0, 35.0, 2.0, 200 * 365.25, 3
AZIM, ELEV, ROLL = 180, 0, -8   # camera: front view, roll corrects the mesh's lean


def rgb_to_hsv_np(rgb):
    r = rgb[..., 0] / 255.0; g = rgb[..., 1] / 255.0; b = rgb[..., 2] / 255.0
    cmax = np.maximum(np.maximum(r, g), b); cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin; h = np.zeros_like(cmax); nz = delta > 1e-9
    rmax = (cmax == r) & nz; gmax = (cmax == g) & nz; bmax = (cmax == b) & nz
    h[rmax] = 60.0 * (((g[rmax] - b[rmax]) / delta[rmax]) % 6.0)
    h[gmax] = 60.0 * (((b[gmax] - r[gmax]) / delta[gmax]) + 2.0)
    h[bmax] = 60.0 * (((r[bmax] - g[bmax]) / delta[bmax]) + 4.0)
    s = np.where(cmax > 0, delta / np.where(cmax == 0, 1, cmax), 0.0)
    return h, s, cmax


def segment_hsv(rgb):
    """Per-pixel/per-vertex HSV-threshold rules (port of the JS segmenter)."""
    h, s, v = rgb_to_hsv_np(rgb)
    cls = np.zeros(h.shape, dtype=np.uint8)
    cls[(s < 0.06) & (v < 0.12)] = 7                                   # carbon black
    cls[(cls == 0) & (s < 0.08) & (v > 0.75)] = 4                      # lead white
    cls[(cls == 0) & (h >= 35) & (h < 60) & (s > 0.50) & (v > 0.50)] = 5  # gold
    red_band = ((h >= 345) | (h < 15)) & (s > 0.35) & (v > 0.30)
    cls[(cls == 0) & red_band & (s > 0.50)] = 3                        # vermilion
    cls[(cls == 0) & red_band] = 6                                     # red ochre
    cls[(cls == 0) & (h >= 15) & (h < 40) & (s > 0.30) & (v > 0.25)] = 6
    cls[(cls == 0) & (h >= 90) & (h < 165) & (s > 0.25) & (v > 0.20)] = 2  # malachite
    cls[(cls == 0) & (h >= 195) & (h < 255) & (s > 0.25) & (v > 0.20)] = 1  # azurite
    return cls


def rate_k(p, Tc, RH_frac, I):
    Tk = Tc + 273.15
    H2O = (math.log(1 - min(RH_frac, 0.999)) / (1.67 * Tc - 285.655)) ** (1 / (2.491 - 0.012 * Tc))
    kd = p['k0_dark'] * H2O ** p['q'] * math.exp(-p['Ea_dark'] / (R * Tk))
    kl = p['k0_light'] * I ** p['p'] * H2O ** p['q'] * math.exp(-p['Ea_light'] / (R * Tk)) if I > 0 else 0.0
    return kd + kl


def load_obj(path):
    Vs, Cs, Fs = [], [], []
    with open(path) as f:
        for line in f:
            if line.startswith('v '):
                p = line.split()
                Vs.append((float(p[1]), float(p[2]), float(p[3])))
                if len(p) >= 7:
                    Cs.append((float(p[4]), float(p[5]), float(p[6])))
            elif line.startswith('f '):
                Fs.append([int(t.split('/')[0]) - 1 for t in line.split()[1:4]])
    return np.array(Vs), np.array(Cs), np.array(Fs)


def project_view(V, azim, elev, roll=0):
    Vc = V - V.mean(0); Vc /= np.abs(Vc).max()
    a, e, r = math.radians(azim), math.radians(elev), math.radians(roll)
    Ry = np.array([[math.cos(a), 0, math.sin(a)], [0, 1, 0], [-math.sin(a), 0, math.cos(a)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(e), -math.sin(e)], [0, math.sin(e), math.cos(e)]])
    Rz = np.array([[math.cos(r), -math.sin(r), 0], [math.sin(r), math.cos(r), 0], [0, 0, 1]])
    return Vc @ Ry.T @ Rx.T @ Rz.T


def face_colours(P, Cvert, F, shade):
    tri = P[F]
    fc = Cvert[F].mean(1)
    if shade:
        n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        ln = np.linalg.norm(n, axis=1, keepdims=True); ln[ln == 0] = 1; n = n / ln
        light = np.array([0.3, 0.5, 0.8]); light = light / np.linalg.norm(light)
        fc = fc * np.clip(0.35 + 0.65 * np.abs(n @ light), 0, 1)[:, None]
    order = np.argsort(tri[..., 2].mean(1))
    return tri[order][:, :, :2], np.clip(fc[order], 0, 1)


# --- Load mesh ---
TEX_PATH = "statue_models/texture/361acd3e-2fb0-47fc-92cd-563d5b68d227.jpg"
Image.MAX_IMAGE_PIXELS = None
V, C, F = load_obj("statue_models/model/statue.obj")
print(f"mesh: V{V.shape} C{C.shape} F{F.shape}")

# --- Segment per-vertex colours ---
seg = segment_hsv((C.reshape(-1, 1, 3) * 255).astype(np.uint8)).ravel()
counts = np.bincount(seg, minlength=8).astype(float)
pct = 100.0 * counts / counts.sum()
print("Per-vertex class distribution:")
for i in range(8):
    print(f"  {i} {PIGMENT_NAMES[i]:13s}: {int(counts[i]):>8d}  ({pct[i]:5.2f}%)")

# --- 200-year projection (per-vertex port of applyChemicalPigment) ---
proj = {c: dict(df=math.exp(-rate_k(PIG[c], TC, RH / 100.0, I_KLUX) * DAYS),
                fadedRGB=PIG[c]['fadedRGB'], tint=PIG[c]['tint']) for c in range(8)}
Cproj = C.copy()
for cid in range(8):
    m = seg == cid
    if not m.any():
        continue
    df = proj[cid]['df']; vd = 1 - df ** AMP; ff = 1 - vd
    fr, fg, fb = np.array(proj[cid]['fadedRGB']) / 255.0
    Cproj[m, 0] = Cproj[m, 0] * ff + fr * (1 - ff)
    Cproj[m, 1] = Cproj[m, 1] * ff + fg * (1 - ff)
    Cproj[m, 2] = Cproj[m, 2] * ff + fb * (1 - ff)
    t = proj[cid]['tint']
    if t:
        dd = vd * t['a'] / 255.0
        Cproj[m, 0] = np.clip(Cproj[m, 0] + dd * t['dR'], 0, 1)
        Cproj[m, 1] = np.clip(Cproj[m, 1] + dd * t['dG'], 0, 1)
        Cproj[m, 2] = np.clip(Cproj[m, 2] + dd * t['dB'], 0, 1)

Cseg = np.array([PALETTE[c] for c in seg])

# --- Load the flat texture atlas for the first panel ---
_atlas = np.array(Image.open(TEX_PATH).convert("RGB").resize((1400, 1400), Image.LANCZOS))

# --- Render: flat atlas + 3 mesh panels (same camera) ---
P = project_view(V, AZIM, ELEV, ROLL)
mesh_panels = [("(b) Photogrammetric 3D twin (real texture)", C, True),
               ("(c) Per-vertex pigment-class map", Cseg, False),
               ("(d) 200-year projection at cave baseline", Cproj, True)]

fig = plt.figure(figsize=(19, 6.6))
gs = fig.add_gridspec(1, 4, width_ratios=[0.82, 1, 1, 1], wspace=0.03)

# Panel (a): raw texture atlas (top-aligned to match the tall mesh panels)
ax0 = fig.add_subplot(gs[0, 0])
ax0.imshow(_atlas, extent=[0, 1, 0, 1])
ax0.set_xlim(0, 1); ax0.set_ylim(-0.9, 1.1)  # push image to top of the tall slot
ax0.set_aspect('equal'); ax0.axis("off")
ax0.set_title("(a) Photogrammetric texture atlas", loc="left", fontsize=10, fontweight="bold")

# Panels (b)-(d): mesh renders
mesh_axes = []
for j, (ttl, Cv, shade) in enumerate(mesh_panels, start=1):
    ax = fig.add_subplot(gs[0, j])
    xy, fc = face_colours(P, Cv, F, shade)
    ax.add_collection(PolyCollection(xy, facecolors=fc, edgecolors='none', antialiaseds=False))
    ax.set_xlim(P[:, 0].min() * 1.02, P[:, 0].max() * 1.02)
    ax.set_ylim(P[:, 1].min() * 1.02, P[:, 1].max() * 1.02)
    ax.set_aspect('equal'); ax.axis('off')
    ax.set_title(ttl, loc="left", fontsize=10, fontweight="bold")
    mesh_axes.append(ax)

present = [i for i in np.argsort(-pct) if pct[i] > 0.02]
legend_patches = [Patch(facecolor=PALETTE[i], edgecolor="0.3", linewidth=0.5,
                        label=f"{PIGMENT_NAMES[i]} ({pct[i]:.1f}%)") for i in present]
mesh_axes[1].legend(handles=legend_patches, loc="upper center", bbox_to_anchor=(0.5, -0.06),
                    ncol=3, fontsize=11, frameon=False, title="Mineral class (% surface area)")

fig.subplots_adjust(left=0.01, right=0.99, top=0.95, bottom=0.14)
out = "experiments/pigment_segmentation.png"
fig.savefig(out, dpi=150)
print(f"\nSaved: {out}")
