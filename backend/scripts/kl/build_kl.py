#!/usr/bin/env python3
"""Build the Kerala College Predictor cutoff CSV from KEAM MBBS/BDS allotments (KEAM rank).

Main closing rank  = Phase 2 allotment list (cumulative after phases 1–2)
Later closing rank = Phase 3 list (only widens the Borderline band)

Seat types (allotted category):
  SM state merit (open) · EZ MU BH LA DV VK BX KN KU SC ST EW community seats
  SM-xx = open seat held by a community-xx student (counted as open)
  FL-xx = community-xx seat "floated" to another college (counted as community xx)
  AM  = 15% all-India merit seats in self-financing colleges (Keralites + other states)
  MM  = Muslim-minority community seats (Muslim students)
  AC/NC Christian minority, NR/NM NRI, PD PwD, others special → hidden (eligibility)
"""
import collections
import csv
import json
import re
import sys

MAIN, LATER = ["P2"], ["P3"]
COMMUNITY = {"EZ", "MU", "BH", "LA", "DV", "VK", "BX", "KN", "KU", "SC", "ST"}
SPECIAL = {"AC": "MINORITY", "NC": "MINORITY", "NR": "NRI", "NM": "NRI", "PD": "PWD", "DA": "PWD", "XS": "EX_SERVICEMEN",
           "SD": "SPORTS", "PT": "SPECIAL", "PI": "SPECIAL", "CC": "SPECIAL", "DK": "SPECIAL", "NQ": "SPECIAL", "DM": "SPECIAL"}
cat_of = lambda c: "EWS" if c == "EW" else c


def classify(seat):
    """-> (seat_type, category, eligibility, open_to_all)"""
    s = seat.replace("#", "").strip()
    if s == "SM" or s.startswith("SM-"):
        return ("State Merit", "OPEN", "", False)
    if s.startswith("FL-"):
        return ("State Merit", cat_of(s[3:]), "", False)
    if s == "EW":
        return ("State Merit", "EWS", "", False)
    if s in COMMUNITY:
        return ("State Merit", s, "", False)
    if s == "AM":
        return ("All-India merit (self-financing)", "OPEN", "", True)
    if s == "MM":
        return ("Muslim minority", "MU", "", False)
    return ("Special", "OPEN", SPECIAL.get(s, "SPECIAL"), False)


def load(labels):
    out = []
    for lab in labels:
        for line in open(f"{lab}.jsonl"):
            r = json.loads(line)
            r["seat_type"], r["cat"], r["elig"], r["open"] = classify(r["seat"])
            out.append(r)
    return out


def nice(name):
    name = re.sub(r"\s+", " ", name).strip(" .,")
    for a, b in [("Accademy", "Academy"), ("Medi Science", "Medical Science"), ("DentalCollege", "Dental College"), ("Kozikkode", "Kozhikkode"), ("TVPM", "Thiruvananthapuram"), ("Insitute", "Institute"), ("Scinces", "Sciences"), ("Institue", "Institute"), ("Thrisur", "Thrissur")]:
        name = name.replace(a, b)
    return name


main, later = load(MAIN), load(LATER)
names = collections.defaultdict(collections.Counter)
for r in main + later:
    names[r["ccode"]][nice(r["college"])] += 1


def agg(rows):
    g = {}
    for r in rows:
        k = (r["ccode"], r["course"], r["seat_type"], r["cat"], r["elig"], r["open"])
        lo, hi = g.get(k, (10**9, 0))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg(main), agg(later)
rows = []
for k in sorted(set(m) | set(l)):
    ccode, course, seat, cat, elig, op = k
    name = names[ccode].most_common(1)[0][0]
    ctype = "Government" if re.search(r"\bgovt\b|government", name, re.I) else "Self-financing"
    if k in m:
        lo, hi = m[k]
        later_hi = l[k][1] if k in l and l[k][1] > hi else ""
        stray_only = ""
    else:
        lo, hi = l[k]
        later_hi, stray_only = hi, "yes"
    rows.append([name, course, cat, lo, hi, later_hi, stray_only, seat, "Kerala", ctype, "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "kl_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(rows)
print(len(rows), "buckets,", len({r[0] for r in rows}), "colleges; main", len(main), "later", len(later))
print(collections.Counter((r[7], r[11]) for r in rows).most_common(12))
print(collections.Counter(r[2] for r in rows))
