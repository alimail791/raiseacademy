#!/usr/bin/env python3
"""Extract a Karnataka (KEA) UGNEET seat allotment list PDF to JSON lines.

Columns: SL.NO | All India Rank | Course Code | College | Course Name | Allotted Category | Course_fees | Status
Usage: extract_ka.py <pdf> <out.jsonl>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path = sys.argv[1:3]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
n, odd = 0, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    title = clean(pdf.pages[0].extract_text())
    m = re.search(r"(\d)(?:st|nd|rd|th) ROUND", title)
    rnd = int(m.group(1)) if m else 0
    for pno, page in enumerate(pdf.pages, 1):
        for table in page.extract_tables():
            for row in table:
                if len(row) != 8 or not re.fullmatch(r"\d+", clean(row[0])):
                    if row and re.fullmatch(r"\d+", clean(row[0])):
                        odd += 1
                    continue
                _, air, code, college, course, cat, fee, status = [clean(c) for c in row]
                if not re.fullmatch(r"\d+", air):
                    odd += 1
                    continue
                out.write(json.dumps({"round": rnd, "rank": int(air), "code": code, "college": college, "course": course,
                                      "cat": cat, "fee": int(fee) if fee.isdigit() else None, "status": status}) + "\n")
                n += 1
        page.flush_cache()
        if pno % 100 == 0:
            print(f"page {pno}/{len(pdf.pages)} rows {n}", file=sys.stderr, flush=True)
print(f"done: round {rnd}, {n} rows, {odd} odd", file=sys.stderr)
