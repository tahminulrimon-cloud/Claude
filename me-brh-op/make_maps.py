#!/usr/bin/env python3
"""Generate NATO-symbol marked maps + CCO sketch for ME-BRH OP (DSCSC 2026)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle, Ellipse, Polygon
from matplotlib.lines import Line2D
import matplotlib.path as mpath
import numpy as np

RED = "#C00000"; BLUE = "#0050A0"; GREEN = "#2E7D32"; BROWN = "#8D6E63"
WATER = "#7EB6E0"; WATER_E = "#3D7AB5"

# ---------------- geography (grid: easting 64-82, northing 34-47; 1 sq = 1 km) ----------------
RIVER = [(65.0,46.4),(65.8,45.3),(66.6,44.3),(67.5,43.3),(68.4,42.4),(69.0,41.6),
         (69.4,40.8),(69.6,40.2),(70.2,39.9),(71.0,39.7),(71.8,39.2),(72.4,38.7),
         (73.2,38.1),(74.1,37.4),(74.9,36.7),(75.3,36.0),(75.2,35.2),(74.9,34.4)]

VILLS = {  # name: (x, y)
 "KONOK":(65.5,45.5), "MORAPARA":(70.0,45.6), "BHOLA":(72.6,44.5), "RAJBARI":(67.0,43.6),
 "BANANI":(69.5,43.1), "KONABARI":(78.5,43.4), "PABNA":(76.2,42.3), "BARISHAL":(70.3,42.0),
 "MOHAKHALI":(79.3,41.8), "VITARA":(66.2,41.4), "BOALI":(73.2,41.0), "PANAM":(64.6,40.6),
 "BAUNIA":(68.9,40.0), "AMBAGAN":(71.0,39.9), "NAIRA":(76.6,39.5), "RATNA":(80.5,39.5),
 "SRIPUR":(67.4,38.9), "SAMPAN":(72.4,38.5), "ISLAMPUR":(64.6,37.5), "JOLSHIRI":(68.6,37.5),
 "KHULNA":(71.2,38.0), "PURBO PARA":(74.3,38.0), "BELONIA":(77.6,38.0),
 "FERRY GHAT":(75.2,36.6), "JAMALPUR":(78.7,36.3), "BIRULIA":(73.6,35.5),
 "NATORE":(76.2,35.5), "TARABO":(69.6,35.0), "KUMRO HAOR":(78.6,38.7),
}

MAIN_RD = [(82.0,44.6),(80.5,44.0),(78.5,43.4),(76.2,42.3),(74.8,41.6),(73.2,41.0),
           (72.0,40.4),(71.0,39.9),(69.6,40.1),(68.9,40.0),(67.0,39.9),(65.5,39.7),(64.0,39.5)]
RD_60A1 = [(76.2,42.3),(76.4,40.8),(76.6,39.5),(76.0,38.2),(75.2,36.6),(73.6,35.5)]
RD_60A1B = [(76.6,39.5),(75.2,36.6)]
RD_W = [(75.2,36.6),(73.6,36.0),(72.0,36.6),(70.5,37.0),(68.6,37.5),(66.5,37.5),(64.6,37.5)]
RD_N = [(76.2,42.3),(74.0,43.6),(72.6,44.5),(70.0,45.6)]
TR_BANANI = [(70.0,45.6),(69.8,44.4),(69.5,43.1),(69.2,42.6)]
RD_SRIPUR = [(68.9,40.0),(67.4,38.9),(68.6,37.5)]
RD_VITARA = [(66.2,41.4),(64.6,40.6)]
RD_FAR = [(68.9,40.0),(66.2,41.4)]

def base_map(ax, title):
    ax.set_xlim(64,82); ax.set_ylim(34,47); ax.set_aspect("equal")
    ax.set_facecolor("#FAF6E9")
    for x in range(64,83):
        ax.axvline(x, color="#C9BFA0", lw=.4, zorder=1)
    for y in range(34,48):
        ax.axhline(y, color="#C9BFA0", lw=.4, zorder=1)
    ax.set_xticks(range(64,83)); ax.set_yticks(range(34,48))
    ax.set_xticklabels([f"{v:02d}" for v in range(64,83)], fontsize=7)
    ax.set_yticklabels([f"{v:02d}" for v in range(34,48)], fontsize=7)
    ax.tick_params(length=0)
    # river (double stroke)
    rx,ry = zip(*RIVER)
    ax.plot(rx,ry,color=WATER,lw=11,solid_capstyle="round",zorder=2)
    ax.plot(rx,ry,color=WATER_E,lw=1.1,zorder=3, alpha=.7)
    ax.annotate("River DANUBE", xy=(66.4,44.6), rotation=-48, fontsize=9, style="italic",
                color=WATER_E, weight="bold", zorder=4)
    ax.annotate("River DANUBE", xy=(73.2,37.9), rotation=-38, fontsize=9, style="italic",
                color=WATER_E, weight="bold", zorder=4)
    # roads
    for pts,lw,c in [(MAIN_RD,2.6,"#B03A2E"),(RD_60A1,1.6,"#C0642E"),(RD_W,1.6,"#C0642E"),
                     (RD_N,1.3,"#C0642E"),(RD_SRIPUR,1.1,"#C0642E"),(RD_VITARA,1.1,"#C0642E"),
                     (RD_FAR,1.1,"#C0642E")]:
        px,py = zip(*pts); ax.plot(px,py,color=c,lw=lw,zorder=3)
    px,py=zip(*TR_BANANI); ax.plot(px,py,color="#C0642E",lw=1.0,ls=(0,(4,2)),zorder=3)
    ax.annotate("CL 80 A2  SALTA–KONABARI–PABNA–BAUNIA–NIDAL", xy=(73.4,41.35), rotation=-14,
                fontsize=6.5, color="#7B241C", zorder=4)
    ax.annotate("CL 60 A1", xy=(76.55,40.6), rotation=-80, fontsize=6, color="#7B241C", zorder=4)
    ax.annotate("NIDAL →", xy=(64.15,39.05), fontsize=7, color="#7B241C", weight="bold")
    ax.annotate("← SALTA", xy=(80.3,44.9), fontsize=7, color="#7B241C", weight="bold")
    # villages
    for name,(x,y) in VILLS.items():
        if name=="KUMRO HAOR":
            ax.add_patch(Ellipse((x,y),1.2,.75,facecolor=WATER,edgecolor=WATER_E,lw=.7,zorder=3))
            ax.annotate(name,(x-.62,y-.62),fontsize=6,color=WATER_E,style="italic",zorder=4)
            continue
        ax.add_patch(Ellipse((x,y),1.5,.95,facecolor="none",edgecolor="#8A7B52",
                             lw=.8,ls=(0,(2,2)),zorder=3))
        for dx,dy in [(-.3,.12),(.15,.2),(-.05,-.18),(.32,-.08)]:
            ax.add_patch(Rectangle((x+dx-.06,y+dy-.06),.13,.13,facecolor="#C0392B",
                                   edgecolor="none",zorder=3))
        ax.annotate(name,(x,y-.72),fontsize=6.4,ha="center",color="#4A3F28",
                    weight="bold",zorder=4)
    ax.set_title(title, fontsize=12, weight="bold", pad=10)
    ax.annotate("SCALE: 1 SQ = 1 KM", xy=(.5,-.055), xycoords="axes fraction",
                ha="center", fontsize=8, weight="bold")

# ---------------- APP-6 style symbol helpers ----------------
def echelon(ax,x,y,ech,color,fs=8):
    ax.annotate(ech,(x,y),ha="center",va="center",fontsize=fs,color=color,
                weight="bold",zorder=8)

def friendly_unit(ax,x,y,ech="I",icon="inf",label="",w=1.0,h=.62,lc=BLUE,lw=1.4,label_dy=None):
    ax.add_patch(Rectangle((x-w/2,y-h/2),w,h,facecolor="white",edgecolor=lc,lw=lw,zorder=6))
    if icon=="inf":
        ax.plot([x-w/2,x+w/2],[y-h/2,y+h/2],color=lc,lw=1.1,zorder=7)
        ax.plot([x-w/2,x+w/2],[y+h/2,y-h/2],color=lc,lw=1.1,zorder=7)
    elif icon=="armd":
        ax.add_patch(Ellipse((x,y),w*.68,h*.55,facecolor="none",edgecolor=lc,lw=1.1,zorder=7))
    elif icon=="arty":
        ax.add_patch(Circle((x,y),h*.18,facecolor=lc,edgecolor=lc,zorder=7))
    elif icon=="engr":
        ax.plot([x-w*.26,x+w*.26],[y-h*.12,y-h*.12],color=lc,lw=1.2,zorder=7)
        for xx in (-.26,0,.26):
            ax.plot([x+w*xx,x+w*xx],[y-h*.12,y+h*.16],color=lc,lw=1.2,zorder=7)
    elif icon=="mechinf":
        ax.plot([x-w/2,x+w/2],[y-h/2,y+h/2],color=lc,lw=1.0,zorder=7)
        ax.plot([x-w/2,x+w/2],[y+h/2,y-h/2],color=lc,lw=1.0,zorder=7)
        ax.add_patch(Ellipse((x,y),w*.6,h*.42,facecolor="none",edgecolor=lc,lw=1.0,zorder=7))
    if ech: echelon(ax,x,y+h/2+.22,ech,lc)
    if label:
        ax.annotate(label,(x+w/2+.1,y),fontsize=6.3,color=lc,va="center",
                    weight="bold",zorder=8)
    if label_dy is not None and label:
        pass

def hostile_unit(ax,x,y,ech="I",icon="inf",label="",s=.62,lc=RED,dashed=False):
    pts=[(x,y+s),(x+s*.78,y),(x,y-s),(x-s*.78,y)]
    ax.add_patch(Polygon(pts,facecolor="white",edgecolor=lc,lw=1.4,zorder=6,
                         ls=(0,(3,2)) if dashed else "solid"))
    if icon=="inf":
        ax.plot([x-s*.4,x+s*.4],[y-s*.42,y+s*.42],color=lc,lw=1.0,zorder=7)
        ax.plot([x-s*.4,x+s*.4],[y+s*.42,y-s*.42],color=lc,lw=1.0,zorder=7)
    elif icon=="armd":
        ax.add_patch(Ellipse((x,y),s*.9,s*.55,facecolor="none",edgecolor=lc,lw=1.0,zorder=7))
    elif icon=="arty":
        ax.add_patch(Circle((x,y),s*.2,facecolor=lc,edgecolor=lc,zorder=7))
    elif icon=="atk":
        ax.plot([x-s*.42,x,x+s*.42],[y-s*.35,y+s*.42,y-s*.35],color=lc,lw=1.2,zorder=7)
    elif icon=="mg":
        ax.plot([x,x],[y-s*.35,y+s*.35],color=lc,lw=1.4,zorder=7)
        ax.plot([x-s*.28,x+s*.28],[y+s*.35,y+s*.35],color=lc,lw=1.4,zorder=7)
    if ech: echelon(ax,x,y+s+.2,ech,lc)
    if label:
        ax.annotate(label,(x+s*.85,y+.05),fontsize=6.3,color=lc,va="center",
                    weight="bold",zorder=8)

def minefield(ax,x,y,label="",w=1.5,lc=RED):
    for i,dx in enumerate(np.linspace(-w/2,w/2,5)):
        ax.add_patch(Circle((x+dx,y),.09,facecolor="none",edgecolor=lc,lw=1.1,zorder=6))
    ax.plot([x-w/2,x-w/2],[y-.2,y+.2],color=lc,lw=1.1,zorder=6)
    ax.plot([x+w/2,x+w/2],[y-.2,y+.2],color=lc,lw=1.1,zorder=6)
    if label:
        ax.annotate(label,(x,y+.26),fontsize=5.8,color=lc,ha="center",weight="bold",zorder=8)

def lp_op(ax,x,y,label,lc=RED):
    ax.add_patch(Polygon([(x,y+.42),(x-.3,y-.18),(x+.3,y-.18)],facecolor="white",
                          edgecolor=lc,lw=1.3,zorder=6))
    ax.annotate("OP",(x,y+.02),fontsize=5.5,ha="center",color=lc,weight="bold",zorder=7)
    ax.annotate(label,(x,y-.5),fontsize=5.8,ha="center",color=lc,weight="bold",zorder=8)

def phase_line(ax,pts,name,color,xy_lab):
    px,py=zip(*pts)
    ax.plot(px,py,color=color,lw=2.0,ls=(0,(6,3)),zorder=5)
    ax.annotate(name,xy_lab,fontsize=7.5,color=color,weight="bold",zorder=8,
                bbox=dict(boxstyle="round,pad=.15",fc="white",ec=color,lw=.8))

def axis_arrow(ax,p0,p1,color,lw=3.4,style="-|>",ls="solid",alpha=.95):
    ax.add_patch(FancyArrowPatch(p0,p1,arrowstyle=style,mutation_scale=16,
                 color=color,lw=lw,ls=ls,alpha=alpha,zorder=5))

def area_box(ax,x,y,txt,lc=BLUE,fs=6.4,pad=.18):
    ax.annotate(txt,(x,y),fontsize=fs,color=lc,ha="center",va="center",weight="bold",zorder=8,
                bbox=dict(boxstyle=f"round,pad={pad}",fc="white",ec=lc,lw=1.0))

# ============ MAP 1 : LIVE MAP MARKING — EN (RL) DISPOSITION ============
fig,ax = plt.subplots(figsize=(13.2,10.2))
base_map(ax,"ANX A — LIVE MAP MARKING: RL (WL DOCTRINE) DISPOSITION IN GEN AREA BAUNIA\n(Assessed as at 111800 Jul 2026 — EXERCISE)")

# fwd coy def posns (hostile, dug in)
hostile_unit(ax,66.2,41.4,"I","inf","RL COY (VITARA)")
hostile_unit(ax,68.9,40.0,"I","inf")
ax.annotate("RL COY (+) BAUNIA",(67.0,40.55),fontsize=6.3,color=RED,weight="bold",zorder=8)
hostile_unit(ax,71.2,38.0,"I","inf","RL COY (KHULNA)")
hostile_unit(ax,67.4,38.9,"I","inf","RL COY (DEPTH)\n(SRIPUR)")
# bn HQ assessed
hostile_unit(ax,66.9,39.6,"II","inf","RL BN GP HQ (ASSD)",s=.55,dashed=True)
# contingency posn JOLSHIRI (dashed = assessed/prep)
hostile_unit(ax,68.6,37.4,"I","inf","CONTG POSN (PREP)",dashed=True)
# tk hide + TCV JOLSHIRI
hostile_unit(ax,69.3,36.9,"","armd","TK HIDE + TCV (JOLSHIRI)",s=.5,dashed=True)
# tks seen KHULNA
hostile_unit(ax,72.1,36.2,"","armd","TKS SEEN 7138",s=.45)
# arty ISLAMPUR
hostile_unit(ax,64.6,37.9,"I","arty","RL FD BTY (ASSD)\nISLAMPUR 6438",dashed=True)
# ATk wpn GR 702395
hostile_unit(ax,70.2,39.5,"","atk","ATK WPN GR 702395",s=.42)
# MG posns
for (gx,gy),lab in [((68.1,41.8),"MG 681418"),((69.9,40.05),""),((71.5,38.6),"MG 715386")]:
    hostile_unit(ax,gx,gy,"","mg",lab,s=.34)
ax.annotate("MG 699400",(70.15,40.45),fontsize=6.3,color=RED,weight="bold",zorder=8)
# minefds
minefield(ax,68.9,41.0,"A PERS MFD SQ 6841\n(500 m, W BANK)",w=1.6)
minefield(ax,73.2,36.9,"MIXED MFD SQ 7236",w=1.4)
minefield(ax,69.6,40.9,"",w=1.0)
ax.annotate("MIXED MFD SQ 6940",(70.6,41.15),fontsize=5.8,color=RED,weight="bold",zorder=8)
minefield(ax,71.4,37.3,"MIXED MFD KHULNA 7138",w=1.4)
# digging
for sq,(dx,dy) in {"6741":(66.6,42.35),"6939":(69.5,39.4),"6739":(67.6,39.5)}.items():
    ax.annotate(f"DIGGING SQ {sq}",(dx,dy),fontsize=5.6,color=RED,style="italic",zorder=8)
# LP/OPs
lp_op(ax,66.4,40.6,"LP/OP S VITARA")
lp_op(ax,75.5,37.2,"LP/OP FERRY GHAT")
# dml br
ax.plot([69.35,69.85],[40.35,39.75],color="k",lw=2.2,zorder=6)
ax.plot([69.45,69.75],[39.85,40.25],color=RED,lw=1.6,zorder=7)
ax.plot([69.45,69.75],[40.25,39.85],color=RED,lw=1.6,zorder=7)
ax.annotate("DML RD BR (BAUNIA)",(69.9,40.6),fontsize=6,color="k",weight="bold",zorder=8)
ax.annotate("FERRY SITE NATORE 7535 — NON-OP",(72.4,34.35),fontsize=6,color=RED,style="italic",zorder=8)
# FEBA trace (en side of river)
febax=[(65.6,42.6),(66.2,41.9),(67.2,41.2),(68.2,40.7),(69.2,40.5)]
# legend
leg=[Line2D([0],[0],marker="D",mfc="white",mec=RED,ms=11,lw=0,label="RL (hostile) unit — APP-6 diamond"),
     Line2D([0],[0],marker="D",mfc="white",mec=RED,ms=11,lw=0,ls="none",label="Dashed frame = assessed / template"),
     Line2D([0],[0],color=RED,lw=1.2,label="Minefd (circles) / MG / ATk / OP"),
     Line2D([0],[0],color=WATER,lw=6,label="River DANUBE (150–200 m; 3–5 m deep)")]
ax.legend(handles=leg,loc="lower left",fontsize=7,framealpha=.95)
plt.tight_layout()
plt.savefig("map1_en_disposition.png",dpi=170,bbox_inches="tight")
plt.close()

# ============ MAP 2 : OP OVERLAY — OWN PLAN (COURSE I) ============
fig,ax = plt.subplots(figsize=(13.2,10.2))
base_map(ax,"ANX B — OP OVERLAY: BRH OP GEN AREA BAUNIA (COURSE I) — 8 INF BDE\n(H Hr 132000 Jul 26 · A Hr NB 140030 · B Hr NB 140500 — EXERCISE)")

# en outline (faded)
for (x,y),lab in [((66.2,41.4),""),((68.9,40.0),""),((71.2,38.0),""),((67.4,38.9),"")]:
    hostile_unit(ax,x,y,"I","inf",lab,s=.5)
hostile_unit(ax,68.6,37.4,"I","inf","",dashed=True,s=.45)
hostile_unit(ax,64.6,37.9,"I","arty","",dashed=True,s=.45)
minefield(ax,68.9,41.0,"",w=1.2); minefield(ax,71.4,37.3,"",w=1.2)

# ---- own control measures (home bank = NE of river) ----
area_box(ax,80.6,45.9,"BDE ASSY A\nDHAMRAI →\nVMA N DHAMRAI")
area_box(ax,78.5,43.9,"BN ASSY A\nKONABARI")
area_box(ax,79.3,42.3,"BN ASSY A\nMOHAKHALI")
area_box(ax,80.5,40.0,"BN ASSY A\nRATNA")
area_box(ax,76.2,42.9,"A VEH WA\nPABNA")
area_box(ax,70.0,46.2,"B VEH WA / BOLP\nMORAPARA")
area_box(ax,73.4,41.6,"B VEH WA / BOLP\nBOALI")
area_box(ax,70.1,43.5,"FUP 1\nBANANI",lc=GREEN)
area_box(ax,71.6,40.4,"FUP 2\nAMBAGAN",lc=GREEN)

# crossing sites / br / raft
def bridge_sym(ax,x,y,label,lc=GREEN):
    ax.plot([x-.35,x+.35],[y,y],color=lc,lw=2.6,zorder=7)
    ax.plot([x-.35,x-.5],[y,y+.28],color=lc,lw=2.0,zorder=7)
    ax.plot([x-.35,x-.5],[y,y-.28],color=lc,lw=2.0,zorder=7)
    ax.plot([x+.35,x+.5],[y,y+.28],color=lc,lw=2.0,zorder=7)
    ax.plot([x+.35,x+.5],[y,y-.28],color=lc,lw=2.0,zorder=7)
    ax.annotate(label,(x,y+.4),fontsize=6.2,color=lc,ha="center",weight="bold",zorder=8)
bridge_sym(ax,68.9,42.05,"CL 50 BR SITE\nBANANI")
bridge_sym(ax,69.25,41.35,"RAFT SITE 1\nS BANANI")
bridge_sym(ax,70.6,39.55,"RAFT SITE 2\nAMBAGAN")

# assault axes
axis_arrow(ax,(70.0,43.2),(66.9,41.6),BLUE)   # 19 Bn -> VITARA
ax.annotate("19 INF BN\n(R FWD — WAVES 1-3)",(68.2,42.9),fontsize=6.6,color=BLUE,weight="bold",zorder=8)
axis_arrow(ax,(71.4,40.15),(69.5,39.85),BLUE) # 29 Bn -> BAUNIA
ax.annotate("29 INF BN\n(L FWD — WAVES 1-3)",(71.9,40.9),fontsize=6.6,color=BLUE,weight="bold",zorder=8)
axis_arrow(ax,(69.0,39.6),(67.9,39.05),BLUE,ls=(0,(5,3)))  # 39 Bn ph2 -> SRIPUR
ax.annotate("PH 2: 39 INF BN → SRIPUR",(68.6,38.5),fontsize=6.4,color=BLUE,weight="bold",zorder=8)
axis_arrow(ax,(67.2,38.6),(65.3,37.7),BLUE,ls=(0,(2,2)),lw=2.6)  # ph3 19 -> ISLAMPUR
axis_arrow(ax,(70.6,38.6),(70.9,38.35),BLUE,ls=(0,(2,2)),lw=2.6) # ph3 29 -> KHULNA
ax.annotate("PH 3: 19 → ISLAMPUR–JOLSHIRI\n29 → KHULNA",(69.8,36.2),fontsize=6.4,
            color=BLUE,weight="bold",zorder=8)
# deception
axis_arrow(ax,(75.9,37.3),(74.9,36.9),"#666666",ls=(0,(2,2)),lw=2.2)
ax.annotate("DECEPTION / FEINT\nFERRY GHAT",(76.5,37.7),fontsize=6.2,color="#555555",
            weight="bold",zorder=8)

# own units (friendly rectangles) on home bank
friendly_unit(ax,72.8,43.0,"II","inf","19")
friendly_unit(ax,74.3,40.3,"II","inf","29")
friendly_unit(ax,77.3,41.0,"II","inf","39 (FOL UP)")
friendly_unit(ax,79.0,38.6,"","armd","SQN 6H (-)")
friendly_unit(ax,80.0,37.3,"I","arty","FD/SP/MED/MLRS (6 ARTY BDE)")
friendly_unit(ax,78.4,34.7,"I","engr","2xFD COY + 2xBR COY")
friendly_unit(ax,75.4,44.6,"II","inf","BANK GP (BN GP, 7 BDE)")
area_box(ax,72.5,45.8,"CCO — DIV SP BN (-)\nTCP · WCL · CALL FWD",lc="#6A1B9A",fs=6.0)

# phase lines
phase_line(ax,[(64.3,42.6),(66.0,42.3),(67.7,41.6),(68.6,41.0),(69.1,40.6)],
           "PL IRON FIST (PH 1)","#1B5E20",(64.4,43.0))
phase_line(ax,[(64.3,39.6),(65.8,39.3),(66.9,38.6),(67.9,38.2),(68.7,38.0)],
           "PL TOP GUN (PH 2)","#E65100",(65.0,38.65))
phase_line(ax,[(64.2,41.2),(64.6,40.0),(64.6,38.6),(64.7,37.0),(66.0,36.2),(68.0,35.8),
               (70.2,35.9),(71.6,36.4),(72.6,37.1)],
           "PL HARD PUNCH (PH 3)\nBRH LINE PANAM–ISLAMPUR","#B71C1C",(70.6,35.2))
# breakout arrow
axis_arrow(ax,(66.5,39.85),(64.3,39.6),"#7B1FA2",lw=5,style="-|>")
ax.annotate("9 ARMD BDE BREAKOUT\n(NB 140900) → IB",(64.35,41.6),fontsize=6.8,
            color="#7B1FA2",weight="bold",zorder=8)

leg=[Line2D([0],[0],marker="s",mfc="white",mec=BLUE,ms=11,lw=0,label="BL (friendly) unit — APP-6 rectangle"),
     Line2D([0],[0],marker="D",mfc="white",mec=RED,ms=10,lw=0,label="RL (hostile) unit"),
     Line2D([0],[0],color=BLUE,lw=3,label="Aslt axis (solid=Ph1, dash=Ph2/3)"),
     Line2D([0],[0],color="#1B5E20",lw=2,ls="--",label="Phase line / report line"),
     Line2D([0],[0],color=GREEN,lw=2.4,label="Br / raft site (engr symbol)")]
ax.legend(handles=leg,loc="lower left",fontsize=7,framealpha=.95)
plt.tight_layout()
plt.savefig("map2_op_overlay.png",dpi=170,bbox_inches="tight")
plt.close()

# ============ SKETCH : CROSSING AREA / CCO LAYOUT (NOT TO SCALE) ============
fig,ax = plt.subplots(figsize=(12.5,9))
ax.set_xlim(0,100); ax.set_ylim(0,72); ax.axis("off")
ax.set_facecolor("white")
ax.set_title("ANX C — SKETCH: LAYOUT OF CROSSING AREA, CCO AND BANK MASTER GP (NOT TO SCALE)\nASLT RIV XING — GL DOCTRINE TEMPLATE APPLIED TO BANANI–AMBAGAN X AREA",
             fontsize=11.5, weight="bold", pad=12)

# river band (vertical-ish, far bank left)
ax.add_patch(Polygon([(30,0),(36,0),(38,24),(36,48),(38,72),(32,72),(30,48),(32,24)],
                     facecolor=WATER,edgecolor=WATER_E,lw=1.2,zorder=1))
ax.annotate("RIVER DANUBE\n150–200 m · 3–5 m deep · 2–3 m/s",(34,64),rotation=90,
            fontsize=7.5,color=WATER_E,ha="center",weight="bold",zorder=3)
ax.annotate("FAR (WEST) BANK — RL",(15,69.3),fontsize=9,color=RED,weight="bold")
ax.annotate("HOME (EAST) BANK — BL",(55,69.3),fontsize=9,color=BLUE,weight="bold")

# far bank: objectives
hostile_unit(ax,12,52,"I","inf","RL COY VITARA",s=3.2)
hostile_unit(ax,10,30,"I","inf","RL COY (+) BAUNIA",s=3.2)
hostile_unit(ax,16,12,"I","inf","RL COY KHULNA",s=3.0)
hostile_unit(ax,4,20,"I","arty","RL BTY (ISLAMPUR)",s=2.6,dashed=True)
minefield(ax,24,42,"A PERS MFD",w=8,lc=RED)
minefield(ax,22,18,"MIXED MFD",w=8,lc=RED)
ax.annotate("OBJ 1 (PH 1)\nVITARA–BAUNIA\nPL IRON FIST",(11,42),fontsize=7,color="#1B5E20",
            weight="bold",ha="center",
            bbox=dict(boxstyle="round,pad=.25",fc="#E8F5E9",ec="#1B5E20"))

# crossing sites on river
def gap(ax,y,label,col=GREEN):
    ax.add_patch(Rectangle((29.2,y-2.2),9.6,4.4,facecolor="white",edgecolor=col,lw=1.6,zorder=2))
    ax.annotate(label,(34,y),fontsize=6.6,color=col,ha="center",va="center",weight="bold",zorder=3)
gap(ax,50,"X SITE 1 (ASLT)\nBANANI\n+ CL 50 BR SITE")
gap(ax,36,"RAFT SITE 1\nS BANANI\n(CL 40/50 RAFT)")
gap(ax,22,"X SITE 2 (ASLT)\n+ RAFT SITE 2\nAMBAGAN")

# home bank layout columns
area_box(ax,47,55,"WATERWAY\nCON LINE (WCL)\nBANK MASTER GP\n(PL EACH SITE)",lc="#6A1B9A",fs=6.4)
area_box(ax,47,30,"BANK GP\n(BN GP EX 7 BDE)\nFIRE BASE + OPs",lc=BLUE,fs=6.6)
area_box(ax,59,50,"FUP 1  BANANI\n19 + 29 INF BN\n(BOAT STATIONS)",lc=GREEN,fs=6.6)
area_box(ax,59,22,"FUP 2  AMBAGAN\n(2nd ASLT ECH)",lc=GREEN,fs=6.6)
area_box(ax,70,58,"BOLP MORAPARA\n(BOAT COLLECTION)",fs=6.3)
area_box(ax,70,14,"BOLP BOALI",fs=6.3)
area_box(ax,72,40,"B VEH WAITING AREA\nMORAPARA · BOALI",fs=6.3)
area_box(ax,83,50,"A VEH WAITING\nAREA — PABNA",fs=6.3)
area_box(ax,83,30,"BN ASSY A\nKONABARI · MOHAKHALI · RATNA",fs=6.3)
area_box(ax,93,40,"BDE ASSY A\nDHAMRAI\nVMA N DHAMRAI",fs=6.3)
area_box(ax,60,66,"CCO HQ (DIV SP BN -)\nTCP 1-4 · CALL FWD AREAS\nROUTE CON: CL 80 A2 + CL 60 A1",lc="#6A1B9A",fs=6.2)
area_box(ax,88,63,"FWD BAA (LOG)\nCEN CON — DECEN EXEC",lc=BROWN,fs=6.2)

# flow arrows (right to left)
for y0,y1 in [(40,50),(40,22)]:
    pass
axis_arrow(ax,(89,40),(76,40),"#333333",lw=2.2)
axis_arrow(ax,(79,50),(63.5,50),"#333333",lw=2.2)
axis_arrow(ax,(79,30),(64,24),"#333333",lw=2.2)
axis_arrow(ax,(55,50),(38.8,50),BLUE,lw=3.2)
axis_arrow(ax,(55,22),(38.8,22),BLUE,lw=3.2)
axis_arrow(ax,(29.5,50),(20,50),BLUE,lw=3.2)   # to VITARA? actually assault axes far bank
axis_arrow(ax,(29.5,22),(19,26),BLUE,lw=3.2)
ax.annotate("WAVES 1–3 (ASLT BOATS)\nH HR 2000",(45,46),fontsize=6.4,color=BLUE,weight="bold")
ax.annotate("ISR PREP AFTER 1st WAVE →\nHY RAFT FM A HR · BR FM PH 2",(41,12),fontsize=6.2,
            color=GREEN,weight="bold")

# doctrinal note strip
ax.annotate("GL DOCTRINE SEQUENCE: ASSY A → VEH WA → BOLP (collect boats) → FUP (boat stations) → WCL → ASLT WAVES → "
            "FOOTHOLD → ISR/FERRY (F ECH + ATGM FIRST) → RAFT (TK/COMP PL) → CL 50 BR → BUILD-UP → BRH LINE",
            (2,2.5),fontsize=7.2,color="#333333",style="italic",
            bbox=dict(boxstyle="round,pad=.3",fc="#F5F5F5",ec="#999999"))
plt.tight_layout()
plt.savefig("sketch_cco_layout.png",dpi=170,bbox_inches="tight")
plt.close()
print("maps done")
