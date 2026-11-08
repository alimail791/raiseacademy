#!/usr/bin/env python3
"""Build the Rajasthan College Predictor cutoff CSV (NEET AIR) from the NEET UG counselling board lists.

  main closing rank  = Round 2 list (seats held after rounds 1–2)
  later closing rank = Round 3 list
Allotted category = CAT + B (general seat) / G (girls' seat): UR, OB (OBC), MB (MBC), EB (EWS), SC, ST,
SA (Scheduled Area / TSP → RJ_TSP). Seat type from the college name suffix: Government, General
(private), Management, NRI (hidden).
Candidates with an additional category (PwBD, EXS…, WPP…) or NRI are left out of the cutoffs.
Government/General/Management seats are Rajasthan-domicile; in round 3, private General/Management
UR seats were filled from all states → extra rows "Private · round 3 (all states)", open to all.
"""
import collections
import csv
import json
import re
import sys

CAT = {"UR": "OPEN", "OB": "OBC", "MB": "MBC", "EB": "EWS", "SC": "SC", "ST": "ST", "SA": "OPEN"}


def bucket(r):
    m = re.fullmatch(r"(UR|OB|MB|EB|SC|ST|SA)([BG])", r["cat"])
    if not m or r["seat"] == "NRI" or r["add"] not in ("--", ""):
        return None
    if r.get("dom") and r["dom"] != "Rajasthan":
        return None  # out-of-state students: counted only in the round-3 "all states" rows (or special quotas)
    groups = (["RJ_TSP"] if m.group(1) == "SA" else []) + (["FEMALE"] if m.group(2) == "G" else [])
    seat = {"Government": "Govt", "General": "Private (general)", "Management": "Management quota"}.get(r["seat"], r["seat"])
    seat += (" · scheduled area" if m.group(1) == "SA" else "") + (" · girls" if m.group(2) == "G" else "")
    return seat, CAT[m.group(1)], "+".join(sorted(groups))


def nice(n):
    n = n.replace("SURENDERA DENTAL COLLEGE & RESEARCH INSTITUTE, SRI GANGANAGAR", "Surendera Dental College & Research Institute, Sri Ganganagar")
    return n.replace("Shri jagannath", "Shri Jagannath").replace("American Int. Inst. of Med. Sc.", "American International Institute of Medical Sciences").replace(" ,", ",")


def load(label):
    return [json.loads(l) for l in open(f"{label}.jsonl")]


r2, r3 = load("R2"), load("R3")
names = collections.Counter()
govt = set()
for r in r2 + r3:
    if r["seat"] == "Government":
        govt.add(r["college"])


def agg(rows, only_out_of_state=False):
    g = {}
    for r in rows:
        b = bucket(r)
        if not b:
            continue
        course = "BDS" if r["course"].upper().startswith("BDS") else "MBBS"
        k = (r["college"], course) + b
        lo, hi = g.get(k, (10**9, 0))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg(r2), agg(r3)
# Round 3: private UR seats filled from all states
allind = {}
for r in r3:
    if r["seat"] in ("General", "Management") and r["cat"] in ("URB", "URG") and r["add"] in ("--", "") and r["dom"] and r["dom"] != "Rajasthan":
        course = "BDS" if r["course"].upper().startswith("BDS") else "MBBS"
        k = (r["college"], course)
        lo, hi = allind.get(k, (10**9, 0))
        allind[k] = (min(lo, r["rank"]), max(hi, r["rank"]))

out = []
for k in sorted(set(m) | set(l)):
    college, course, seat, cat, elig = k
    ctype = "Government" if college in govt else "Private"
    if k in m:
        lo, hi = m[k]
        lat = l[k][1] if k in l and l[k][1] > hi else ""
        so = ""
    else:
        lo, hi = l[k]
        lat, so = hi, "yes"
    out.append([nice(college), course, cat, lo, hi, lat, so, seat, "Rajasthan", ctype, "no", elig])
for (college, course), (lo, hi) in sorted(allind.items()):
    out.append([nice(college), course, "OPEN", lo, hi, hi, "yes", "Private · round 3 (all states)", "Rajasthan", "Government" if college in govt else "Private", "yes", ""])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "rj_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges; all-states private rows", len(allind))
print(collections.Counter((o[7], o[11]) for o in out).most_common(14))
print(collections.Counter(o[2] for o in out))
