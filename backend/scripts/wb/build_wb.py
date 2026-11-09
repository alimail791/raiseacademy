#!/usr/bin/env python3
"""Build the West Bengal College Predictor CSV from rows.jsonl (parse_wb.py output).

Source: WBMCC UG Medical & Dental 2026 provisional allotment, online stray vacancy round — the
cumulative list of every seat holder. Status "Retained" = seat taken in rounds 1–3 (main closing
rank); "Fresh" = new in the stray round (later closing rank → borderline only). Ranks are NEET AIR.
State Quota needs WB domicile (home only); Private "UR Management Quota" is open to all states.
PwD seats hidden. NRI rows dropped.
"""
import collections, csv, json, re, sys

COLLEGES = [  # (prefix of cleaned uppercase name, display, govt)
    ("BANKURA", "Bankura Sammilani Medical College, Bankura", True),
    ("BARASAT", "Barasat Government Medical College", True),
    ("BURDWAN DENTAL", "Burdwan Dental College, Burdwan", True),
    ("BURDWAN MEDICAL", "Burdwan Medical College, Burdwan", True),
    ("CALCUTTA NATIONAL", "Calcutta National Medical College, Kolkata", True),
    ("COLLEGE OF MEDICINE AND JNM", "College of Medicine & JNM Hospital, Kalyani", True),
    ("COLLEGE OF MEDICINE AND SAGO", "College of Medicine & Sagore Dutta Hospital, Kamarhati", True),
    ("DEBEN MAHATA", "Deben Mahata Govt Medical College, Purulia", True),
    ("DIAMOND HARBOUR", "Diamond Harbour Govt Medical College", True),
    ("DR R AHMED", "Dr. R. Ahmed Dental College, Kolkata", True),
    ("ESI PGI", "ESI-PGIMSR & ESIC Medical College, Joka, Kolkata", True),
    ("GOURI DEV", "Gouri Devi Institute of Medical Sciences, Durgapur", False),
    ("GURU NANAK", "Guru Nanak Institute of Dental Sciences, Kolkata", False),
    ("HALDIA", "Haldia Institute of Dental Sciences, Haldia", False),
    ("ICARE", "ICARE Institute of Medical Sciences, Haldia", False),
    ("INSTITUTE OF PG", "IPGMER & SSKM Hospital, Kolkata", True),
    ("JAGANNATH GUPTA*NORTH", "Jagannath Gupta Institute of Medical Sciences, North Kolkata", False),
    ("JAGANNATH GUPTA", "Jagannath Gupta Institute of Medical Sciences, Budge Budge", False),
    ("JAKIR HOSAIN", "Jakir Hosain Medical College, Jangipur", False),
    ("JALPAIGURI", "Jalpaiguri Govt Medical College", True),
    ("JHARGRAM", "Jhargram Govt Medical College", True),
    ("JIS SCHOOL", "JIS School of Medical Science & Research, Howrah", False),
    ("JMN", "JMN Medical College, Chakdaha", False),
    ("KPC", "KPC Medical College, Jadavpur, Kolkata", False),
    ("KRISHNANAGAR", "Krishnanagar Institute of Medical Sciences", False),
    ("KUSUM DEV", "Kusum Devi Sunderlal Dugar Jain Dental College, Kolkata", False),
    ("MAHARA", "MJN Medical College, Cooch Behar", True),
    ("MALDA", "Malda Medical College, Malda", True),
    ("MEDICAL COLLEGE KOLKATA", "Medical College, Kolkata", True),
    ("MIDNAPORE", "Midnapore Medical College, Midnapore", True),
    ("MURSHIDABAD", "Murshidabad Medical College, Berhampore", True),
    ("NILRATAN", "Nilratan Sircar (NRS) Medical College, Kolkata", True),
    ("NORTH BENGAL DENTAL", "North Bengal Dental College, Siliguri", True),
    ("NORTH BENGAL MEDICAL", "North Bengal Medical College, Siliguri", True),
    ("PKG", "PKG Medical College, Kolkata", False),
    ("PRAFULLA", "Prafulla Chandra Sen Govt Medical College, Arambagh", True),
    ("Q CITY", "IQ City Medical College, Durgapur", False),
    ("RAIGANJ", "Raiganj Govt Medical College", True),
    ("RAMPURHAT", "Rampurhat Govt Medical College", True),
    ("RANIGANJ", "Raniganj Institute of Medical Sciences", False),
    ("RG KAR", "R.G. Kar Medical College, Kolkata", True),
    ("SANAKA", "Sanaka Institute of Dental Sciences, Durgapur", False),
    ("SANTINIKETAN", "Santiniketan Medical College, Bolpur", False),
    ("SARAT CHANDRA", "Sarat Chandra Chattopadhyay Govt Medical College, Uluberia", True),
    ("SHRI RAMKRISHNA", "Shri Ramkrishna Institute of Medical Sciences & Sanaka Hospitals, Durgapur", False),
    ("SKS", "SKS Medical College, Malda", False),
    ("TAMRALIPTO", "Tamralipto Govt Medical College, Tamluk", True),
]


def college_of(raw):
    key = re.sub(r"\s+", " ", re.sub(r"[^A-Z ]", "", raw.upper())).strip()
    key = re.sub(r"^\d*\s*", "", key)
    for pre, name, govt in COLLEGES:
        if "*" in pre:
            a, b = pre.split("*")
            if key.startswith(a) and b in key: return name, govt
        elif key.startswith(pre):
            return name, govt
    return None, None


def classify(rest):
    s = re.sub(r"\s+", " ", rest).upper().replace("EWWS", "EWS")
    if s.startswith("NRI"): return None
    pwd = "PWD" in s
    if s.startswith("PRIVATE") or "MANAGEMENT" in s:
        return ("Management quota", "OPEN", "yes", "PWD" if pwd else "")
    m = re.match(r"STATE QUOTA (UR|SC|ST|OBC|EWS)\b", s)
    if not m: return "?"
    cat = {"UR": "OPEN"}.get(m[1], m[1])
    return ("State quota", cat, "no", "PWD" if pwd else "")


bad = collections.Counter()
g = {"main": {}, "late": {}}
for line in open("rows.jsonl"):
    r = json.loads(line)
    name, govt = college_of(r["inst"])
    c = classify(r["rest"])
    if name is None or c == "?":
        bad[(r["inst"][:40], r["rest"][:40])] += 1; continue
    if c is None: continue
    k = (name, r["course"], govt) + c
    d = g["main" if r["status"] == "Retained" else "late"]
    lo, hi = d.get(k, (10**9, 0)); d[k] = (min(lo, r["rank"]), max(hi, r["rank"]))

m, l = g["main"], g["late"]
out = []
for k in sorted(set(m) | set(l)):
    college, course, govt, seat, cat, open_, elig = k
    if k in m:
        lo, hi = m[k]; lat = l[k][1] if k in l and l[k][1] > hi else ""; so = ""
    else:
        lo, hi = l[k]; lat, so = hi, "yes"
    out.append([college, course, cat, lo, hi, lat, so, seat, "West Bengal", "Government" if govt else "Private", open_, elig])
hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
with open(sys.argv[1] if len(sys.argv) > 1 else "wb_2026.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges; skipped:", sum(bad.values()))
for k, v in bad.most_common(15): print("  skip", v, k)
