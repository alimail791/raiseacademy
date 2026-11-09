#!/usr/bin/env python3
"""Extract Punjab (BFUHS) MBBS/BDS round-2/3 provisional allocation PDFs to JSON lines.

Columns: Merit No | Regd No | NEET Roll | NEET Rank | Name | Father | Joined College | Joined Course |
         Joined Quota | Joined Category | Allotted College | Allotted Course | Allotted Quota | Allotted Category | Status
Emits the seat held after this round: the allotted seat if any, else the joined seat.
Usage: extract_pb.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
n = 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for page in pdf.pages:
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if len(row) != 15 or not row[0].isdigit() or not row[3].isdigit():
                    continue
                allotted = row[10] != ""
                college, course, quota, cat = (row[10:14] if allotted else row[6:10])
                if not college:
                    continue
                out.write(json.dumps({"label": label, "rank": int(row[3]), "college": college, "course": course,
                                      "quota": quota, "cat": cat, "status": row[14], "new": allotted}) + "\n")
                n += 1
        page.flush_cache()
print(f"{label}: {n} rows", file=sys.stderr)
