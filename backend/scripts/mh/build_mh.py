#!/usr/bin/env python3
"""Build the Maharashtra College Predictor cutoff CSV from CET Cell CAP lists (NEET AIR).

Each CAP list shows every candidate's current seat after that round, so:
  main closing rank  = Round 2 list (seats held after rounds 1–2)
  later closing rank = Round 3 list (only widens the Borderline band)

Seat strings (end of each row, before CODE:COLLEGE):
  [H][EM]<CAT>[W] [(W)] [(EMD)|(EMR)] [MINO]   CAT = OPEN OBC SC ST VJA NTB NTC NTD SEBC EWS
    H = Hilly Area seat (MH_HILLY), W / (W) = women's seat (FEMALE), EM… = reserved seat taken by a
    merit reserved candidate (same category), MINO = minority (hidden)
  I.Q. = institutional quota (private colleges; open to all states) · I.Q. MINO hidden
  DEF1–3 defence, PWD-… / PEM … PH PwD, Orphan…, MKB → special (hidden)
College code 1xxx = MBBS, 2xxx = BDS.
"""
import collections
import csv
import json
import re
import sys

MAIN, LATER = ["R2"], ["R3"]
CAT = {"OPEN": "OPEN", "OBC": "OBC", "SC": "SC", "ST": "ST", "VJA": "VJ-A", "NTB": "NT-B", "NTC": "NT-C", "NTD": "NT-D", "SEBC": "SEBC", "EWS": "EWS"}
STATUS = {"Ret.", "No Change", "No Pref", "Change", "Retained"}
SEAT_RE = re.compile(r"(H?)(EM ?)?(OPEN|OBC|SEBC|SC|ST|VJA|NTB|NTC|NTD|EWS)(W?)(?:\s*\(W\))?(\s+W)?(?:\s*\(EM[DR]\))?(\s+MINO)?\s*$")


def seat_of(pre):
    """-> (seat_type, category, eligibility, open_to_all) or None"""
    p = pre.strip()
    # names with a middle initial M/F confuse the gender column: keep only what follows the last lone M/F
    while re.search(r"(^|\s)[MF]\s", p):
        p = re.split(r"(?:^|\s)[MF]\s", p, maxsplit=1)[1]
    if "MINO" in p.split():
        return ("Minority", "OPEN", "MINORITY", False)
    if p.endswith("I.Q."):
        return ("Institutional quota", "OPEN", "", True)
    if re.search(r"\bAIQ\b", p):
        return ("All-India seats (state CAP)", "OPEN", "", True)
    if re.search(r"\bPH\b|PWD-|\bPEM\b", p):
        return ("Special", "OPEN", "PWD", False)
    if re.search(r"\bDEF\d", p):
        return ("Special", "OPEN", "DEFENCE", False)
    if re.search(r"orphan", p, re.I):
        return ("Special", "OPEN", "ORPHAN", False)
    if re.search(r"\bMKB\b", p):
        return ("Special", "OPEN", "SPECIAL", False)
    m = SEAT_RE.search(p)
    if not m:
        return None
    hilly, cat = m.group(1) == "H", CAT[m.group(3)]
    women = bool(m.group(4) or m.group(5) or "(W)" in p[m.start():])
    groups = sorted((["MH_HILLY"] if hilly else []) + (["FEMALE"] if women else []))
    seat = "State quota" + (" · hilly area" if hilly else "") + (" · women" if women else "")
    return (seat, cat, "+".join(groups), False)


ABBR = {"GMC": "Govt Medical College", "GDC": "Govt Dental College", "MC": "Medical College", "DC": "Dental College", "INST": "Institute", "MED": "Medical", "COLL": "College", "HOSP": "Hospital"}


# short words that are places / names (title-case them); other short all-caps words are acronyms
WORDS = set("PUNE BEED DHULE AKOLA NASIK LATUR THANE KALVA JUHU KHED MIRAJ JALNA NAVI NEW NERUL RURAL KUDAL PATIL PAWAR HIRE GODE KORE KAMBE SALVE TERNA NAIR TILAK SANGLI SATARA GONDIA WARDHA KARJAT YOGITA MALATI AND".split())
FIX = {"Med.col": "Medical College", "MED.": "Medical", "Col": "College", "Dr.s.c.gmc": "Dr. S.C. Govt Medical College", "Vvpf's": "VVPF's",
       "Ch.sambhajinagar": "Ch. Sambhajinagar", "Ahilyanagar(a'nagar)": "Ahilyanagar", "A'nagar": "Ahilyanagar", "Sevagram,wardha": "Sevagram, Wardha",
       "Islampur,sangli": "Sangli", "Yeotmal": "Yavatmal", "Nashik Nandihills": "Nashik", "Ab Vajpayee": "AB Vajpayee"}


def nice(name):
    name = re.sub(r"\s+", " ", name).strip(" ,")
    out = []
    for w in name.split(" "):
        core = w.strip(",")
        if core in ABBR:
            out.append(w.replace(core, ABBR[core]))
        elif core.isupper() and len(re.sub(r"[^A-Z]", "", core)) <= 5 and core not in WORDS and core.isalpha():
            out.append(w)  # acronym: GSMC, BJMC, ESIC, MGIMS …
        else:
            out.append(w.capitalize() if w.isupper() or w.istitle() else w)
    n = " ".join(out)
    for a, b in FIX.items():
        n = re.sub(r"(?<![\w.'])" + re.escape(a) + r"(?![\w])", b, n)
    n = re.sub(r"\bMed\. COL\b", "Medical College", n, flags=re.I)
    n = re.sub(r"\bSmt\.s\.n\.katkade\b", "Smt. S.N. Katkade", n)
    n = re.sub(r"\bV\.d\.", "V.D.", n)
    n = re.sub(r"\bPims Islampur Islampur\b", "PIMS Islampur", n)
    return re.sub(r"\s+", " ", n).strip()


def load(labels):
    rows, bad = [], collections.Counter()
    for lab in labels:
        for line in open(f"{lab}.jsonl"):
            r = json.loads(line)
            if not r["ccode"]:
                continue
            college = r["college"]
            if r["status"] and r["status"] not in STATUS and not r["status"].startswith(("Ret", "No ")):
                college = f"{college}({r['status']})"  # a bracket that is part of the name, e.g. (A'NAGAR)
            s = seat_of(r["pre"])
            if not s:
                bad[r["pre"]] += 1
                continue
            r["seat_type"], r["cat"], r["elig"], r["open"] = s
            r["course"] = "MBBS" if r["ccode"].startswith("1") else "BDS"
            r["college"] = college
            rows.append(r)
    return rows, bad


main, bad1 = load(MAIN)
later, bad2 = load(LATER)
bad = bad1 + bad2
print("unparsed seat strings:", sum(bad.values()), bad.most_common(15))
names = collections.defaultdict(collections.Counter)
private = set()
for r in main + later:
    names[r["ccode"]][r["college"]] += 1
    if r["seat_type"] in ("Institutional quota", "Minority", "All-India seats (state CAP)"):
        private.add(r["ccode"])


def agg(rows):
    g = {}
    for r in rows:
        k = (r["ccode"], r["course"], r["seat_type"], r["cat"], r["elig"], r["open"])
        lo, hi = g.get(k, (10**9, 0))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]))
    return g


m, l = agg(main), agg(later)
out = []
for k in sorted(set(m) | set(l)):
    ccode, course, seat, cat, elig, op = k
    name = nice(names[ccode].most_common(1)[0][0])
    if k in m:
        lo, hi = m[k]
        later_hi = l[k][1] if k in l and l[k][1] > hi else ""
        so = ""
    else:
        lo, hi = l[k]
        later_hi, so = hi, "yes"
    out.append([name, course, cat, lo, hi, later_hi, so, seat, "Maharashtra", "Private" if ccode in private else "Government", "yes" if op else "no", elig])

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all", "eligibility"]
out_csv = sys.argv[1] if len(sys.argv) > 1 else "mh_2026.csv"
with open(out_csv, "w", newline="") as f:
    w = csv.writer(f); w.writerow(hdr); w.writerows(out)
print(len(out), "buckets,", len({o[0] for o in out}), "colleges; main", len(main), "later", len(later))
print(collections.Counter((o[7], o[11]) for o in out).most_common(14))
print(collections.Counter(o[2] for o in out))
