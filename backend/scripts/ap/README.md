# Andhra Pradesh (Dr NTR UHS) cutoffs for the NEET College Predictor

1. Download the latest "College wise (Final) Allotment List" PDFs: MBBS Competent Authority (CQ),
   MBBS Management Quota, BDS Management Quota (and BDS CQ when available). The latest phase lists
   show the phase each seat was taken in, so one file per list is enough.
2. Extract (needs `pip install pdfplumber`):

       python extract_ap.py "MBBS CQ phase3.pdf" CQ.jsonl CQ
       python extract_ap.py "MBBS MQ phase3.pdf" MQ.jsonl MQ
       python extract_ap.py "BDS MQ phase3.pdf" BMQ3.jsonl BMQ3

3. `python build_ap.py "MBBS CQ phase3.pdf" "MBBS MQ phase3.pdf" "BDS MQ phase3.pdf"` → `ap_<year>.csv`
   (the PDFs are passed again to read college names from the headings)
4. Admin → College Predictor → upload: quota **Andhra Pradesh**, year, round 3, ranks = **NEET All India Rank**.

Main closing rank = seats taken in phases 1–2; phase 3 only widens the Borderline band.
CQ seats carry AU / SVU local area and women-only (F) flags → eligibility groups AP_AU, AP_SVU,
FEMALE (tick boxes). UR seats are open to any AP candidate. MQ: B1 and lapsed NRI seats ("C - L")
open to all states; B2 and CA-SF Andhra Pradesh only; NRI and special seats hidden.
