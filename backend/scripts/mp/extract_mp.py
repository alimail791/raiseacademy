#!/usr/bin/env python3
"""Extract Madhya Pradesh (DME MP) combined NEET UG counselling allotment PDFs to JSON lines.

Header row "S.No | NEET roll | name | … NEET UG 2026 AI Rank … | MP DOMICILE | ELIGIBLE CATEGORY |
  [per round: ALLOTTED INSTITUTE TYPE | ALLOTTED COURSE | ALLOTTED COLLEGE | ALLOTTED CATEGORY/CLASS] … | STATUS …"
Emits the latest seat held (last round block that is not NOT ALLOTTED).
Usage: extract_mp.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
idx, n = None, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for page in pdf.pages:
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if row and row[0].upper() in ("S.NO", "S.NO."):
                    h = [c.upper() for c in row]
                    blocks = [i for i, c in enumerate(h) if c.startswith("ALLOTTED INSTITUTE")]
                    idx = {"air": next(i for i, c in enumerate(h) if "AI" in c and "RANK" in c),
                           "dom": next(i for i, c in enumerate(h) if "DOMICILE" in c),
                           "elig": next(i for i, c in enumerate(h) if "ELIGIBLE" in c), "blocks": blocks}
                    continue
                if not idx or not row or not row[0].isdigit() or len(row) <= max(idx["blocks"]) + 3:
                    continue
                seat = None
                for b in reversed(idx["blocks"]):
                    typ, course, college, cat = row[b:b + 4]
                    if typ and "NOT" not in typ.upper():
                        seat = (typ, course, college, cat)
                        break
                if not seat or not row[idx["air"]].isdigit():
                    continue
                out.write(json.dumps({"label": label, "rank": int(row[idx["air"]]), "dom": row[idx["dom"]], "elig": row[idx["elig"]],
                                      "type": seat[0], "course": seat[1], "college": seat[2], "cat": seat[3]}) + "\n")
                n += 1
        page.flush_cache()
print(f"{label}: {n} rows", file=sys.stderr)
