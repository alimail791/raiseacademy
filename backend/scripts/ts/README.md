# Telangana (KNRUHS) cutoffs for the NEET College Predictor

1. Download the latest-phase "COLLEGE WISE ALLOTMENT LIST" PDFs: MBBS (and BDS) Competent Authority
   quota, and MBBS/BDS Management quota (B & C/NRI). Later-phase lists include seats kept from earlier phases.
2. Extract (needs `pip install pdfplumber`):

       python extract_ts.py "CQ phase2.pdf" CQ.jsonl CQ
       python extract_ts.py "MQ phase2.pdf" MQ.jsonl MQ

3. `python build_ts.py ts_<year>.csv`
4. Admin → College Predictor → upload: quota **Telangana**, year, round 2, ranks = **NEET All India Rank**.

CQ codes CAT-GEN|FEM[-MRC]: OPEN, BC-A–E, SC-1–3, ST, EWS; FEM → FEMALE tick box; MIN, PHO, CAP, NCC,
SCL hidden. CQ seats are for Telangana locals. MQ: CTB-LOC Telangana local, CTB-UNR all-India
(shown to all states), NRI and minority hidden.
