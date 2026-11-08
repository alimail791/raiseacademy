#!/usr/bin/env python3
"""Extract a Kerala KEAM MBBS/BDS allotment list PDF (CEE Kerala) to JSON lines.

Handles both layouts seen in 2026:
  Phase 2: SlNo | ApplNo | Rank | College | Course | Candidate Category | Allotted Category | Option No.
  Phase 3: Sl.No | ApplNo | Rank | Candidate Category | College | Course | Seat Type | Remarks
Usage: extract_kl.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
cols, n, odd = None, 0, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for pno, page in enumerate(pdf.pages, 1):
        for table in page.extract_tables():
            for raw in table:
                row = [clean(c) for c in raw]
                if row and row[0] in ("SlNo", "Sl.No"):
                    h = [c.lower() for c in row]
                    cols = {
                        "rank": h.index("rank"),
                        "college": next(i for i, c in enumerate(h) if c.startswith("college")),
                        "course": h.index("course"),
                        "cand": h.index("candidate"),
                        "seat": next(i for i, c in enumerate(h) if c in ("allotted", "seat")),
                        "remark": h.index("remarks") if "remarks" in h else None,
                    }
                    continue
                if not cols or not re.fullmatch(r"\d+", row[0] if row else ""):
                    continue
                if len(row) != 8 or not row[cols["rank"]].isdigit():
                    odd += 1
                    continue
                college = row[cols["college"]]
                m = re.match(r"([A-Z]{2,4})-\s*(.*)", college)
                out.write(json.dumps({
                    "label": label, "rank": int(row[cols["rank"]]),
                    "ccode": m.group(1) if m else "", "college": m.group(2) if m else college,
                    "course": row[cols["course"]], "cand": row[cols["cand"]], "seat": row[cols["seat"]],
                    "remark": row[cols["remark"]] if cols["remark"] is not None else "",
                }) + "\n")
                n += 1
        page.flush_cache()
print(f"{label}: {n} rows, {odd} odd", file=sys.stderr)
