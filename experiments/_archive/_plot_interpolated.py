"""Plot the gap-interpolated measured dataset, marking interpolated points hollow.

Reads experiments/mogao_data_measured_interpolated.xlsx.
Geometry from spot label (T = tile = block; no-T = pedestal). ΔE from L*a*b* vs
each spot's day-0 baseline. Solid marker = measured day; hollow = interpolated.
"""
import openpyxl, math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

SIG = 0.57
NOISE_FLOOR = SIG * 1.5958

wb = openpyxl.load_workbook("experiments/mogao_data_measured_interpolated.xlsx", data_only=True)
hdr = [c.value for c in wb["Vermilion"][1]]; ix = {n: i for i, n in enumerate(hdr)}
rows = []
for sn in ["Vermilion", "Malachite", "Azurite"]:
    rows += [r for r in wb[sn].iter_rows(min_row=2, values_only=True)]

def geom_of(s): s=str(s); return "block" if len(s)>1 and s[1]=="T" else "pedestal"

base = {}
for r in rows:
    if r[ix["day"]] == 0:
        base[(r[ix["condition"]], r[ix["spot"]])] = (r[ix["L*"]], r[ix["a*"]], r[ix["b*"]])

# (cond,pig,geom,day) -> {vals:[dE], interp:bool}
from collections import defaultdict
rec = defaultdict(lambda: {"vals": [], "interp": False})
for r in rows:
    L,a,b = r[ix["L*"]], r[ix["a*"]], r[ix["b*"]]
    b0 = base.get((r[ix["condition"]], r[ix["spot"]]))
    if b0 is None or None in (L,a,b): continue
    dE = math.sqrt((L-b0[0])**2 + (a-b0[1])**2 + (b-b0[2])**2)
    k = (r[ix["condition"]], r[ix["pigment"]], geom_of(r[ix["spot"]]), r[ix["day"]])
    rec[k]["vals"].append(dE)
    if r[ix["point_type"]] == "interpolated": rec[k]["interp"] = True

ARMS = {"23 C / 40%RH (room-temp arm)": {"color":"#2E86AB","marker":"o"},
        "40 C / 10%RH (chamber arm)":   {"color":"#E63946","marker":"s"}}
PIGS = ["Vermilion","Malachite","Azurite"]

def series(cond,pig,geom):
    days = sorted(d for (c,p,g,d) in rec if c==cond and p==pig and g==geom)
    mean = np.array([np.mean(rec[(cond,pig,geom,d)]["vals"]) for d in days])
    n    = np.array([len(rec[(cond,pig,geom,d)]["vals"]) for d in days])
    interp = np.array([rec[(cond,pig,geom,d)]["interp"] for d in days])
    return np.array(days,float), mean, SIG/np.sqrt(n), interp

fig, axes = plt.subplots(2,3,figsize=(14,7.5),sharex=True)
for row,geom in enumerate(["block","pedestal"]):
    for col,pig in enumerate(PIGS):
        ax=axes[row,col]
        ax.axhspan(0,NOISE_FLOOR,color="#9AA0A6",alpha=0.13,lw=0,zorder=0)
        ax.axhline(NOISE_FLOOR,color="#9AA0A6",ls=":",lw=1.1,alpha=0.9,zorder=0)
        nsp=0
        for cond,st in ARMS.items():
            t,mean,sem,interp=series(cond,pig,geom)
            if len(t)==0: continue
            nsp=max(nsp, max(len(rec[(cond,pig,geom,d)]["vals"]) for d in t))
            ax.errorbar(t,mean,yerr=sem,color=st["color"],marker=st["marker"],ms=4,lw=1.6,
                        elinewidth=0.9,capsize=2.2,capthick=0.9,
                        label=(cond if (row==0 and col==0) else None))
            if interp.any():
                ax.plot(t[interp],mean[interp],marker=st["marker"],mfc="white",
                        mec=st["color"],mew=1.2,ls="none",ms=5.5,zorder=6)
        gl="block (10x10x4 cm tile)" if geom=="block" else "pedestal (1:5 lotus base)"
        ax.set_title(f"{pig} -- {gl}",fontsize=10)
        ax.grid(True,alpha=0.3); ax.set_xlim(-2,64); ax.set_ylim(-0.3,4.4)
        if col==0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
        if row==1: ax.set_xlabel("Days since 17 Apr 2026")
        ax.text(0.97,0.04,f"n = {nsp} spots/arm",transform=ax.transAxes,ha="right",
                va="bottom",fontsize=7,alpha=0.6,style="italic")
h,l=axes[0,0].get_legend_handles_labels()
h+=[Line2D([0],[0],color="#9AA0A6",ls=":",lw=1.1),
    Line2D([0],[0],marker="o",mfc="white",mec="#555",mew=1.2,ls="none",ms=6)]
l+=[f"noise floor (ΔE≈{NOISE_FLOOR:.1f})","interpolated (gap-filled, not measured)"]
fig.legend(h,l,loc="upper center",ncol=4,frameon=False,fontsize=8,bbox_to_anchor=(0.5,0.945))
fig.suptitle("mogao_data_measured (gap-interpolated): ΔE trajectories, corrected geometry",
             y=0.99,fontsize=11.5,fontweight="bold")
fig.text(0.5,0.02,
    "Solid = measured day, hollow = interpolated (linear + N(0,0.57)).  Error bars = sigma/sqrt(n), sigma=0.57 ΔE/channel.  "
    "T=tile=block; no-T=pedestal.  Grey = noise floor.",
    ha="center",va="bottom",fontsize=7.5,style="italic",color="#555555",wrap=True)
plt.subplots_adjust(top=0.85,bottom=0.11,left=0.07,right=0.99,hspace=0.28,wspace=0.20)
out="experiments/deltaE_trajectories_measured_interpolated.png"
plt.savefig(out,dpi=150,bbox_inches="tight"); print(f"Saved: {out}")
