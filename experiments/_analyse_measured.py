"""Analyse the (user-corrected) measured consolidated workbook: compute per-pigment
per-arm ΔE trajectories, estimate the measurement error margin, and plot.

Reads experiments/mogao_data_measured_consolidated.xlsx (sheets Vermilion/Malachite/
Azurite). ΔE computed directly from L*a*b* vs each spot's day-0 baseline.
"""
import openpyxl, math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

OUTLIER_dE = 8.0

wb = openpyxl.load_workbook("experiments/mogao_data_measured_consolidated.xlsx", data_only=True)
hdr = [c.value for c in wb["Vermilion"][1]]
ix = {n: i for i, n in enumerate(hdr)}
rows = []
for sn in ["Vermilion", "Malachite", "Azurite"]:
    rows += [r for r in wb[sn].iter_rows(min_row=2, values_only=True)]

# per-spot baseline (day 0) and ΔE
base = {}
for r in rows:
    if r[ix["day"]] == 0:
        base[(r[ix["condition"]], r[ix["spot"]])] = (r[ix["L*"]], r[ix["a*"]], r[ix["b*"]])

# CORRECT geometry from spot label: 2nd char 'T' => tile/BLOCK, else PEDESTAL.
# (The 'geometry' column in the file uses the old swapped mapping, so ignore it.)
def geom_of(spot):
    s = str(spot)
    return "block" if len(s) > 1 and s[1] == "T" else "pedestal"

recs = []  # (condition, pigment, geometry, spot, day, L,a,b, dE)
for r in rows:
    L, a, b = r[ix["L*"]], r[ix["a*"]], r[ix["b*"]]
    b0 = base.get((r[ix["condition"]], r[ix["spot"]]))
    if b0 is None or None in (L, a, b):
        continue
    dE = math.sqrt((L-b0[0])**2 + (a-b0[1])**2 + (b-b0[2])**2)
    recs.append((r[ix["condition"]], r[ix["pigment"]], geom_of(r[ix["spot"]]), r[ix["spot"]],
                 r[ix["day"]], L, a, b, dE))

# ---- remaining outliers ----
print("REMAINING outliers (ΔE >", OUTLIER_dE, "):")
rem = [(c,s,d,dE) for (c,p,g,s,d,L,a,b,dE) in recs if dE > OUTLIER_dE]
for c,s,d,dE in rem: print(f"   {c:28s} spot {s:6s} day {d:2d}  ΔE={dE:.1f}")
print(f"   total: {len(rem)}")

# ---- measurement error margin ----
# per-channel residual sd about each spot's linear trend  -> instrument sigma
def chan_sigma(exclude_outliers):
    ss = []
    bych = {}
    for (c,p,g,s,d,L,a,b,dE) in recs:
        if exclude_outliers and dE > OUTLIER_dE: continue
        bych.setdefault((c,s), []).append((d, L, a, b))
    for key, pts in bych.items():
        pts.sort()
        t = np.array([q[0] for q in pts], float)
        if len(t) < 3: continue
        for ch in (1,2,3):
            y = np.array([q[ch] for q in pts], float)
            sl, icpt = np.polyfit(t, y, 1)
            ss.append(np.std(y-(sl*t+icpt), ddof=1))
    return float(np.mean(ss))

sig_all = chan_sigma(False); sig_clean = chan_sigma(True)
floor_all = sig_all*1.5958; floor_clean = sig_clean*1.5958
print()
print("MEASUREMENT ERROR MARGIN (per-channel residual sd about per-spot trend):")
print(f"   sigma/channel  : {sig_clean:.2f} ΔE  (excl. 2 remaining outliers)  |  {sig_all:.2f} (incl.)")
print(f"   ΔE noise floor : {floor_clean:.2f} ΔE  (single spot, zero true change)")
print(f"   -> error bar on a per-arm MEAN of n spots = sigma/sqrt(n)")
print(f"      block  (n=2): +/- {sig_clean/math.sqrt(2):.2f}    pedestal (n=3): +/- {sig_clean/math.sqrt(3):.2f}")

# ---- plot ----
NOISE_FLOOR = sig_clean*1.5958
SIG = sig_clean
STY = {"23 C / 40%RH (room-temp arm)": {"color":"#2E86AB","marker":"o"},
       "40 C / 10%RH (chamber arm)":   {"color":"#E63946","marker":"s"}}
PIGS = ["Vermilion","Malachite","Azurite"]

def series(cond, pig, geom):
    days = sorted({d for (c,p,g,s,d,L,a,b,dE) in recs if c==cond and p==pig and g==geom})
    mean, sem, n = [], [], []
    for dy in days:
        vals=[dE for (c,p,g,s,d,L,a,b,dE) in recs if c==cond and p==pig and g==geom and d==dy]
        mean.append(np.mean(vals)); n.append(len(vals))
        sem.append(SIG/math.sqrt(len(vals)))
    return np.array(days,float), np.array(mean), np.array(sem), n

fig, axes = plt.subplots(2,3,figsize=(14,7.5),sharex=True)
for row,geom in enumerate(["block","pedestal"]):
    for col,pig in enumerate(PIGS):
        ax=axes[row,col]
        ax.axhspan(0,NOISE_FLOOR,color="#9AA0A6",alpha=0.13,lw=0,zorder=0)
        ax.axhline(NOISE_FLOOR,color="#9AA0A6",ls=":",lw=1.1,alpha=0.9,zorder=0)
        for cond,st in STY.items():
            t,mean,sem,n=series(cond,pig,geom)
            if len(t)==0: continue
            ax.errorbar(t,mean,yerr=sem,color=st["color"],marker=st["marker"],ms=4,lw=1.6,
                        elinewidth=0.9,capsize=2.2,capthick=0.9,
                        label=(cond if (row==0 and col==0) else None))
        geo_lbl="block (10x10x4 cm tile)" if geom=="block" else "pedestal (1:5 lotus base)"
        ax.set_title(f"{pig} -- {geo_lbl}",fontsize=10)
        ax.grid(True,alpha=0.3); ax.set_xlim(-2,64); ax.set_ylim(-0.3,4.4)
        if col==0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
        if row==1: ax.set_xlabel("Days since 17 Apr 2026")
        c0 = list(STY)[0]  # one arm, to report spots-per-arm
        nsp = len({s for (c,p,g,s,d,L,a,b,dE) in recs if g==geom and p==pig and c==c0})
        ax.text(0.97,0.04,f"n = {nsp} spots/arm",transform=ax.transAxes,
                ha="right",va="bottom",fontsize=7,alpha=0.6,style="italic")
h,l=axes[0,0].get_legend_handles_labels()
h+=[Line2D([0],[0],color="#9AA0A6",ls=":",lw=1.1)]; l+=[f"noise floor (ΔE≈{NOISE_FLOOR:.1f})"]
fig.legend(h,l,loc="upper center",ncol=3,frameon=False,fontsize=8.5,bbox_to_anchor=(0.5,0.945))
fig.suptitle("mogao_data_measured (corrected): ΔE trajectories with measurement error margin",
             y=0.99,fontsize=11.5,fontweight="bold")
fig.text(0.5,0.02,
    f"Measured ΔE (no model), errors corrected.  Error bars = measurement uncertainty on the mean "
    f"(sigma/sqrt(n), sigma={SIG:.2f} ΔE/channel).  Grey = noise floor (ΔE<{NOISE_FLOOR:.1f} unresolvable).",
    ha="center",va="bottom",fontsize=7.5,style="italic",color="#555555",wrap=True)
plt.subplots_adjust(top=0.85,bottom=0.11,left=0.07,right=0.99,hspace=0.28,wspace=0.20)
out="experiments/deltaE_trajectories_measured_corrected.png"
plt.savefig(out,dpi=150,bbox_inches="tight"); print(f"\nSaved: {out}")

# ---- per-pigment 60-day endpoint summary ----
print("\n60-day ΔE (mean over spots, last timepoint):")
for pig in PIGS:
    for geom in ["block","pedestal"]:
        line=f"  {pig:10s} {geom:8s}"
        for cond in STY:
            t,mean,sem,n=series(cond,pig,geom)
            tag='room' if 'room' in cond else '40C '
            line+=f" | {tag} {mean[-1]:.2f}+/-{sem[-1]:.2f}"
        print(line)
