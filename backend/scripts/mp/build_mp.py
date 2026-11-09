#!/usr/bin/env python3
"""Build the Madhya Pradesh College Predictor cutoff CSV (NEET AIR) from DME MP counselling lists.

  main closing rank  = round 1 allotments + seats held after round 2 (R1.jsonl, R2.jsonl)
  later closing rank = mop-up round (MU.jsonl)
Allotted category "CAT/SUB/OP": CAT = UR (open), OBC, SC, ST, EWS; SUB = X (none), GS (govt-school
reservation → MP_GOVT_SCHOOL tick box), PH (PwD), SN, FF (freedom fighter) → hidden; NRI → hidden.
Seats are for MP-domicile students (non-domicile allotments are negligible and left out).
"""
import collections
import csv
import json
import re
import sys

CAT = {"UR": "OPEN", "OBC": "OBC", "SC": "SC", "ST": "ST", "EWS": "EWS"}
SPECIAL = {"PH": "PWD", "SN": "SPECIAL", "FF": "SPECIAL"}


def classify(r):
    if r["cat"] == "NRI":
        return ("NRI", "OPEN", "NRI")
    parts = r["cat"].split("/")
    cat, sub = parts[0], parts[1] if len(parts) > 1 else "X"
    seat = "Govt college" if r["type"].upper() == "GOVT" else "Private college"
    if sub in SPECIAL:
        return ("Special", "OPEN", SPECIAL[sub])
    if sub == "GS":
        return (seat + " · govt-school quota", CAT.get(cat, cat), "MP_GOVT_SCHOOL")
    return (seat, CAT.get(cat, cat), "")


KEEP = {"AND", "OF", "THE", "FOR", "&"}
CITY_FIX = {"BHOPAL": "Bhopal", "INDORE": "Indore"}


def nice(n):
    n = re.sub(r"\s+", " ", n).strip()
    words = []
    for w in n.split(" "):
        if w in ("AND", "OF", "THE", "FOR"):
            words.append(w.lower())
        elif w in ("RKDF", "LN", "SAMC", "CDSR", "MGM", "NSCB", "AIIMS", "ESIC", "RD", "IMS", "LNCT", "SRI", "SSU"):
            words.append(w if w not in ("SRI",) else "Sri")
        else:
            words.append(w.capitalize())
    n = " ".join(words)
    n = n.rstrip(",").replace("Acadamy", "Academy").replace("Mgu Hospital", "MGU Hospital")
    return re.sub(r",+", ",", re.sub(r"\b(Bhopal|Indore|Jabalpur|Gwalior|Rewa|Sagar|Ujjain|Dewas|Sehore|Ratlam|Vidisha|Shivpuri|Khandwa|Datia|Shahdol|Chhindwara|Satna|Damoh|Mandsaur|Neemuch|Singrauli|Seoni|Sidhi|Khargone|Burhanpur|Guna|Rajgarh|Mandla|Sheopur|Shajapur|Katni|Bhind|Morena|Tikamgarh|Chhatarpur|Narsinghpur|Hoshangabad|Narmadapuram|Jhabua|Dhar|Betul|Balaghat|Panna|Umaria|Anuppur|Dindori|Alirajpur|Barwani|Ashoknagar|Agar|Niwari|Harda|Raisen)$", r", \1", n).replace(" ,", ","))


def agg(labels):
    g = {}
    for lab in labels:
        for line in open(f"{lab}.jsonl"):
            r = json.loads(line)
            if r["dom"].upper() != "YES":
                continue
            course = "BDS" if r["course"].upper().startswith("BDS") else "MBBS"
            k = (nice(r["college"]), course, r["type"].upper() == "GOVT") + classify(r)
            lo, hi = g.get(k, (10**9, 0))
            g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg(["R1", "R2"]), agg(["MU"])
out = []
for k in sorted(set(m) | set(l)):
    college, course, govt, seat, cat, elig = k
    if k in m:
        lo, hi = m[k]
        lat = l[k][1] if k in l and l[k][1] > hi else ""
        so = ""
    else:
        lo, hi = l[k]
        lat, so = hi, "yes"
    out.append([college, course, cat, lo, hi, lat, so, seat, "Madhya Pradesh", "Government" if govt else "Private", "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "mp_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges")
print(collections.Counter((o[7], o[11]) for o in out).most_common(10))
print("\n".join(sorted({f"{o[9][:4]} {o[1]} {o[0]}" for o in out})))
