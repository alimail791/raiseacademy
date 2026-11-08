# Rajasthan (NEET UG Counselling Board, SMS Medical College) cutoffs for the NEET College Predictor

1. Download the "Provisional Allotment list (MBBS & BDS Admissions, Round n)" PDFs from ug.neetrajasthan.com.
2. Extract one at a time (needs `pip install pdfplumber`):

       python extract_rj.py "round2.pdf" R2.jsonl R2
       python extract_rj.py "round3.pdf" R3.jsonl R3

3. `python build_rj.py rj_<year>.csv` (main = R2, later rounds = R3)
4. Admin → College Predictor → upload: quota **Rajasthan**, year, round 3, ranks = **NEET All India Rank**.

Allotted category = UR/OB/MB/EB/SC/ST/SA + B (general) or G (girls → FEMALE); SA = Scheduled Area
(RJ_TSP). Govt and private seats in rounds 1–2 are Rajasthan-domicile; private UR seats filled from
all states in round 3 become "Private · round 3 (all states)" rows. NRI seats and candidates with an
additional category (PwBD, ex-servicemen, WPP) are left out.
