#!/usr/bin/env python3
"""Extract a Maharashtra CET Cell MBBS/BDS CAP-round provisional selection list to JSON lines.

Fixed-width text rows:
  Sr AIR NEETRoll CETForm NAME G [CandCat] [flags] SEAT-CATEGORY CODE:COLLEGE(status)
  e.g. "42 2498 3104210025 264010062 PAVANRAJE KALYAN CHAVAN M OBC OPEN (EMD) 1327:GMC CH. SAMBHAJINAGAR(Ret.)"
Long college names wrap onto following lines (appended to the previous row).
Usage: extract_mh.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
ROW = re.compile(r"^(\d+) (\d+) (\d{10}) (\d{6,10}) (.*?) ([MF]) ?(.*)$")
SKIP = re.compile(r"^(GOVERNMENT OF|State Common|Admissions to|PROVISIONAL|Note:|\d\. |per Candidate|stipulated|Updated On|Printed On|-{10}|Sr\. AIR|No\. Roll)")
recs, cur = [], None


def flush():
    if cur:
        recs.append(cur)


with pdfplumber.open(pdf_path) as pdf:
    for pno, page in enumerate(pdf.pages, 1):
        for line in (page.extract_text() or "").split("\n"):
            line = line.replace("(cid:197)", "").replace("(cid:198)", "").strip()
            if not line or SKIP.match(line):
                continue
            m = ROW.match(line)
            if m:
                flush()
                cur = {"label": label, "rank": int(m.group(2)), "gender": m.group(6), "rest": m.group(7)}
            elif cur:
                cur["rest"] += " " + line  # wrapped college name / status
        page.flush_cache()
        if pno % 200 == 0:
            print(f"{label}: page {pno}/{len(pdf.pages)} rows {len(recs)}", file=sys.stderr, flush=True)
flush()

with open(out_path, "w") as out:
    for r in recs:
        m = re.search(r"(\d{4}):(.*)$", r["rest"])
        if m:
            r["pre"] = r["rest"][: m.start()].strip()
            r["ccode"] = m.group(1)
            tail = m.group(2).strip()
            sm = re.search(r"\(([^()]*)\)\s*$", tail)
            r["status"] = sm.group(1).strip() if sm else ""
            r["college"] = re.sub(r"\s+", " ", tail[: sm.start()] if sm else tail).strip()
        else:
            r["pre"], r["ccode"], r["college"], r["status"] = r["rest"], "", "", ""
        out.write(json.dumps(r) + "\n")
print(f"{label}: {len(recs)} rows, {sum(1 for r in recs if r.get('ccode'))} with a seat", file=sys.stderr)
