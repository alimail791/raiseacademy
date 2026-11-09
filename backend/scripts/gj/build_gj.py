#!/usr/bin/env python3
"""Build the Gujarat College Predictor cutoff CSV (NEET AIR) from the ACPUGMEC final
"Institutewise Admitted List For UG MBBS/BDS" (extract_gj.py output GJ.jsonl).

The list shows final admissions after all rounds, so it gives one (final) closing rank.
Seat types: GQ Gujarat govt quota (categories OP→Open, SE→SEBC, EW→EWS, SC, ST) · MQ management
quota (all states) · LQ local quota at the two municipal colleges (NHL Ahmedabad → GJ_AMD_LOCAL,
SMIMER Surat → GJ_SURAT_LOCAL) · NQ NRI and PH PwD → hidden.
Course from the college name (Dental / Dentistry → BDS).
"""
import collections
import csv
import json
import re
import sys

CAT = {"OP": "OPEN", "SE": "SEBC", "EW": "EWS", "SC": "SC", "ST": "ST"}
GOVT = re.compile(r"government|gmers|^b\. ?j\. medical|municipal|esic|m\.p\.shah|pandit deendayal|narendra modi|smimer", re.I)


def classify(r):
    seat, cat = r["seat"], r["cat"]
    if seat == "NQ":
        return ("NRI", "OPEN", "NRI", False)
    if seat == "PH" or cat.endswith("PH"):
        return ("Special", "OPEN", "PWD", False)
    if seat == "MQ":
        return ("Management quota", "OPEN", "", True)
    if seat == "LQ":
        local = "GJ_SURAT_LOCAL" if "Surat" in r["college"] else "GJ_AMD_LOCAL"
        return ("Local quota (municipal)", CAT.get(cat, "OPEN"), local, False)
    return ("Govt quota", CAT.get(cat, cat), "", False)


def nice(n):
    n = re.sub(r"\s+", " ", n).strip()
    if n.isupper():
        n = " ".join(w if w in ("ESIC",) else w.capitalize() for w in n.split())
    for a, b in [("Colege", "College"), ("Post. Limda Dist. Vadodara", "Limda, Vadodara"), ("B. J Medical", "B. J. Medical"),
                 (" Ahmedabad", ", Ahmedabad"), (" Surat", ", Surat"), (" Vadodara", ", Vadodara"), (" Rajkot", ", Rajkot"), (" Jamnagar", ", Jamnagar"),
                 (" Bhavnagar", ", Bhavnagar"), (" Nadiad", ", Nadiad"), (" Gandhinagar", ", Gandhinagar"), (" Visnagar", ", Visnagar"), (" Daman", ", Daman")]:
        n = n.replace(a, b)
    return re.sub(r",\s*,", ",", n).replace("(SMIMER), Surat", "(SMIMER), Surat")


g = {}
for line in open("GJ.jsonl"):
    r = json.loads(line)
    course = "BDS" if re.search(r"dental|dentistry", r["college"], re.I) else "MBBS"
    k = (nice(r["college"]), course) + classify(r)
    lo, hi = g.get(k, (10**9, 0))
    g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))

out = []
for (college, course, seat, cat, elig, op), (lo, hi) in sorted(g.items()):
    out.append([college, course, cat, lo, hi, "", "", seat, "Gujarat", "Government" if GOVT.search(college) else "Private", "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "gj_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges")
print(collections.Counter((o[1], o[7], o[11]) for o in out).most_common(12))
print("\n".join(sorted({f"{o[9][:4]} {o[1]} {o[0]}" for o in out})))
