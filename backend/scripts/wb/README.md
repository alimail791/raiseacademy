# West Bengal (WBMCC) cutoffs

Source: WB UG Medical & Dental Counselling 2026, provisional seat allotment, online stray vacancy round
(cumulative list of every seat holder, 637 pages).

The PDF uses Type 3 fonts with no text layer, so it is OCR'd:

1. Edit the PDF path in `ocr.sh`, then `./ocr.sh 1 319 & ./ocr.sh 320 637 & wait` → `txt/NNN.txt` (tesseract, 200 dpi)
2. `python3 parse_wb.py` → `rows.jsonl` (the list is sorted by AIR; a monotonic-rank check found no OCR digit errors)
3. `python3 build_wb.py wb_2026.csv`

- Ranks are NEET AIR. "Retained" = seat from rounds 1–3 → main closing rank; "Fresh" = new in stray round → later (borderline).
- State Quota (UR/OBC/SC/ST/EWS) needs WB domicile → home only. Private "UR Management Quota" → open to all states.
- PwD seats hidden; NRI dropped.
