# Madhya Pradesh (DME MP) cutoffs for the NEET College Predictor

1. Download the "Allotment List (Provisional) - MP State Combined NEET UG Counselling" PDFs:
   first round, second round, mop-up round.
2. Extract (needs `pip install pdfplumber`):

       python extract_mp.py "round1.pdf" R1.jsonl R1
       python extract_mp.py "round2.pdf" R2.jsonl R2
       python extract_mp.py "mopup.pdf" MU.jsonl MU

3. `python build_mp.py mp_<year>.csv` (main = rounds 1–2, later rounds = mop-up)
4. Admin → College Predictor → upload: quota **Madhya Pradesh**, year, round 3, ranks = **NEET All India Rank**.

Allotted category CAT/SUB/OP: UR (open), OBC, SC, ST, EWS; GS = government-school reservation (tick
box MP_GOVT_SCHOOL); PH, SN, FF and NRI hidden. MP-domicile allotments only.
