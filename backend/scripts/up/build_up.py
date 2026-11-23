"""Uttar Pradesh (DGME UP) cutoffs for the NEET College Predictor.

Input: a CSV of published college-wise closing ranks with columns
    college, category, r1, r2
where category is the UP list code (UROP, BCGL, …) and r1/r2 are the round 1 and
round 2 closing ranks (NEET All India Rank). Blank = no seat in that round.

    python build_up.py source_2025.csv up_2025.csv

Main closing rank = round 2 when present, else round 1 (source has no opening ranks). A round-2 value under a third of round 1 is treated as a typo and dropped.
OP lists are open to all genders; GL lists are girls' seats (eligibility FEMALE).
"""
import csv
import re
import sys

CATS = {"UR": "OPEN", "EW": "EWS", "BC": "OBC", "SC": "SC", "ST": "ST"}


def num(v):
    v = re.sub(r"[^\d]", "", v or "")
    return int(v) if v else None


def main(src, out):
    rows = []
    with open(src, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            code = r["category"].strip().upper()
            cat, lst = CATS.get(code[:2]), code[2:]
            if not cat or lst not in ("OP", "GL"):
                continue
            r1, r2 = num(r["r1"]), num(r["r2"])
            if r1 and r2 and r2 < r1 / 3:
                r2 = None  # obvious misprint in the source table
            closing = r2 or r1
            if not closing:
                continue
            college = r["college"].strip()
            girls = lst == "GL"
            rows.append({
                "college": college,
                "course": "MBBS",
                "category": cat,
                "opening_rank": "",  # source gives closing ranks only
                "closing_rank": closing,
                "stray_closing_rank": "",
                "stray_only": "",
                "seat_type": "State quota · girls" if girls else "State quota",
                "college_state": "Uttar Pradesh",
                "college_type": "ESIC" if college.startswith("ESIC") else "Government",
                "open_to_all": "no",
                "eligibility": "FEMALE" if girls else "",
            })
    rows.sort(key=lambda x: (x["college"], x["seat_type"], x["category"]))
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} rows, {len({r['college'] for r in rows})} colleges -> {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
