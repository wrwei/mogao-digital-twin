"""
Integration proof + figure for the Stage-2 per-texel spatial composite.

Replicates the effects-worker applyCompositeSpatial() logic in Python:
  * loads the baked height + illumination driver maps,
  * bilinearly samples the backend (height x illumination) composite grid
    (exported from DeteriorationService.compositeRiskGrid via Node),
  * paints the blue->yellow->red risk field into UV space,
then projects the field onto the mesh by rasterising the OBJ faces (vertex Y
for the 3D preview) so the spatial pattern can be checked against the physics
(salt-driven base, low-risk face).
"""
import json
import numpy as np
from PIL import Image

MAPS = "statue_models/model"
GRID = "/tmp/grid_interior30.json"


def ramp(r):
    r = np.clip(r, 0, 1)
    out = np.zeros(r.shape + (3,), np.float64)
    lo = r <= 0.5
    t = np.where(lo, r / 0.5, (r - 0.5) / 0.5)
    out[..., 0] = np.where(lo, 40 + t * 215, 255)
    out[..., 1] = np.where(lo, 90 + t * 165, 255 - t * 215)
    out[..., 2] = np.where(lo, 200 - t * 160, 40 - t * 40)
    return out


def sample_grid(h, il, grid):
    nH, nL, gv = grid["nH"], grid["nL"], np.asarray(grid["value"])
    fh, fl = h * (nH - 1), il * (nL - 1)
    h0 = np.clip(fh.astype(int), 0, nH - 1); l0 = np.clip(fl.astype(int), 0, nL - 1)
    h1 = np.clip(h0 + 1, 0, nH - 1);        l1 = np.clip(l0 + 1, 0, nL - 1)
    dh, dl = fh - h0, fl - l0
    return (gv[h0, l0] * (1 - dh) * (1 - dl) + gv[h0, l1] * (1 - dh) * dl +
            gv[h1, l0] * dh * (1 - dl) + gv[h1, l1] * dh * dl)


def main():
    grid = json.load(open(GRID))
    hmap = np.asarray(Image.open(f"{MAPS}/height_map.png"), np.float64) / 255
    ilmap = np.asarray(Image.open(f"{MAPS}/illumination_map.png"), np.float64) / 255
    risk = sample_grid(hmap, ilmap, grid)               # per-texel composite
    rgb = ramp(risk).astype(np.uint8)
    Image.fromarray(rgb, "RGB").save(f"{MAPS}/composite_risk_texture.png")

    # Report the spatial signal
    print(f"risk field: min {risk.min():.3f} max {risk.max():.3f} mean {risk.mean():.3f}")
    # top vs bottom of UV (proxy; true check is via mesh, but islands mix)
    print(f"high-risk texel fraction (>0.6): {(risk > 0.6).mean()*100:.1f}%")
    print(f"low-risk  texel fraction (<0.2): {(risk < 0.2).mean()*100:.1f}%")

    # ---- 3D preview: colour each mesh vertex by its texel risk via UV ----
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    V, VT, faces, v2t = [], [], [], {}
    with open(f"{MAPS}/statue.obj") as fh:
        for line in fh:
            if line.startswith("v "):
                V.append(tuple(map(float, line.split()[1:4])))
            elif line.startswith("vt "):
                p = line.split(); VT.append((float(p[1]), float(p[2])))
            elif line.startswith("f "):
                for tok in line.split()[1:]:
                    a = tok.split("/")
                    vi = int(a[0]) - 1; ti = int(a[1]) - 1 if len(a) > 1 and a[1] else -1
                    if ti >= 0 and vi not in v2t:
                        v2t[vi] = ti
    V = np.asarray(V); VT = np.asarray(VT)
    RES = hmap.shape[0]
    # subsample vertices for a light scatter preview
    idx = np.arange(0, len(V), 8)
    vr = np.full(len(idx), np.nan)
    for j, vi in enumerate(idx):
        ti = v2t.get(int(vi), -1)
        if ti < 0:
            continue
        u, v = VT[ti]
        mx = min(RES - 1, max(0, int(u * (RES - 1))))
        my = min(RES - 1, max(0, int((1 - v) * (RES - 1))))
        vr[j] = risk[my, mx]
    ok = ~np.isnan(vr)
    P = V[idx][ok]
    X, Z, Yv = P[:, 0], P[:, 2], P[:, 1]
    fig = plt.figure(figsize=(5.2, 6.4))
    ax = fig.add_subplot(111, projection="3d")
    sc = ax.scatter(X, Z, Yv, c=vr[ok], cmap="turbo",
                    s=2, vmin=0, vmax=1, linewidths=0)
    # Equal data aspect so the statue is not stretched; box aspect matches the
    # true extent ratios (X:Z:Y) rather than the figure's portrait shape.
    xr = X.max() - X.min(); zr = Z.max() - Z.min(); yr = Yv.max() - Yv.min()
    ax.set_box_aspect((xr, zr, yr))
    ax.set_xlim(X.min(), X.max()); ax.set_ylim(Z.min(), Z.max()); ax.set_zlim(Yv.min(), Yv.max())
    fig.suptitle("Stage-2 per-texel composite risk on the mesh (interior 30 y)", fontsize=10, y=0.97)
    ax.set_axis_off(); ax.view_init(elev=8, azim=-70)
    cb = fig.colorbar(sc, ax=ax, shrink=0.6, pad=0.02, label=r"$\mathcal{R}_{composite}$")
    fig.subplots_adjust(left=0.02, right=0.90, bottom=0.02, top=0.93)
    fig.savefig("experiments/_spatial_composite_preview.png", dpi=110)
    # height-binned mean risk on the mesh (the real spatial check)
    Y = V[idx][ok][:, 1]; ynorm = (Y - Y.min()) / (Y.max() - Y.min())
    for lo, hi, lbl in [(0, .33, "lower"), (.33, .66, "mid"), (.66, 1.01, "upper")]:
        m = (ynorm >= lo) & (ynorm < hi)
        if m.any():
            print(f"mesh {lbl:5s} third: mean risk {vr[ok][m].mean():.3f}")


if __name__ == "__main__":
    main()
