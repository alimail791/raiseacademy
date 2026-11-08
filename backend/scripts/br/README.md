# Bihar (BCECEB UGMAC) cutoffs for the NEET College Predictor

1. Download from bceceboard.bihar.gov.in: the round-2 "SEAT ALLOTTMENT RESULT OF UGMAC" PDF and the
   "OPENING AND CLOSING RANK OF UGMAC ROUND-3" PDF (or the latest two rounds).
2. `python build_br.py round2_allotment.pdf round3_closing.pdf br_<year>.csv` (needs `pip install pdfplumber`)
3. Admin → College Predictor → upload: quota **Bihar**, year, round 3, ranks = **NEET All India Rank**.

Main closing rank = round-2 allotment; the official round-3 table widens the Borderline band.
Categories UR (open), BC, EBC, EWS, SC, ST; women's seats → FEMALE; RCG (backward-class women)
shown to BC/EBC women. Govt colleges: Bihar domicile only; private colleges' UR seats open to all
states. DQ, NRI and minority seats hidden.
