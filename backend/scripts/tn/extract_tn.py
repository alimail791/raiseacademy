#!/usr/bin/env python3
"""Extract Tamil Nadu MBBS/BDS allotment PDFs (tnmedicalselection) to JSON lines.

Handles the 5 layouts seen in 2026: Government Quota, Management Quota and 7.5% Govt
School lists, either cumulative (ALLOTTED FROM -> ALLOTTED TO) or fresh-only (ALLOTTED TO).
Emits the seat in "ALLOTTED TO" (the seat held after that round).

Usage: extract_tn.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
COLS = ["SNO", "GRANK", "APP. NO", "NAME", "COMMUNITY", "T.MARK", "ALLOTTED FROM", "ALLOTTED TO", "CATEGORY", "Status"]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()

layout, list_type, n_out, odd = None, "", 0, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    first = pdf.pages[0].extract_text() or ""
    m = re.search(r"\((Government Quota|Management Quota|7\.5% Reservation Government School Students)\)", first)
    list_type = {"Government Quota": "GQ", "Management Quota": "MQ"}.get(m.group(1), "GS7.5") if m else "?"
    date = (re.search(r"allotted on - ([\d.]+)", first) or [None, ""])[1]
    for pno, page in enumerate(pdf.pages, 1):
        for table in page.extract_tables():
            for raw in table:
                cells = [c for c in raw]
                head = clean(cells[0])
                if head.startswith("SNO"):
                    hdr = head.replace("ALLOTTED FROM", "ALLOTTED_FROM").replace("ALLOTTED TO", "ALLOTTED_TO").replace("APP. NO", "APP_NO")
                    toks = hdr.split()
                    names = [c.replace("_", " ").replace("APP NO", "APP. NO") for c in toks]
                    layout = [c for c in COLS if c in names]
                    continue
                if not layout or not re.fullmatch(r"\d+", clean(cells[0])):
                    continue
                row = dict(zip(layout, cells))
                if len(cells) != len(layout):
                    odd += 1
                    continue
                to = str(row.get("ALLOTTED TO") or "").strip()
                if not to or clean(to) in ("-", ""):
                    continue
                lines = [l.strip() for l in to.split("\n") if l.strip()]
                seat = lines[0]
                sm = re.match(r"([A-Z.0-9%]+)_(MBBS|BDS) \(([^)]*)\)", seat)
                if not sm:
                    odd += 1
                    continue
                out.write(json.dumps({
                    "label": label, "list": list_type, "date": date,
                    "rank": int(re.sub(r"\D", "", clean(row["GRANK"]))), "rank_raw": clean(row["GRANK"]), "mark": int(clean(row["T.MARK"])) if clean(row.get("T.MARK")).isdigit() else None,
                    "community": clean(row.get("COMMUNITY")), "quota": sm.group(1), "course": sm.group(2),
                    "ctype": {"govt": "Government", "sf": "Self-financing", "private": "Private university"}.get(re.sub(r"\W|colleges?", "", sm.group(3).lower()), clean(sm.group(3))),
                    "college": clean(" ".join(lines[1:])), "category": clean(row.get("CATEGORY")), "status": clean(row.get("Status")),
                    "from": clean(row.get("ALLOTTED FROM")),
                }) + "\n")
                n_out += 1
        page.flush_cache()
        if pno % 100 == 0:
            print(f"{label}: page {pno}/{len(pdf.pages)} rows {n_out}", file=sys.stderr, flush=True)
print(f"{label} ({list_type} {date}): done, {n_out} rows, {odd} odd rows", file=sys.stderr)
