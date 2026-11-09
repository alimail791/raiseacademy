#!/usr/bin/env python3
"""Extract the Gujarat ACPUGMEC "Institutewise Admitted List For UG MBBS/BDS" PDF to JSON lines.

Institute heading: "AMED B. J Medical College Ahmedabad"  (code ending MED = MBBS, DEN = BDS)
Row: SR [F] NAME MERITNO [CATMERIT] SCORE ADMCAT SEATTYPE AIQRANK PERCENTILE
  e.g. "8 F MAKHIJANI REESHIKA SUNIL 44 653 OP GQ 1270 99.9361"
       "19 SISARA YUVRAJ VASHARAMBHAI 59 SE-5 646 OP GQ 1718 99.9112"
Usage: extract_gj.py <pdf> <out.jsonl>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path = sys.argv[1:3]
HEAD = re.compile(r"^([A-Z]{2,8}(?:MED|DEN|DNT|MD|DN))\s+(.+)$")
ROW = re.compile(r"^(\d+)\s+(F\s+)?(.+?[A-Z.)])\s*(\d+(?:\.\d+)?)\s+(?:([A-Z]{2,4}-[\d.]+)\s+)?(\d{2,3})\s+([A-Z]{2,6}?)\s*(GQ|MQ|LQ|NQ|PH)\s+(\d+)\s+([\d.]+)$")
code = name = ""
expect_head = False
n, miss = 0, []
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for page in pdf.pages:
        for line in (page.extract_text() or "").split("\n"):
            line = line.strip()
            m = ROW.match(line)
            if m and code:
                out.write(json.dumps({"code": code, "college": name, "female": bool(m.group(2)), "merit": m.group(4),
                                      "catmerit": m.group(5) or "", "score": int(m.group(6)), "cat": m.group(7),
                                      "seat": m.group(8), "rank": int(m.group(9))}) + "\n")
                n += 1
                continue
            if line.startswith("Institutewise Admitted List"):
                expect_head = True
                continue
            if expect_head:
                expect_head = False
                h = re.match(r"^([A-Z0-9]{2,12})\s+(.+)$", line)
                if h:
                    code, name = h.group(1), h.group(2).strip()
                    continue
            if re.match(r"^\d+\s", line) and not line.startswith(("1 ", )) is None:
                pass
            if re.match(r"^\d+\s+\D", line):
                miss.append(line)
        page.flush_cache()
print(f"{n} rows; unparsed numbered lines: {len(miss)}", file=sys.stderr)
for l in miss[:8]:
    print("  ?", l, file=sys.stderr)
