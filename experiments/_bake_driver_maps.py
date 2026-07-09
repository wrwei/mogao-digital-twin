"""
Bake per-texel spatial driver maps for the Stage-2 composite risk field.

Reads the photogrammetric mesh (statue.obj) and rasterises two driver fields
into the model's UV layout:

  * height_map     -- normalised height above the base (0 = base contact,
                      1 = crown). Drives the capillary-rise moisture field and
                      soluble-salt availability.
  * illumination_map -- surface exposure = clamp(N . L, 0, 1) attenuated by a
                      cheap vertical ambient-occlusion proxy (recesses/underside
                      receive less light). Drives the photolytic/lifetime terms.

Both are written as single-channel 8-bit PNGs plus a small JSON sidecar with
the value ranges, so the runtime can decode 0-255 back to physical [0, 1].

This is a one-time offline precompute per object; the runtime consumes the
baked maps, not the mesh.
"""
import json
import numpy as np
from PIL import Image

OBJ = "statue_models/model/statue.obj"
OUT_DIR = "statue_models/model"
RES = 1024              # bake resolution (UV space)
LIGHT_DIR = np.array([0.3, 0.9, 0.4])   # up-and-front key light
LIGHT_DIR = LIGHT_DIR / np.linalg.norm(LIGHT_DIR)


def parse_obj(path):
    verts, uvs, faces = [], [], []
    with open(path, "r") as fh:
        for line in fh:
            if line.startswith("v "):
                _, x, y, z = line.split()[:4]
                verts.append((float(x), float(y), float(z)))
            elif line.startswith("vt "):
                p = line.split()
                uvs.append((float(p[1]), float(p[2])))
            elif line.startswith("f "):
                idx = line.split()[1:]
                vi, ti = [], []
                for tok in idx:
                    a = tok.split("/")
                    vi.append(int(a[0]) - 1)
                    ti.append(int(a[1]) - 1 if len(a) > 1 and a[1] else -1)
                faces.append((vi, ti))
    return (np.asarray(verts, np.float64),
            np.asarray(uvs, np.float64),
            faces)


def vertex_normals(V, faces):
    N = np.zeros_like(V)
    for vi, _ in faces:
        a, b, c = V[vi[0]], V[vi[1]], V[vi[2]]
        fn = np.cross(b - a, c - a)      # area-weighted (unnormalised)
        for i in vi:
            N[i] += fn
    ln = np.linalg.norm(N, axis=1, keepdims=True)
    ln[ln == 0] = 1
    return N / ln


def main():
    V, VT, faces = parse_obj(OBJ)
    print(f"verts={len(V)} uvs={len(VT)} faces={len(faces)}")

    # --- per-vertex height (normalised Y, base->crown) ---
    y = V[:, 1]
    h = (y - y.min()) / (y.max() - y.min())

    # --- per-vertex illumination = clamp(N.L,0,1) * vertical AO proxy ---
    N = vertex_normals(V, faces)
    ndotl = np.clip(N @ LIGHT_DIR, 0.0, 1.0)
    # cheap AO: recessed/low points are more occluded; bias by height a little
    ao = 0.55 + 0.45 * h
    illum = np.clip(ndotl * ao, 0.0, 1.0)

    # --- splat per-vertex scalars into UV space via each vertex's UV ---
    # Build a vertex->uv map from faces (a vertex may map to several uvs;
    # take the first association we see, which is fine for a smooth field).
    v2t = np.full(len(V), -1, np.int64)
    for vi, ti in faces:
        for a, b in zip(vi, ti):
            if b >= 0 and v2t[a] < 0:
                v2t[a] = b

    hmap = np.full((RES, RES), np.nan, np.float32)
    imap = np.full((RES, RES), np.nan, np.float32)
    have = v2t >= 0
    uv = VT[v2t[have]]
    px = np.clip((uv[:, 0] * (RES - 1)).astype(int), 0, RES - 1)
    py = np.clip(((1 - uv[:, 1]) * (RES - 1)).astype(int), 0, RES - 1)
    hmap[py, px] = h[have]
    imap[py, px] = illum[have]

    # --- fill holes by iterative nearest dilation ---
    from scipy import ndimage
    for m in (hmap, imap):
        mask = np.isnan(m)
        # distance-transform nearest-fill
        idx = ndimage.distance_transform_edt(mask, return_distances=False,
                                             return_indices=True)
        m[mask] = m[tuple(i[mask] for i in idx)]
    # light smoothing for a continuous field
    hmap = ndimage.gaussian_filter(hmap, 2.0)
    imap = ndimage.gaussian_filter(imap, 2.0)

    Image.fromarray((hmap * 255).astype(np.uint8), "L").save(f"{OUT_DIR}/height_map.png")
    Image.fromarray((imap * 255).astype(np.uint8), "L").save(f"{OUT_DIR}/illumination_map.png")
    meta = {
        "resolution": RES,
        "height": {"min": float(y.min()), "max": float(y.max()), "encoding": "0-255 -> 0-1 base..crown"},
        "illumination": {"light_dir": LIGHT_DIR.tolist(), "encoding": "0-255 -> 0-1 exposure"},
        "coverage_fraction": float(have.mean()),
    }
    json.dump(meta, open(f"{OUT_DIR}/driver_maps_meta.json", "w"), indent=2)
    print("wrote height_map.png, illumination_map.png, driver_maps_meta.json")
    print(f"height range {y.min():.3f}..{y.max():.3f}  UV coverage {have.mean()*100:.1f}%")


if __name__ == "__main__":
    main()
