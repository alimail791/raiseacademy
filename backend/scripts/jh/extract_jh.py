#!/usr/bin/env python3
"""Extract Jharkhand (JCECEB) state-quota MBBS/BDS provisional seat allotment PDFs to JSON lines.

Header-based: uses "CML Rank", "Allotted Institute", "Allotted Course", "Seat Opted Category" (first
occurrence = this round's allotment), "Category", "Gender". Ranks are JCECEB CML (state merit) ranks.
Usage: extract_jh.py <pdf> <out.jsonl> <label>
"""
import json, re, sys
import pdfplumber
pdf_path, out_path, label = sys.argv[1:4]
clean = lambda s: re.sub(r"\s+", " ", str(s or "")).strip()
idx, n = None, 0
with pdfplumber.open(pdf_path) as pdf, open(out_path, "w") as out:
    for page in pdf.pages:
        for t in page.extract_tables():
            for raw in t:
                row = [clean(c) for c in raw]
                if row and row[0].startswith("Sl."):
                    h = [c.lower() for c in row]
                    f = lambda key: next(i for i, c in enumerate(h) if key in c)
                    idx = {"cml": f("cml"), "inst": f("allotted institute"), "course": f("allotted course"),
                           "seat": next(i for i, c in enumerate(h) if "seat opted" in c), "cat": h.index("category"), "gender": f("gender")}
                    continue
                if not idx or not row or not row[0].isdigit() or len(row) <= max(idx.values()):
                    continue
                if not row[idx["cml"]].isdigit() or not row[idx["inst"]]:
                    continue
                out.write(json.dumps({"label": label, "rank": int(row[idx["cml"]]), "college": row[idx["inst"]], "course": row[idx["course"]],
                                      "seat": row[idx["seat"]], "cat": row[idx["cat"]], "gender": row[idx["gender"]]}) + "\n")
                n += 1
        page.flush_cache()
print(f"{label}: {n} rows", file=sys.stderr)
