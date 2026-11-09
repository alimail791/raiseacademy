#!/usr/bin/env python3
"""Build the Punjab College Predictor cutoff CSV (NEET AIR) from BFUHS round lists.

  main closing rank  = seats held after round 2 (R2.jsonl: allotted seat, else joined seat)
  later closing rank = seats held after round 3 (R3.jsonl)
(Round 1 lists only the state merit number, not the NEET rank, so it is not used.)
Quotas: Govt. Quota / Management Quota → Punjab students · Open Quota "Open" + Open Quota (AIQ) →
all states · Minority / Christian minority / NRI → hidden.
Categories: Open, Scheduled Caste, Backward Classes, EWS; Backward Area / Border Area → PB_BACKWARD /
PB_BORDER tick boxes; Sports, Defence, Terrorist/Riots affected, J&K, PwD, Freedom fighter → hidden.
"""
import collections
import csv
import json
import re
import sys

CAT = {"Open": "OPEN", "Scheduled Caste": "SC", "Backward Classes": "BC", "EWS": "EWS", "AIQ": "OPEN"}
AREA = {"Backward Area": "PB_BACKWARD", "Border Area": "PB_BORDER"}
SPECIAL = {"Sports Person": "SPORTS", "Defence": "DEFENCE", "Terrorist Affected": "SPECIAL", "Riots Affected": "SPECIAL",
           "J & K": "JK_MIGRANT", "PWD": "PWD", "Freedom Fighter": "SPECIAL", "Freed Fight": "SPECIAL", "NRI": "NRI", "PP": "SPECIAL"}


def classify(quota, cat):
    q = re.sub(r"\s+", "", quota).lower()
    if "minority" in q:
        return ("Minority", "OPEN", "MINORITY", False)
    if "nri" in q or cat == "NRI":
        return ("NRI", "OPEN", "NRI", False)
    if cat in SPECIAL:
        return ("Special", "OPEN", SPECIAL[cat], False)
    if q.startswith("openquota"):
        if cat in ("Open", "AIQ"):
            return ("Open quota (all-India)", "OPEN", "", True)
        seat = "Open quota"
    elif q.startswith("management"):
        seat = "Management quota"
    else:
        seat = "Govt quota"
    if cat in AREA:
        return (seat + " · " + cat.lower(), "OPEN", AREA[cat], False)
    if cat in CAT:
        return (seat, CAT[cat], "", False)
    return ("Special", "OPEN", "SPECIAL", False)


def nice(n):
    n = re.sub(r"\s+", " ", n).strip(" ,")
    for a, b in [("SGRD Inst. of Dental Sci. & Research", "SGRD Institute of Dental Sciences & Research"), ("Sarabha(Ldh)", "Sarabha, Ludhiana"), ("Hospital Ludhiana", "Hospital, Ludhiana"), ("College Faridkot", "College, Faridkot"), ("Research Amritsar", "Research, Amritsar"), ("Instt.", "Institute"), ("Dr.B.R", "Dr. B.R."), ("S.A.S Nagar,Mohali", "S.A.S. Nagar, Mohali"), (",", ", "), ("  ", " ")]:
        n = n.replace(a, b)
    return re.sub(r"\s+,", ",", n).strip()


def course_of(c):
    return "BDS" if c.upper().replace(".", "").startswith("BDS") else "MBBS"


def agg(label):
    g = {}
    for line in open(f"{label}.jsonl"):
        r = json.loads(line)
        k = (nice(r["college"]), course_of(r["course"])) + classify(r["quota"], r["cat"])
        lo, hi = g.get(k, (10**9, 0))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg("R2"), agg("R3")
GOVT = re.compile(r"^(Government|Govt|Dr\. B\.R\. Ambedkar State Institute|Guru Gobind Singh Medical College|All India Institute|ESIC)", re.I)
out = []
for k in sorted(set(m) | set(l)):
    college, course, seat, cat, elig, op = k
    if k in m:
        lo, hi = m[k]
        lat = l[k][1] if k in l and l[k][1] > hi else ""
        so = ""
    else:
        lo, hi = l[k]
        lat, so = hi, "yes"
    out.append([college, course, cat, lo, hi, lat, so, seat, "Punjab", "Government" if GOVT.search(college) else "Private", "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "pb_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges")
print(collections.Counter((o[7], o[11]) for o in out).most_common(14))
print("\n".join(sorted({f"{o[9][:4]} {o[0]}" for o in out})))
