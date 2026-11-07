#!/usr/bin/env python3
"""Convert an official NEET counselling allotment / cutoff PDF into a CSV for the
College Predictor admin upload (www.yneet.in/admin/predictor).

    pip install pdfplumber
    python allotment_pdf_to_csv.py "MCC Round 3 Final Result.pdf" aiq_2026_r3.csv

Reads every table on every page, finds the header row (the first row that has a
rank column and a college/institute column), and writes all data rows under that
one header. Repeated header rows on later pages are dropped. Check the result in
the admin "Check file" step before importing.
"""
import csv
import re
import sys

try:
    import pdfplumber
except ImportError:
    sys.exit("Install pdfplumber first:  pip install pdfplumber")

RANK = re.compile(r"\b(rank|air)\b", re.I)
TEXT_SETTINGS = {"vertical_strategy": "text", "horizontal_strategy": "text"}
COLLEGE = re.compile(r"(institute|college)", re.I)


def clean(cell):
    return re.sub(r"\s+", " ", str(cell or "")).strip()


def is_header(row):
    joined = " | ".join(row)
    return bool(RANK.search(joined) and COLLEGE.search(joined))


def main(src, dst):
    header, rows = None, []
    with pdfplumber.open(src) as pdf:
        for n, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables() or page.extract_tables(TEXT_SETTINGS)  # ruled tables first, else by text alignment
            for table in tables:
                for raw in table:
                    row = [clean(c) for c in raw]
                    if not any(row):
                        continue
                    if is_header(row):
                        if header is None:
                            header = row
                        continue  # header repeated on each page
                    if header is not None and len(row) == len(header):
                        rows.append(row)
            if n % 50 == 0:
                print(f"  …page {n}, {len(rows)} rows so far", file=sys.stderr)
    if header is None:
        sys.exit("No table with a rank and a college/institute column was found.")
    with open(dst, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"Wrote {len(rows)} rows to {dst}\nColumns: {header}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
