#!/usr/bin/env python3
"""Extract allotments from one MCC NEET-UG allotment PDF into JSON lines.

Each output line: {"round": label, "rank": int, "quota": str, "inst": str, "course": str, "cat": str, "remark": str}
Only the seat allotted IN THAT ROUND is emitted (for cumulative round 2/3 files, the
latest-round columns), so every candidate-round appears once.

Usage: extract_mcc.py <pdf> <out.jsonl> <label>
"""
import json
import re
import sys

import pdfplumber

pdf_path, out_path, label = sys.argv[1:4]
clean = lambda c: re.sub(r"\s+", " ", str(c or "")).strip()

layout = None  # "flat" (SNo, Rank, Quota, Inst, Course, Cat, CandCat, Remarks[, RollNo]) or "cumulative"
rank_i = quota_i = inst_i = course_i = cat_i = rem_i = None
hdr_len = None
none_cols = []
n_out = 0
skipped = 0

with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for pno, page in enumerate(pdf.pages, 1):
        for table in page.extract_tables():
            for raw in table:
                row = [clean(c) if c is not None else None for c in raw]
                txt = [c or "" for c in row]
                # Header detection
                if "Rank" in txt and any("Institute" in c for c in txt):
                    hdr = txt
                    hdr_len = len(row)
                    none_cols = [i for i, c in enumerate(row) if c is None]
                    h = [c for c in row if c is not None]
                    if h[0] == "SNo":  # flat
                        layout = "flat"
                        quota_i = next(i for i, c in enumerate(h) if "Quota" in c)
                        inst_i = next(i for i, c in enumerate(h) if "Institute" in c)
                        course_i = next(i for i, c in enumerate(h) if c.startswith("Course"))
                        cat_i = next(i for i, c in enumerate(h) if c.startswith("Alloted Category") or c.startswith("Allotted Category"))
                        rank_i = h.index("Rank")
                        rem_i = len(h) - 1
                    else:  # cumulative: last block has Quota, Institute, Course, Cat, CandCat, Option, Remarks
                        layout = "cumulative"
                        rank_i = 0
                        rem_i = len(h) - 1
                        quota_i = max(i for i, c in enumerate(h) if "Quota" in c)
                        inst_i = max(i for i, c in enumerate(h) if "Institute" in c)
                        course_i = max(i for i, c in enumerate(h) if c.startswith("Course"))
                        cat_i = next(i for i, c in enumerate(h) if c.startswith("Alloted Category"))
                    continue
                if layout is None or not txt[0]:
                    continue
                # Normalise row width to the header without its merged (None) columns
                if hdr_len and len(row) == hdr_len and none_cols:
                    row = [c for i, c in enumerate(row) if i not in none_cols]
                row = [c or "" for c in row]
                if not re.fullmatch(r"\d+", row[rank_i] if rank_i < len(row) else ""):
                    continue  # title rows, "Round 1 / Round 2" band rows
                try:
                    quota, inst, course, cat, remark = row[quota_i], row[inst_i], row[course_i], row[cat_i], row[rem_i]
                except IndexError:
                    skipped += 1
                    continue
                if quota in ("", "-") or inst in ("", "-"):
                    continue  # no seat in this round (retained earlier seat / not allotted)
                out.write(json.dumps({"round": label, "rank": int(row[rank_i]), "quota": quota, "inst": inst, "course": course, "cat": cat, "remark": remark}) + "\n")
                n_out += 1
        page.flush_cache()
        if pno % 200 == 0:
            print(f"{label}: page {pno}/{len(pdf.pages)} rows {n_out}", file=sys.stderr, flush=True)

print(f"{label}: done, {n_out} allotments, {skipped} odd rows skipped", file=sys.stderr)
