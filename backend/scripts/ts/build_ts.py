#!/usr/bin/env python3
"""Build the Telangana College Predictor cutoff CSV (NEET AIR) from KNRUHS phase-2 college-wise lists.

Inputs (extract_ts.py output): CQ.jsonl (MBBS competent authority quota), MQ.jsonl (MBBS/BDS
management quota). Both phase-2 lists include seats kept from phase 1, so each gives the closing rank.
CQ ADM: CAT-GEN|FEM[-MRC][-PHO|CAP|NCC|SCL][-MSM]  CAT = OPEN, BCA–BCE, SC1–SC3, ST, EWS, MIN
  FEM → FEMALE; MIN (Muslim minority), PHO (PwD), CAP, NCC, SCL (Singareni) → hidden
MQ ADM: CTB-LOC… (Telangana local) · CTB-UNR… (all-India) · NRI… (hidden) · …-MIN… (hidden)
"""
import collections
import csv
import json
import re
import sys

CAT = {"OPEN": "OPEN", "EWS": "EWS", "BCA": "BC-A", "BCB": "BC-B", "BCC": "BC-C", "BCD": "BC-D", "BCE": "BC-E", "SC1": "SC-1", "SC2": "SC-2", "SC3": "SC-3", "ST": "ST"}
SPECIAL = {"PHO": "PWD", "CAP": "DEFENCE", "NCC": "NCC", "SCL": "SINGARENI"}


def classify(label, adm):
    parts = re.sub(r"-P\d$", "", adm).split("-")
    female = "FEM" in parts
    if label == "MQ":
        if parts[0] == "NRI":
            return ("NRI", "OPEN", "NRI", False)
        if "MIN" in parts:
            return ("Management (minority)", "OPEN", "MINORITY", False)
        unr = "UNR" in parts
        seat = ("Management B (all-India)" if unr else "Management B (Telangana local)") + (" · women" if female else "")
        return (seat, "OPEN", "FEMALE" if female else "", unr)
    cat = parts[0]
    special = next((SPECIAL[p] for p in parts if p in SPECIAL), None)
    if special:
        return ("Competent authority (special)", "OPEN", special, False)
    if cat == "MIN":
        return ("Competent authority (minority)", "OPEN", "MINORITY", False)
    if cat not in CAT:
        return ("Competent authority (special)", "OPEN", "SPECIAL", False)
    return ("Competent authority" + (" · women" if female else ""), CAT[cat], "FEMALE" if female else "", False)


GOVT = re.compile(r"^(GOVT|GOVERNMENT|OSMANIA|GANDHI|KAKATIYA|RAJIV GANDHI|ESIC|ESI|NIZAM|NIMS|GOVERNEMENT)|GOVT\.? (MEDICAL|DENTAL)|GOVERNMENT (MEDICAL|DENTAL)", re.I)


def nice(n):
    n = re.sub(r"\s+", " ", n).strip(" ,")
    out = []
    for w in n.split(" "):
        core = re.sub(r"[^A-Z]", "", w)
        if core in {"ESIC", "ESI", "NIMS", "MNR", "RVM", "SVS", "TRR", "MRIMS", "CMR", "KIMS", "AIIMS", "IMS", "HYD"} or (len(core) <= 3 and core not in {"AND", "OF", "THE", "FOR"} and "." not in w and len(w) <= 4 and core):
            out.append(w)
        elif core in {"AND", "OF", "THE", "FOR"}:
            out.append(w.lower())
        else:
            out.append(w.capitalize())
    n = " ".join(out)
    n = re.sub(r"\bHYD\b\.?|\bHyd\b\.?", "Hyderabad", n)
    for a, b in [("Sceinces", "Sciences"), ("Sciecnes", "Sciences"), ("Iinstitute", "Institute"), ("MED SCI", "Medical Sciences"), ("Medical SCI", "Medical Sciences"),
                 ("Inst of", "Institute of"), (" RAO ", " Rao "), ("DR ", "Dr "), ("SRI SAI", "Sri Sai"), ("Sciences.,", "Sciences,"), (", RR", ", Rangareddy"), ("Womens", "Women's")]:
        n = n.replace(a, b)
    return n.rstrip(". ")


rows = []
for label in ("CQ", "MQ"):
    for line in open(f"{label}.jsonl"):
        r = json.loads(line)
        r["seat"], r["cat_"], r["elig"], r["open"] = classify(label, r["adm"])
        rows.append(r)

g = {}
for r in rows:
    code, name = r["college"].split("|", 1)
    course = "BDS" if r["course"].startswith("BDS") else "MBBS"
    k = (code, name, course, r["seat"], r["cat_"], r["elig"], r["open"])
    lo, hi = g.get(k, (10**9, 0))
    g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))

names = {}
for (code, name, *_rest) in g:
    names.setdefault(code, name)
out = []
for (code, name, course, seat, cat, elig, op), (lo, hi) in sorted(g.items()):
    full = names[code]
    out.append([nice(full), course, cat, lo, hi, "", "", seat, "Telangana", "Government" if GOVT.search(full) else "Private", "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "ts_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges from", len(rows), "allotments")
print(collections.Counter((o[7], o[11]) for o in out).most_common(12))
print("\n".join(sorted({f"{o[9][:4]} {o[0]}" for o in out})))
