#!/usr/bin/env python3
"""Extract a Rajasthan NEET UG counselling (SMS Medical College board) allotment PDF to JSON lines.

Uses the table header to find: Domicile, Considered Category, Additional Category, "Round N Allotted
Category" (or "Category Allotted"), COURSE, "Round N Allotted College (Seat Type)", NEET AIR.
Usage: extract_rj.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
idx, n, odd = None, 0, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for pno, page in enumerate(pdf.pages, 1):
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if row and row[0] == "S. No.":
                    h = [c.lower() for c in row]
                    find = lambda *keys: next((i for i, c in enumerate(h) if all(k in c for k in keys)), None)
                    idx = {
                        "air": find("neet", "india") if find("neet", "india") is not None else find("neet air"),
                        "dom": find("domicile"), "cat": find("considered"), "add": find("additional", "verified"),
                        "allot_cat": find("allotted", "category") if find("round", "allotted", "category") is None else find("round", "allotted", "category"),
                        "course": find("course"), "college": find("allotted", "college"), "gender": find("gender"),
                    }
                    continue
                if not idx or not row or not row[0].isdigit() or idx["air"] is None or len(row) <= max(v for v in idx.values() if v is not None):
                    continue
                air = re.sub(r"\D", "", row[idx["air"]])
                college = row[idx["college"]]
                if not air or not college or college in ("--", "-"):
                    continue
                m = re.match(r"(.*)\(([^()]*)\)\s*$", college)
                out.write(json.dumps({
                    "label": label, "rank": int(air), "gender": row[idx["gender"]],
                    "dom": row[idx["dom"]] if idx["dom"] is not None else "",
                    "cand_cat": row[idx["cat"]], "add": row[idx["add"]] if idx["add"] is not None else "",
                    "cat": row[idx["allot_cat"]], "course": row[idx["course"]],
                    "college": clean(m.group(1)) if m else college, "seat": clean(m.group(2)) if m else "",
                }) + "\n")
                n += 1
        page.flush_cache()
        if pno % 200 == 0:
            print(f"{label}: page {pno}/{len(pdf.pages)} rows {n}", file=sys.stderr, flush=True)
print(f"{label}: done, {n} rows", file=sys.stderr)
