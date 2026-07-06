"""Plot the recovered pedestal dataset (gaps now real measurements, no interpolation).

Reads experiments/mogao_data_measured_recovered.xlsx (README + Vermilion/Malachite/
Azurite, pedestal only, 21 measured timepoints). ΔE from L*a*b* vs each spot's day-0
baseline; measurement error margin estimated from the data.
"""
import openpyxl, math
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from collections import defaultdict

wb = openpyxl.load_workbook("experiments/mogao_data_measured_recovered.xlsx", data_only=True)
hdr = [c.value for c in wb["Vermilion"][1]]; ix = {n:i for i,n in enumerate(hdr)}
rows = []
for sn in ["Vermilion","Malachite","Azurite"]:
    rows += [r for r in wb[sn].iter_rows(min_row=2, values_only=True)]

# measurement sigma = per-channel residual sd about each spot's linear trend
series = defaultdict(list)
for r in rows:
    series[(r[ix["condition"]], r[ix["spot"]])].append((r[ix["day"]], r[ix["L*"]], r[ix["a*"]], r[ix["b*"]]))
sig = []
for pts in series.values():
    pts.sort(); t = np.array([p[0] for p in pts], float)
    for ch in (1,2,3):
        y = np.array([p[ch] for p in pts], float); sl,ic = np.polyfit(t,y,1)
        sig.append(np.std(y-(sl*t+ic), ddof=1))
SIG = float(np.mean(sig)); NOISE_FLOOR = SIG*1.5958
print(f"measurement sigma = {SIG:.2f} ΔE/channel ; noise floor = {NOISE_FLOOR:.2f}")

# ΔE per spot vs day-0 baseline
base = {}
for r in rows:
    if r[ix["day"]]==0: base[(r[ix["condition"]], r[ix["spot"]])] = (r[ix["L*"]],r[ix["a*"]],r[ix["b*"]])
rec = defaultdict(list)  # (cond,pig,day)->[dE]
for r in rows:
    L,a,b = r[ix["L*"]],r[ix["a*"]],r[ix["b*"]]
    b0 = base.get((r[ix["condition"]], r[ix["spot"]]))
    if b0 is None or None in (L,a,b): continue
    rec[(r[ix["condition"]], r[ix["pigment"]], r[ix["day"]])].append(
        math.sqrt((L-b0[0])**2+(a-b0[1])**2+(b-b0[2])**2))

ARMS = {"23 C / 40%RH (room-temp arm)": {"color":"#2E86AB","marker":"o"},
        "40 C / 10%RH (chamber arm)":   {"color":"#E63946","marker":"s"}}
PIGS = ["Vermilion","Malachite","Azurite"]

def series_pig(cond,pig):
    days = sorted(d for (c,p,d) in rec if c==cond and p==pig)
    mean = np.array([np.mean(rec[(cond,pig,d)]) for d in days])
    n    = np.array([len(rec[(cond,pig,d)]) for d in days])
    return np.array(days,float), mean, SIG/np.sqrt(n), int(n.max())

fig, axes = plt.subplots(1,3,figsize=(14,4.6),sharey=True)
for col,pig in enumerate(PIGS):
    ax=axes[col]
    ax.axhspan(0,NOISE_FLOOR,color="#9AA0A6",alpha=0.13,lw=0,zorder=0)
    ax.axhline(NOISE_FLOOR,color="#9AA0A6",ls=":",lw=1.1,alpha=0.9,zorder=0)
    nsp=3
    for cond,st in ARMS.items():
        t,mean,sem,nsp=series_pig(cond,pig)
        ax.errorbar(t,mean,yerr=sem,color=st["color"],marker=st["marker"],ms=4,lw=1.6,
                    elinewidth=0.9,capsize=2.2,capthick=0.9,
                    label=(cond if col==0 else None))
    ax.set_title(f"{pig} -- pedestal (1:5 lotus base)",fontsize=10)
    ax.grid(True,alpha=0.3); ax.set_xlim(-2,64); ax.set_ylim(-0.3,3.2)
    ax.set_xlabel("Days since 17 Apr 2026")
    if col==0: ax.set_ylabel(r"$\Delta E^*_{ab}$")
    ax.text(0.97,0.05,f"n = {nsp} spots/arm",transform=ax.transAxes,ha="right",va="bottom",
            fontsize=7,alpha=0.6,style="italic")
h,l=axes[0].get_legend_handles_labels()
h+=[Line2D([0],[0],color="#9AA0A6",ls=":",lw=1.1)]; l+=[f"noise floor (ΔE≈{NOISE_FLOOR:.1f})"]
fig.legend(h,l,loc="upper center",ncol=3,frameon=False,fontsize=8.5,bbox_to_anchor=(0.5,0.99))
fig.suptitle("Recovered pedestal ΔE trajectories (21 measured timepoints, no interpolation)",
             y=1.05,fontsize=12,fontweight="bold")
fig.text(0.5,-0.06,
    f"Measured ΔE, pedestal specimens only.  Error bars = measurement uncertainty on the mean "
    f"(sigma/sqrt(n), sigma={SIG:.2f} ΔE/channel).  Grey = noise floor (ΔE<{NOISE_FLOOR:.1f} unresolvable).",
    ha="center",va="top",fontsize=7.5,style="italic",color="#555555",wrap=True)
plt.tight_layout(rect=(0,0,1,0.99))
out="experiments/deltaE_trajectories_recovered.png"
plt.savefig(out,dpi=150,bbox_inches="tight"); print(f"Saved: {out}")

print("\n60-day ΔE (mean +/- sem):")
for pig in PIGS:
    line=f"  {pig:10s}"
    for cond in ARMS:
        t,mean,sem,_=series_pig(cond,pig); tag='room' if 'room' in cond else '40C '
        line+=f" | {tag} {mean[-1]:.2f}+/-{sem[-1]:.2f}"
    print(line)
