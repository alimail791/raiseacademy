#!/usr/bin/env python3
"""Build the Karnataka College Predictor cutoff CSV from KEA allotments (AIR based).

Input: KA.jsonl from extract_ka.py (final allotment list of the latest round; it is
cumulative — "Round-1 Reported" seats plus this round's allotments).

KEA category codes = base category + suffix:
  base:   GM (general merit), 1, 2A, 2B, 3A, 3B, S1–S4 (SC groups), ST
  suffix: G general · K Kannada medium · R rural · H Kalyana-Karnataka (371J) · KH · RH
Private: GMP (Karnataka only), GMPH (Karnataka, KK region), OPN (all-India)
Management: OTH (all NEET candidates except NRI) · NRI · minority MA/MC/ME/MEH/MK/MM/MMH/MU
Special: RC1–RC9 (religious congregation), PHM (PwD), D/XD (defence), NCC, SPO (sports), JK …
"""
import collections
import csv
import json
import re
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "KA.jsonl"
out_csv = sys.argv[2] if len(sys.argv) > 2 else "ka_2026.csv"

BASE = {"GM": "OPEN", "1": "CAT-1", "2A": "2A", "2B": "2B", "3A": "3A", "3B": "3B", "S1": "S1", "S2": "S2", "S3": "S3", "S4": "S4", "ST": "ST"}
SUFFIX = {"": "", "G": "", "K": "KA_KANNADA", "R": "KA_RURAL", "H": "KA_KK", "KH": "KA_KANNADA+KA_KK", "RH": "KA_KK+KA_RURAL"}
SPECIAL = {"AGL": "ANGLO_INDIAN", "CAP": "DEFENCE", "PHM": "PWD", "D": "DEFENCE", "XD": "DEFENCE", "NCC": "NCC", "SPO": "SPORTS", "JK": "JK_MIGRANT", "CAPF": "DEFENCE", "XCAPF": "DEFENCE", "AI": "ANGLO_INDIAN"}
MINORITY = {"MA", "MC", "ME", "MEH", "MK", "MM", "MMH", "MU"}
CAT_RE = re.compile(r"^(GM|1|2A|2B|3A|3B|S1|S2|S3|S4|ST)(G|K|R|H|KH|RH)?$")


def classify(code_type, cat):
    """-> (seat_type, category, eligibility, open_to_all)"""
    if code_type == "N" or cat == "NRI":
        return ("NRI", "OPEN", "NRI", False)
    if cat == "OTH":
        return ("Management (Others)", "OPEN", "", True)
    if cat == "OPN":
        return ("Private (Open, all-India)", "OPEN", "", True)
    if cat == "GMP":
        return ("Private (Karnataka)", "OPEN", "", False)
    if cat == "GMPH":
        return ("Private (Karnataka)", "OPEN", "KA_KK", False)
    if cat in MINORITY:
        return ("Minority", "OPEN", "MINORITY", False)
    if re.fullmatch(r"RC\d+", cat):
        return ("Religious congregation", "OPEN", "MINORITY", False)
    if cat in SPECIAL:
        return ("Govt Quota", "OPEN", SPECIAL[cat], False)
    m = CAT_RE.match(cat)
    if m:
        return ("Govt Quota", BASE[m.group(1)], SUFFIX[m.group(2) or ""], False)
    return ("Other", "OPEN", "OTHER_" + cat, False)


def nice(s):
    s = re.sub(r"\s+", " ", s).strip(" ,")
    if s.isupper() or sum(c.isupper() for c in s) > 0.7 * sum(c.isalpha() for c in s):
        s = " ".join(w if len(w) <= 3 and w.isupper() and not re.search(r"[AEIOU]", w) else w.capitalize() for w in s.split())
    return s


def split_name(college):
    parts = [p.strip() for p in college.split(",")]
    name = parts[0]
    city = next((p for p in reversed(parts) if p and not re.search(r"\d", p) and len(p) < 30), "")
    return nice(name), nice(city)


rows = [json.loads(l) for l in open(src)]
names, cities, fees = collections.defaultdict(collections.Counter), collections.defaultdict(collections.Counter), collections.defaultdict(collections.Counter)
groups = {}
for r in rows:
    if not r["course"].startswith("MBBS") and not r["course"].startswith("BDS"):
        continue
    course = "BDS" if r["course"].startswith("BDS") else "MBBS"
    ccode = r["code"][:4]
    name, city = split_name(r["college"])
    names[ccode][name] += 1
    cities[ccode][city] += 1
    seat, cat, elig, op = classify(r["code"][-1], r["cat"])
    if r["fee"]:
        fees[(ccode, course, seat)][r["fee"]] += 1
    k = (ccode, course, seat, cat, elig, op)
    lo, hi = groups.get(k, (10**9, 0))
    groups[k] = (min(lo, r["rank"]), max(hi, r["rank"]))

ctype = lambda seat: {"Govt Quota": ""}.get(seat, "Private")
out = []
for (ccode, course, seat, cat, elig, op), (lo, hi) in sorted(groups.items()):
    name = names[ccode].most_common(1)[0][0]
    city = cities[ccode].most_common(1)[0][0]
    if city and city.lower().replace(" ", "") not in name.lower().replace(" ", ""):
        name = f"{name}, {city}"
    # words split across PDF lines ("Bangal Ore", "Chamarajanaga R")
    for a, b in [("Bangal Ore", "Bangalore"), ("Bang Alore", "Bangalore"), ("Bang alore", "Bangalore"), ("Chikka Ballapura", "Chikkaballapura"), ("Sceinces", "Sciences")]:
        name = name.replace(a, b)
    name = re.sub(r"(\w{3,}) ([A-Z])$", r"\1\2".lower() if False else lambda m: m.group(1) + m.group(2).lower(), name)
    name = name.rstrip(". ")
    fee = fees[(ccode, course, seat)].most_common(1)[0][0] if fees[(ccode, course, seat)] else ""
    # Govt-quota seats with the low government fee are in government colleges
    if seat == "Govt Quota":
        ct = "Government" if fee and fee <= 70000 else "Private (govt quota seat)"
    elif seat.startswith("Private"):
        ct = "Private"
    else:
        ct = "Private"
    out.append([name, course, cat, lo, hi, "", "", seat, "Karnataka", ct, "yes" if op else "no", elig, fee])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility", "annual_fee"]
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges from", len(rows), "allotments")
print(collections.Counter((o[7], o[11]) for o in out).most_common(25))
print(collections.Counter(o[2] for o in out))
unknown = {r["cat"] for r in rows if classify(r["code"][-1], r["cat"])[0] == "Other"}
print("unknown category codes:", unknown)
