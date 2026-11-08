#!/usr/bin/env python3
"""Build the Andhra Pradesh College Predictor cutoff CSV (NEET AIR based).

Inputs (extract_ap.py output), all "final" lists that show the phase each seat was taken in:
  CQ.jsonl   MBBS Competent Authority (govt) quota, phase III final
  MQ.jsonl   MBBS Management quota, phase III
  BMQ3.jsonl BDS Management quota, phase III
Main closing rank = seats taken in phases 1–2; later closing rank = phase 3.

CQ seat = LOCAL AREA - CATEGORY - G/F [- MRC] [CON]
  AU / SVU local-area seats (AP_AU / AP_SVU), UR = unreserved (any AP candidate)
  F = women-only (FEMALE); PH, NCC, CAP, SG, BSG, PMC, ANGLO, MINORITY = special → hidden
MQ: B1 all-India · B2 AP only · CA-SF AP only (new govt colleges, self-finance)
    C / CA-NRI NRI → hidden · "C - L" / "CA-NRI - L" lapsed NRI seats → open to all
"""
import collections
import csv
import json
import re
import sys

import pdfplumber

PDFS = sys.argv[1:] if len(sys.argv) > 1 else []
FILES = {"CQ": "CQ.jsonl", "MQ": "MQ.jsonl", "BMQ3": "BMQ3.jsonl"}
CATS = {"OC": "OPEN", "EWS": "EWS", "BCA": "BC-A", "BCB": "BC-B", "BCC": "BC-C", "BCD": "BC-D", "BCE": "BC-E", "SC1": "SC-1", "SC2": "SC-2", "SC3": "SC-3", "ST": "ST"}
SPECIAL = {"PH": "PWD", "NCC": "NCC", "CAP": "DEFENCE", "SG": "SPORTS", "BSG": "SCOUTS", "PMC": "SPECIAL"}


def seat_code(allot):
    s = re.sub(r"^[A-Z]+ - (MBBS|BDS) - ", "", allot)
    return re.sub(r"\s*(---|--)\s*\d+$", "", s).strip()


def classify(label, code):
    """-> (seat_type, category, eligibility, open_to_all)"""
    if label == "CQ":
        p = [x for x in code.split(" - ") if x]
        area, cat = p[0], p[1]
        flags = set(" ".join(p[2:]).split())
        groups = []
        if area == "AU": groups.append("AP_AU")
        if area == "SVU": groups.append("AP_SVU")
        special = next((SPECIAL[f] for f in flags if f in SPECIAL), None)
        if cat == "MINORITY": special = "MINORITY"
        if cat == "ANGLO": special = "ANGLO_INDIAN"
        if special:
            return ("Competent Authority (special)", "OPEN", special, False)
        if "F" in flags: groups.append("FEMALE")
        seat = {"AU": "Govt quota · AU local", "SVU": "Govt quota · SVU local", "UR": "Govt quota · Unreserved"}[area]
        return (seat + (" · women" if "F" in flags else ""), CATS.get(cat, cat), "+".join(sorted(groups)), False)
    c = code.replace(" ", "")
    if c == "B1": return ("Management (B1, all-India)", "OPEN", "", True)
    if c == "B2": return ("Management (B2, AP)", "OPEN", "", False)
    if c == "CA-SF": return ("Self-finance (new govt college)", "OPEN", "", False)
    if c in ("C-L", "CA-NRI-L"): return ("Management (unfilled NRI seats)", "OPEN", "", True)
    if c in ("C", "CA-NRI"): return ("NRI", "OPEN", "NRI", False)
    return ("Other", "OPEN", "SPECIAL", False)


# College names from the PDFs' headings ("ACSR Govt Medical College, Nellore" / "AGMP - Anna Gowri …")
rows = []
for label, f in FILES.items():
    for line in open(f):
        r = json.loads(line)
        r["label"] = label
        rows.append(r)
codes = {r["ccode"] for r in rows}
names = {}
for pdf in PDFS:
    with pdfplumber.open(pdf) as p:
        for page in p.pages:
            for line in (page.extract_text() or "").split("\n"):
                m = re.match(r"^([A-Z]{3,5})\s*-?\s+([A-Z][^\n]+)$", line.strip())
                if m and m.group(1) in codes and " MBBS " not in line and " BDS " not in line and not re.search(r"\d{6,}", line) \
                        and re.search(r"College|Institute|Inst\.|Sciences|School|Academy|Hospital", m.group(2)):
                    names.setdefault(m.group(1), re.sub(r"\s+", " ", m.group(2)).strip(" ,.-"))
            page.flush_cache()
# Second pass: some headings carry no code ("Government Medical College, Ongole") — a block of
# rows "XXXX - MBBS - …" belongs to the most recent college-name line above it.
HEAD = re.compile(r"^(?:[A-Z]{3,5}\s+-?\s*)?([A-Z][A-Za-z.&,'() ]*(?:College|Institute|Inst\.|Sciences|School)[A-Za-z.&,'() \-0-9]*)$")
votes = collections.defaultdict(collections.Counter)
for pdf in PDFS:
    with pdfplumber.open(pdf) as p:
        current = None
        for page in p.pages:
            for line in (page.extract_text() or "").split("\n"):
                line = line.strip()
                m = re.search(r"\b([A-Z]{3,5}) - (MBBS|BDS) - ", line)
                if m:
                    if current:
                        votes[m.group(1)][current] += 1
                    continue
                h = HEAD.match(line)
                if h and not re.match(r"^\d", line) and "Allotment" not in line and "University" not in line[:30]:
                    current = re.sub(r"\s+", " ", h.group(1)).strip(" ,.-")
            page.flush_cache()
for c in codes:
    if c not in names and votes[c]:
        names[c] = votes[c].most_common(1)[0][0]
missing = codes - set(names)
print("colleges:", len(codes), "named:", len(names), "missing:", missing)

groups_main, groups_later = {}, {}
for r in rows:
    seat, cat, elig, op = classify(r["label"], seat_code(r["allot"]))
    course = "BDS" if r["course"].startswith("BDS") else "MBBS"
    k = (r["ccode"], course, seat, cat, elig, op)
    g = groups_later if r["phase"] == "Phase-3" else groups_main
    lo, hi = g.get(k, (10**9, 0))
    g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))


GOVT = re.compile(r"^(govt|government)|andhra medical college|guntur medical college|kurnool medical college|rangaraya|^siddhartha medical|s\.\s?v\.\s?medical|sri padmavathi medical college for women|rims", re.I)


def clean_name(n):
    n = re.sub(r"\s*-\s*\d{3}\s?\d{3}$", "", n)          # pincode
    n = re.sub(r",?\s*\d{3}\s?\d{3}$", "", n)
    n = n.replace("Rajahmahendravaram", "Rajamahendravaram").replace("PIDUGURALLA", "Piduguralla").replace("RENIGUNTA,TIRUPATI", "Renigunta, Tirupati").replace(", VSP", ", Visakhapatnam")
    for a, b in [("Sicences", "Sciences"), ("Sciencs", "Sciences"), ("Academcy", "Academy"), ("Visakhapatanm", "Visakhapatnam"), ("Rvs Inst Of", "RVS Institute of"), (" Minority", "")]:
        n = n.replace(a, b)
    return n.strip(" ,.")


out = []
for k in sorted(set(groups_main) | set(groups_later)):
    ccode, course, seat, cat, elig, op = k
    name = clean_name(names.get(ccode, ccode))
    ctype = "Government" if GOVT.search(name) else "Private"
    if k in groups_main:
        lo, hi = groups_main[k]
        later = groups_later[k][1] if k in groups_later and groups_later[k][1] > hi else ""
        stray_only = ""
    else:
        lo, hi = groups_later[k]
        later, stray_only = hi, "yes"
    out.append([name, course, cat, lo, hi, later, stray_only, seat, "Andhra Pradesh", ctype, "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
with open("ap_2026.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges from", len(rows), "allotments")
print(collections.Counter((o[7].split(" ·")[0], o[11]) for o in out).most_common(20))
print(collections.Counter(o[2] for o in out))
