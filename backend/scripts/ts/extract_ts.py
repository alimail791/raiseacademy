#!/usr/bin/env python3
"""Extract Telangana (KNRUHS) college-wise MBBS/BDS allotment lists (text layout) to JSON lines.

  COLL :: OMCH - OSMANIA MEDICAL COLLEGE, HYDERABAD          (or "APLO(041) - …")
  CRS :: MBBS - BACHELOR OF MEDICINE …
  RANK ROLL NAME [LOC] CAT SX [flags…] ADM-DETAILS
ADM details: competent authority "OPEN-GEN-P1", "SC2-FEM-P1", "BCB-FEM-CAP-MRC-P1";
management quota "CTB-UNR-OPEN-GEN-P1", "CTB-LOC-OPEN-GEN-P2", "NRI-UNR-OPEN-GEN-P1".
Usage: extract_ts.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
ROW = re.compile(r"^(\d+)\s+(\d{9,10})\s+(.+?)\s+([A-Z0-9]+(?:-[A-Z0-9]+)*-P\d)\s*$")
college = course = ""
n = 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for page in pdf.pages:
        for line in (page.extract_text() or "").split("\n"):
            line = line.strip()
            m = re.match(r"^COLL\s*::\s*([A-Z0-9]+)(?:\(\d+\))?\s*-\s*(.+)$", line)
            if m:
                college = f"{m.group(1)}|{m.group(2).strip()}"
                continue
            m = re.match(r"^CRS\s*::\s*([A-Z]+)", line)
            if m:
                course = m.group(1)
                continue
            m = ROW.match(line)
            if m and college:
                mid = m.group(3).split()
                sx_i = max((i for i, t in enumerate(mid) if t in ("M", "F")), default=None)
                rec = {"label": label, "rank": int(m.group(1)), "college": college, "course": course, "adm": m.group(4),
                       "sx": mid[sx_i] if sx_i is not None else "", "cat": mid[sx_i - 1] if sx_i else "",
                       "loc": mid[sx_i - 2] if sx_i and sx_i >= 2 and mid[sx_i - 2] in ("OU", "AU", "SVU", "NL") else "",
                       "flags": mid[sx_i + 1:] if sx_i is not None else []}
                out.write(json.dumps(rec) + "\n")
                n += 1
        page.flush_cache()
print(f"{label}: {n} rows", file=sys.stderr)
