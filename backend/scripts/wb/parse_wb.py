#!/usr/bin/env python3
"""Parse tesseract OCR text (txt/NNN.txt) of the WB UG Medical & Dental 2026 stray-round
cumulative allotment list → rows.jsonl (rank, institute, course, quota+category text, status)."""
import glob, json, re
ROW = re.compile(r"^(?:\d{1,3} )?(\d{2,7})(?: \d{1,2})? (.+?) (MBBS|BDS|M[A-Za-z]{2,3}|B[DO]S) ((?:State|Private|NRI|Open|Central|ESI|Mana).*?) (Retained|Fresh)\s*$")
TAIL = re.compile(r"\s*\b(Management|Quota|Layer\)?|\(Non-Creamy|Allotment)\b.*$")
SKIP = re.compile(r"^(PROVISIONAL|\(WB|UR=|ALL INDIA|RANK|\d+$)")
rows, cur = [], None
for f in sorted(glob.glob("txt/*.txt")):
    for line in open(f):
        line = re.sub(r"\s+", " ", line.replace("|", " ")).strip()
        line = re.sub(r"^(Online )?Stray ", "", line)
        line = re.sub(r"^Vacancy ?", "", line)
        if not line: continue
        if SKIP.match(line):
            if re.match(r"^(PROVISIONAL|ALL INDIA)", line): cur = None
            continue
        m = ROW.match(line)
        if m:
            course = "BDS" if m[3].upper().startswith("B") else "MBBS"
            cur = {"rank": int(m[1]), "inst": [m[2]], "course": course, "rest": m[4], "status": m[5], "page": f[4:7]}
            rows.append(cur); continue
        if cur is None: continue
        if re.search(r"\bManagement\b|Quota|Layer\)", line):
            cur["rest"] += " " + re.sub(r"^.*?(?=\bManagement\b|\b\w+ Quota|Layer\)|\(Non)", "", line)
        part = TAIL.sub("", line).strip()
        if part: cur["inst"].append(part)
with open("rows.jsonl", "w") as o:
    for r in rows:
        r["inst"] = " ".join(r["inst"]); o.write(json.dumps(r) + "\n")
print(len(rows), "rows")
