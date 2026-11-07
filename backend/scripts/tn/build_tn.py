#!/usr/bin/env python3
"""Build the Tamil Nadu College Predictor cutoff CSV (NEET marks based).

Main rounds  = the cumulative lists (seat held after the round: GQ, MQ, 7.5% govt school).
Later rounds = the fresh-only lists published afterwards (GQ_LATE, MQ_LATE).

closing_rank       = LOWEST NEET mark admitted in the main rounds (rank_type SCORE)
stray_closing_rank = lowest mark admitted in the later rounds
category           = candidate community (BC, BCM, MBC&DNC, SC, SCA, ST); Open = estimated
                     open-seat cutoff (mark at the 31% position of all admitted to that college);
                     Management Quota has no communal reservation → Open
eligibility        = special groups shown only to students who belong to them
"""
import collections
import csv
import json
import re

MAIN = ["GQ", "MQ", "GS"]
LATER = ["GQ_LATE", "MQ_LATE"]

KEEP_UPPER = {"PSG", "SRM", "KMCH", "ESIC", "ESI", "CMC", "IRT", "KAP", "ACS", "MGR", "VMKV", "SRMC", "JKKN", "RVS", "KSR", "PSP", "SBV", "CSI", "II", "III", "DR.", "MAPIMS", "AVMC", "MMC", "KMC", "SIMS", "GMKMCH"}
SMALL = {"AND", "OF", "THE", "FOR", "IN", "AT", "&"}


def nice(name):
    name = re.sub(r"\s+", " ", name).strip().rstrip(".")
    words = []
    for i, w in enumerate(name.split(" ")):
        core = re.sub(r"[^A-Z.]", "", w.upper())
        if "," in w and not w.endswith(","):
            words.append(", ".join(nice(x) for x in w.split(",") if x))
        elif w.upper() in KEEP_UPPER or core in KEEP_UPPER:
            words.append(w.upper())
        elif w.upper() in SMALL and i:
            words.append(w.lower())
        elif re.fullmatch(r"[A-Z]\.?", w) or re.fullmatch(r"([A-Z]\.){2,}", w):
            words.append(w)  # initials like "K." or "A.C.S."
        else:
            words.append(w.capitalize() if not w.startswith("(") else "(" + w[1:].capitalize())
    return " ".join(words)


def base_name(college):
    return re.sub(r"\s*\(private university\)\s*$", "", college, flags=re.I).strip()


key_of = lambda s: re.sub(r"[^a-z0-9]", "", base_name(s).lower())

COMMUNITY = {"OC": "Open", "BC": "BC", "BCM": "BCM", "MBC&DNC": "MBC&DNC", "MBC": "MBC&DNC", "SC": "SC", "SCA": "SCA", "ST": "ST"}

GQ_SPECIAL = {"PWD": "PWD", "IRT WARD": "IRT_WARD", "CMC 20%": "CMC", "SPORTS": "SPORTS", "CHILDREN OF EXSERVICEMAN": "EX_SERVICEMEN"}


def bucket(r):
    """-> (seat_type, category, eligibility, open_to_all) or None to skip"""
    if r["list"] == "GS7.5":
        return ("7.5% Govt School", COMMUNITY.get(r["community"], r["community"]), "TN_GOVT_SCHOOL", False)
    if r["quota"] == "A1" or r["ctype"] == "ESIC":
        return ("ESIC (IP quota)", "Open", "ESIC_IP", False)
    if r["quota"] == "GQ":
        spec = r["category"].upper().strip()
        elig = GQ_SPECIAL.get(spec, re.sub(r"\W+", "_", spec) if spec else "")
        cat = COMMUNITY.get(r["community"], r["community"] or "Open")
        return ("Govt Quota", cat, elig, False)
    if r["quota"] == "MQ":
        cat_l = r["category"].lower()
        if not cat_l or cat_l == "management quota":
            return ("Management Quota", "Open", "", True)
        return (f"Management Quota ({r['category']})", "Open", "MINORITY", False)
    if r["quota"] == "NRI":
        return ("NRI Quota", "Open", "NRI", False)
    return None


def load(labels):
    out = []
    for lab in labels:
        for line in open(f"{lab}.jsonl"):
            r = json.loads(line)
            if not r.get("mark"):
                continue
            b = bucket(r)
            if not b:
                continue
            r["seat"], r["cat"], r["elig"], r["open"] = b
            r["key"] = key_of(r["college"])
            r["from_key"] = key_of(re.sub(r"^\S+_(MBBS|BDS) \([^)]*\)\s*", "", r.get("from") or ""))
            out.append(r)
    return out


main, later = load(MAIN), load(LATER)

# The PDFs clip long college names (the city line is cut off). Map each clipped name to
# the one full name it starts; if several fit, use the same student's earlier-round
# seat when it shows the full name; otherwise drop the row.
allkeys = {r["key"] for r in main + later}
resolved, dropped = 0, collections.Counter()
for r in main + later:
    k = r["key"]
    longer = [K for K in allkeys if K != k and K.startswith(k)]
    if not longer:
        continue
    if len(longer) == 1:
        r["key"] = longer[0]; resolved += 1
    elif r["from_key"] in longer:
        r["key"] = r["from_key"]; resolved += 1
    else:
        r["drop"] = True; dropped[r["college"]] += 1
main = [r for r in main if not r.get("drop")]
later = [r for r in later if not r.get("drop")]
print("clipped names resolved:", resolved, "| dropped (ambiguous):", sum(dropped.values()), dict(dropped))
names = collections.defaultdict(collections.Counter)
ctypes = collections.defaultdict(collections.Counter)
for r in main + later:
    names[r["key"]][base_name(r["college"])] += 1
    ctypes[r["key"]][r["ctype"]] += 1


def agg(rows):
    g = {}
    for r in rows:
        k = (r["key"], r["course"], r["seat"], r["cat"], r["elig"])
        lo, hi, op = g.get(k, (999, 0, r["open"]))
        g[k] = (min(lo, r["mark"]), max(hi, r["mark"]), op)
    return g


m, l = agg(main), agg(later)

# Open (OC) seats: the files give the student's community, not the seat category. TN fills
# its 31% open-competition seats first on merit, so the open-seat cutoff at a college is
# the mark at the 31% position of everyone admitted there (Govt Quota and 7.5% lists).
OC_SHARE = 0.31
pool = collections.defaultdict(list)
for r in main:
    if r["seat"] in ("Govt Quota", "7.5% Govt School") and r["elig"] in ("", "TN_GOVT_SCHOOL"):
        pool[(r["key"], r["course"], r["seat"], r["elig"], r["open"])].append(r["mark"])
for (key, course, seat, elig, op), marks in pool.items():
    marks.sort(reverse=True)
    n_oc = max(1, round(OC_SHARE * len(marks)))
    k = (key, course, seat, "Open", elig)
    m[k] = (marks[n_oc - 1], marks[0], op)
rows = []
for k in sorted(set(m) | set(l)):
    key, course, seat, cat, elig = k
    full = [n for n in names[key] if key_of(n) == key] or list(names[key])
    name = nice(max(full, key=lambda n: names[key][n]))
    name = re.sub(r"\s+,", ",", name).rstrip(" ,")
    name = re.sub(r",(\S)", lambda m: ", " + m.group(1).upper(), name)
    name = re.sub(r", (\w)", lambda m: ", " + m.group(1).upper(), name)
    ctype = ctypes[key].most_common(1)[0][0]
    if k in m:
        lo, hi, op = m[k]
        later_lo = l[k][0] if k in l else ""
        stray_only = ""
    else:
        lo, hi, op = l[k]
        later_lo, stray_only = lo, "yes"
    # closing_rank = lowest mark admitted, opening_rank = highest mark admitted
    rows.append([name, course, cat, hi, lo, later_lo, stray_only, seat, "Tamil Nadu", ctype, "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
with open("tn_2026.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(hdr)
    w.writerows(rows)
print(len(rows), "buckets,", len({r[0] for r in rows}), "colleges, main allotments", len(main), "later", len(later))
print(collections.Counter((r[7], r[11]) for r in rows).most_common(20))
print(collections.Counter(r[2] for r in rows))
