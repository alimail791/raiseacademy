"""Uttar Pradesh (DGME UP) cutoffs for the NEET College Predictor.

Two published inputs (NEET All India Rank, MBBS), converted to the predictor's CSV:

    python build_up.py source_2026_open.csv ../../data/predictor/up_2026.csv
    python build_up.py source_2025.csv      ../../data/predictor/up_2025.csv

source_2026_open.csv  college, r1, r2, r3 — 2026 general-merit (open) closing ranks per round.
    Closing rank = the deepest of the rounds (each round's figure is the last rank newly
    admitted that round). Government seats = UP domicile only; private colleges are open
    to all states in UP counselling.
source_2025.csv       college, category, r1, r2 — 2025 govt-college category lists (UROP,
    BCGL …). Closing = round 2, else round 1. OP = all, GL = girls (eligibility FEMALE).
    The predictor uses these only for categories the 2026 file lacks (EWS/OBC/SC/ST).

Neither source gives opening ranks. A round-2 value under a third of round 1 is a
misprint and is dropped.
"""
import csv
import re
import sys

CATS = {"UR": "OPEN", "EW": "EWS", "BC": "OBC", "SC": "SC", "ST": "ST"}

# 2025 source names -> the names used in the 2026 file, so one college = one name.
NAMES = {
    "King George's Medical University (KGMU), Lucknow": "King George Medical University, Lucknow",
    "Motilal Nehru Medical College, Prayagraj": "Moti Lal Nehru Medical College, Prayagraj",
    "Ganesh Shankar Vidyarthi Memorial Medical College, Kanpur": "Ganesh Shanker Vidharthi Memorial Medical College, Kanpur",
    "Baba Raghav Das Medical College, Gorakhpur": "Baba Raghavdas Medical College, Gorakhpur",
    "Uttar Pradesh University of Medical Sciences, Saifai (Etawah)": "Uttar Pradesh University of Medical Sciences, Saifai, Etawah",
}

GOVT = re.compile(r"^(Government|Autonomous State|King George|Dr\. Ram Manohar|Ganesh Shanker|Moti Lal|Lala Lajpat|Baba Raghav|Sarojini Naidu|Maharani Laxmibai|Uttar Pradesh University|Fulan Singh|Kalpnath Rai)", re.I)


def num(v):
    v = re.sub(r"[^\d]", "", v or "")
    return int(v) if v else None


def row(college, cat, closing, private=False, girls=False):
    esic = college.startswith("ESIC")
    return {
        "college": college,
        "course": "MBBS",
        "category": cat,
        "opening_rank": "",
        "closing_rank": closing,
        "stray_closing_rank": "",
        "stray_only": "",
        "seat_type": "Private college" if private else ("State quota · girls" if girls else "State quota"),
        "college_state": "Uttar Pradesh",
        "college_type": "ESIC" if esic else ("Private" if private else "Government"),
        "open_to_all": "yes" if private else "no",
        "eligibility": "FEMALE" if girls else "",
    }


def build_2026(reader):
    out = []
    for r in reader:
        ranks = [x for x in (num(r["r1"]), num(r["r2"]), num(r["r3"])) if x]
        if not ranks:
            continue
        college = r["college"].strip()
        private = not (GOVT.match(college) or college.startswith("ESIC"))
        out.append(row(college, "OPEN", max(ranks), private=private))
    return out


def build_2025(reader):
    out = []
    for r in reader:
        code = r["category"].strip().upper()
        cat, lst = CATS.get(code[:2]), code[2:]
        if not cat or lst not in ("OP", "GL"):
            continue
        r1, r2 = num(r["r1"]), num(r["r2"])
        if r1 and r2 and r2 < r1 / 3:
            r2 = None
        closing = r2 or r1
        if not closing:
            continue
        college = NAMES.get(r["college"].strip(), r["college"].strip())
        out.append(row(college, cat, closing, girls=lst == "GL"))
    return out


def main(src, dest):
    with open(src, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = build_2026(reader) if "r3" in reader.fieldnames else build_2025(reader)
    rows.sort(key=lambda x: (x["college"], x["seat_type"], x["category"]))
    with open(dest, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} rows, {len({r['college'] for r in rows})} colleges -> {dest}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
