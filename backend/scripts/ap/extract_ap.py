#!/usr/bin/env python3
"""Extract Andhra Pradesh (Dr NTR UHS) MBBS/BDS college-wise allotment PDFs to JSON lines.

Columns (order varies by list): S.No | NEET RANK | NEET Roll No | Score | Name | Gender | Category | Local Area | Allotment Details | Phase
Allotment Details:
  Competent Authority: "VMCK - MBBS - SVU - SC3 - G --- 10"  (college, course, local area, seat category, G/F, option)
  Management quota:    "AGMP - MBBS - B1--2"  /  "VMCK - MBBS - C - L--1"
Usage: extract_ap.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
idx, n, odd = None, 0, 0
colleges = {}
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for pno, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""
        for m in re.finditer(r"^([A-Z]{3,5}) - (.+)$", text, re.M):  # college headings "AGMP - Anna Gowri Medical College..."
            if " - MBBS" not in m.group(0) and " - BDS" not in m.group(0):
                colleges[m.group(1)] = clean(m.group(2))
        for table in page.extract_tables():
            for raw in table:
                row = [clean(c) for c in raw if c is not None]
                if row and row[0] == "S.No.":
                    h = [c.lower() for c in row]
                    get = lambda key: next(i for i, c in enumerate(h) if key in c)
                    idx = {"rank": get("neet rank"), "cat": get("category"), "area": get("local area"),
                           "allot": get("allotment"), "phase": get("phase"), "gender": get("gender")}
                    idx["score"] = next(i for i, c in enumerate(h) if c.startswith("score"))
                    continue
                if not idx or not row or not re.fullmatch(r"\d+", row[0]):
                    continue
                if len(row) != 10:
                    odd += 1
                    continue
                a = row[idx["allot"]]
                parts = [p.strip() for p in re.split(r"\s+-\s+|\s*---\s*|--", a)]
                rec = {"label": label, "rank": int(row[idx["rank"]]), "score": int(row[idx["score"]]) if row[idx["score"]].isdigit() else None,
                       "gender": row[idx["gender"]], "cand_cat": row[idx["cat"]], "cand_area": row[idx["area"]], "phase": row[idx["phase"]],
                       "allot": a, "ccode": parts[0], "course": parts[1] if len(parts) > 1 else ""}
                out.write(json.dumps(rec) + "\n")
                n += 1
        page.flush_cache()
json.dump(colleges, open(out_path.replace(".jsonl", "_colleges.json"), "w"), indent=1)
print(f"{label}: {n} rows, {odd} odd, {len(colleges)} college headings", file=sys.stderr)
