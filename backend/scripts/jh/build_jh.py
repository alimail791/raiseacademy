#!/usr/bin/env python3
"""Build the Jharkhand College Predictor cutoff CSV from JCECEB state-quota lists (JCECEB CML rank).

  main closing rank  = round 1 allotments (R1.jsonl)
  later closing rank = round 2 allotments (R2.jsonl)
Seat opted category: UR (open), BC-I, BC-II, SC, ST, EWS; "…-Deaf/Blind/PH/…" (PwD) and Primitive
Tribe → hidden. B.H.M.S. dropped. Ranks are JCECEB CML (state merit list) ranks, so only Jharkhand
students are matched. (The separate "All India seats" lists use their own merit list and are not used.)
"""
import collections, csv, json, re, sys

NAMES = [  # (pattern in raw name, display name, government?)
    (r"^Rajendra Institute", "Rajendra Institute of Medical Sciences (RIMS), Ranchi", True),
    (r"^Dental Institute, Rajendra", "Dental Institute, RIMS, Ranchi", True),
    (r"^Mahatma Gandhi Memorial", "MGM Medical College, Jamshedpur", True),
    (r"^PHULO JHANO", "Phulo Jhano Medical College, Dumka", True),
    (r"^Shaheed Nirmal Mahto", "Shaheed Nirmal Mahto Medical College (SNMMCH), Dhanbad", True),
    (r"^SHEIKH BHIKHARI", "Sheikh Bhikhari Medical College, Hazaribagh", True),
    (r"^Medinirai", "Medinirai Medical College, Palamu", True),
    (r"^Hazaribagh College of Dental", "Hazaribagh College of Dental Sciences, Hazaribagh", False),
    (r"^Laxmi Chandravans", "Laxmi Chandravanshi Medical College, Bishrampur, Palamu", False),
    (r"^Netaji Subhas", "Netaji Subhas Medical College, Adityapur, Jamshedpur", False),
    (r"^Manipal TATA", "Manipal TATA Medical College, Jamshedpur", False),
    (r"^Birsa Institute", "Birsa Institute of Medical Sciences & Research, Khunti", False),
    (r"^Sido Kanhu", "Sido Kanhu Medical College, Dumka", False),
    (r"^Vananchal Dental", "Vananchal Dental College, Garhwa", False),
    (r"^AWADH DENTAL", "Awadh Dental College, Jamshedpur", False),
]


def college_of(raw):
    for pat, name, govt in NAMES:
        if re.search(pat, raw, re.I):
            return name, govt
    return re.sub(r"\s+", " ", raw).strip(), bool(re.search(r"govt|government", raw, re.I))


CAT = {"UR": "OPEN", "BC-I": "BC-I", "BC-II": "BC-II", "SC": "SC", "ST": "ST", "EWS": "EWS"}


def classify(seat):
    s = re.sub(r"\s+", "", seat)
    if "--" in s or re.search(r"-(Deaf|Blind|PH|Autism|Multiple)", s, re.I):
        return ("Special", "OPEN", "PWD")
    if s.lower().startswith("primitive"):
        return ("Special", "OPEN", "JH_PTG")
    return ("State quota", CAT.get(s, s), "")


unknown = collections.Counter()


def agg(label):
    g = {}
    for line in open(f"{label}.jsonl"):
        r = json.loads(line)
        course = r["course"].upper().replace(".", "")
        if course not in ("MBBS", "BDS"):
            continue
        name, govt = college_of(r["college"])
        if name == re.sub(r"\s+", " ", r["college"]).strip():
            unknown[name] += 1
        k = (name, course, govt) + classify(r["seat"])
        lo, hi = g.get(k, (10**9, 0))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg("R1"), agg("R2")
out = []
for k in sorted(set(m) | set(l)):
    college, course, govt, seat, cat, elig = k
    if k in m:
        lo, hi = m[k]; lat = l[k][1] if k in l and l[k][1] > hi else ""; so = ""
    else:
        lo, hi = l[k]; lat, so = hi, "yes"
    out.append([college, course, cat, lo, hi, lat, so, seat, "Jharkhand", "Government" if govt else "Private", "no", elig])
hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
with open(sys.argv[1] if len(sys.argv) > 1 else "jh_2026.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges; unmapped names:", dict(unknown))
for o in out:
    if o[2] in ("OPEN", "ST") and o[11] == "": print("  ", o[1], o[2], o[3], o[4], o[5], "|", o[0])
