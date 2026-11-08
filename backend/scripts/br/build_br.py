#!/usr/bin/env python3
"""Build the Bihar College Predictor cutoff CSV from BCECEB UGMAC lists (NEET AIR).

Inputs:
  ALLOT  round-2 seat allotment result PDF (one row per candidate: AIR, INSTITUTE, COURSE,
         ALLOTTED CAT, SEAT TYPE GENERAL/FEMALE SEAT, STATUS) → main closing rank
  TABLE  official "OPENING AND CLOSING RANK OF UGMAC ROUND-3" PDF → later-rounds closing rank
Categories: UR (open), BC, EBC, EWS, SC, ST; RCG = backward-class women's reservation (shown to
BC/EBC women); DQ, NRI, MM, SM → hidden. Govt colleges: Bihar domicile only. Private colleges'
UR seats: open to candidates from all states (UGMAC private-college rules).
Usage: build_br.py <round2_allotment.pdf> <round3_closing_table.pdf> [out.csv]
"""
import collections
import csv
import re
import sys

import pdfplumber

allot_pdf, table_pdf = sys.argv[1:3]
out_csv = sys.argv[3] if len(sys.argv) > 3 else "br_2026.csv"
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()


def course_of(c):
    c = c.replace(".", "").upper()
    return "MBBS" if c.startswith("MBBS") else "BDS" if c.startswith("BDS") else None


def key_of(name):
    return re.sub(r"[^A-Z0-9]", "", name.upper())


main = collections.defaultdict(lambda: [10**9, 0])
names = collections.defaultdict(collections.Counter)
with pdfplumber.open(allot_pdf) as pdf:
    idx = None
    for page in pdf.pages:
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if row and row[0] == "UGMAC ID":
                    idx = {k: row.index(k) for k in ("NEET AIR", "INSTITUTE", "COURSE", "ALLOTTED CAT", "SEAT TYPE")}
                    continue
                if not idx or not row or not re.fullmatch(r"\d{10,}", row[0]) or len(row) < len(idx):
                    continue
                course = course_of(row[idx["COURSE"]])
                air = row[idx["NEET AIR"]]
                if not course or not air.isdigit():
                    continue
                inst = row[idx["INSTITUTE"]]
                k = (key_of(inst), course, row[idx["ALLOTTED CAT"]].upper(), "FEMALE" in row[idx["SEAT TYPE"]].upper())
                names[key_of(inst)][inst] += 1
                lo_hi = main[k]
                lo_hi[0], lo_hi[1] = min(lo_hi[0], int(air)), max(lo_hi[1], int(air))
        page.flush_cache()

later = {}
with pdfplumber.open(table_pdf) as pdf:
    for page in pdf.pages:
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if len(row) < 6 or row[0] == "INSTITUTE" or not row[5].isdigit():
                    continue
                course = course_of(row[1])
                if not course:
                    continue
                k = (key_of(row[0]), course, row[3].upper(), row[2].upper() == "FEMALE")
                names[key_of(row[0])][row[0]] += 1
                later[k] = (int(row[4]), int(row[5]))

private = {k[0] for k in list(main) + list(later) if k[2] in ("NRI", "MM", "SM")}
private |= {k for k in names if not re.search(r"^(PDC|P\.D\.C|PMC|P\.M\.C|NMC|N\.M\.C|IGIMS|I\.G\.I\.M\.S|ANMMC|A\.N\.M\.M\.C|DMC|D\.M\.C|SKMC|S\.K\.M\.C|JLNMC|J\.L\.N\.M\.C|GMC|G\.M\.C|JKTMC|J\.K\.T\.M\.C|VIMS|V\.I\.M\.S|BMIMS|B\.M\.I\.M\.S|ESIC|AIIMS|PDCH|P\.D\.C\.H|BDCH|B\.D\.C\.H|GOVT|GOVERNMENT|SAMASTIPUR|SITAMARHI|CHHAPRA|BETTIAH|PURNEA|MADHEPURA)", max(names[k], key=names[k].get).upper().replace(" ", ""))}

CAT = {"UR": "OPEN", "BC": "BC", "EBC": "EBC", "EWS": "EWS", "SC": "SC", "ST": "ST"}


FULL = {  # official short forms → readable names
    "PMCPATNA": "Patna Medical College (PMCH), Patna", "NMCPATNA": "Nalanda Medical College (NMCH), Patna",
    "IGIMSPATNA": "IGIMS, Patna", "DMCLAHERIASARAI": "Darbhanga Medical College, Laheriasarai", "SKMCMUZAFFARPUR": "SKMCH, Muzaffarpur",
    "ANMMCGAYA": "ANMMCH, Gaya", "JLNMCBHAGALPUR": "JLNMCH, Bhagalpur", "GMCPURNEA": "Govt Medical College, Purnea", "GMCBETTIAH": "Govt Medical College, Bettiah",
    "JKTMCHMADHEPURA": "JKTMCH, Madhepura", "BMIMSPAWAPURINALANDA": "BMIMS Pawapuri, Nalanda", "KMCKATIHAR": "Katihar Medical College, Katihar",
    "NMCHSASARAM": "Narayan Medical College, Sasaram", "PDCPATNA": "Patna Dental College, Patna", "ESICMCHBIHTAPATNA": "ESIC Medical College, Bihta, Patna",
}
ACRO = {"ESIC", "RDJM", "MGMMC", "LSK", "PS", "NH", "MC", "BDS", "INST.", "AIIMS", "(G)"}


def nice(n):
    n = re.sub(r"\s+", " ", n).strip(" ,")
    if key_of(n) in FULL:
        return FULL[key_of(n)]
    parts = [p.strip() for p in n.split(",") if p.strip()]
    parts = [re.sub(r"\s*-?\s*\d{6}$", "", p) for p in parts]
    if len(parts) > 2:
        parts = [parts[0], parts[-1]]
    n = ", ".join(p for p in parts if p)
    words = []
    for w in n.split(" "):
        if w.upper() in ACRO or ("." in w and len(w) <= 8 and w.upper() == w and w.count(".") >= 2):
            words.append(w.upper())
        elif w.upper() in ("AND", "OF", "THE"):
            words.append(w.lower())
        else:
            words.append(w[:1].upper() + w[1:].lower() if w.isupper() or w[:1].islower() else w)
    n = " ".join(words)
    n = re.sub(r"Gaya-dobhi Road.*", "Gaya", n).replace("Hos,", "Hospital,").replace("Inst. of", "Institute of").replace("Inst. Of", "Institute of")
    return n


rows = []
for k in sorted(set(main) | set(later)):
    ckey, course, cat, female = k
    is_priv = ckey in private
    if cat in ("DQ", "NRI", "MM", "SM"):
        cats, elig, seat = [("OPEN", {"DQ": "SPECIAL", "NRI": "NRI"}.get(cat, "MINORITY"))], None, "Special"
    elif cat == "RCG":
        cats, seat = [("BC", "FEMALE"), ("EBC", "FEMALE")], "State quota · backward-class women (RCG)"
    elif cat in CAT:
        cats, seat = [(CAT[cat], "FEMALE" if female else "")], ("Private (UR, all-India)" if is_priv and cat == "UR" else "State quota") + (" · women" if female else "")
    else:
        cats, seat = [("OPEN", "SPECIAL")], "Special"
    name = nice(max(names[ckey], key=names[ckey].get))
    if k in main:
        lo, hi = main[k]
        lat = later[k][1] if k in later and later[k][1] > hi else ""
        so = ""
    else:
        lo, hi = later[k]
        lat, so = hi, "yes"
    open_all = is_priv and cat == "UR"
    for c, e in cats:
        rows.append([name, course, c, lo, hi, lat, so, seat, "Bihar", "Private" if is_priv else "Government", "yes" if open_all else "no", e])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(rows)
print(len(rows), "buckets,", len({r[0] for r in rows}), "colleges; main buckets", len(main), "later", len(later))
print(collections.Counter((r[7], r[11]) for r in rows).most_common(12))
print("\n".join(sorted({f"{r[9][:4]} {r[0]}" for r in rows})))
