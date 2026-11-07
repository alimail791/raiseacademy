# MCC cutoffs for the NEET College Predictor

Yearly refresh (after MCC counselling ends):

1. Download the MCC allotment PDFs: Round 1, Round 2, Round 3, Stray, Special Stray.
2. Extract each (needs `pip install pdfplumber`):

       python extract_mcc.py "Round 1.pdf" R1.jsonl R1
       python extract_mcc.py "Round 2.pdf" R2.jsonl R2
       python extract_mcc.py "Round 3.pdf" R3.jsonl R3
       python extract_mcc.py "Stray.pdf" STRAY.jsonl STRAY
       python extract_mcc.py "Special Stray.pdf" SPECIAL.jsonl SPECIAL

3. `python build_cutoffs.py` (in the same folder) → `aiq_<year>.csv`, `dl_<year>.csv` (update the year in the output names).
4. Admin → College Predictor → upload:
   - `aiq_*.csv`: quota **All India Quota (MCC)**, year, round 3, ranks = NEET All India Rank
   - `dl_*.csv`: quota **Delhi**, year, round 3, ranks = NEET All India Rank

Closing rank = rounds 1–2. "Round 3 / stray" closing rank = round 3 + stray + special stray
(only widens the Borderline band). Delhi University and IP University quota seats go to the Delhi file.
