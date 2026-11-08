# Maharashtra (State CET Cell) cutoffs for the NEET College Predictor

1. Download the "PROVISIONAL SELECTION LIST ONLY FOR MBBS/BDS COURSES – CAP ROUND n" PDFs
   (each list shows every candidate's current seat after that round).
2. Extract (needs `pip install pdfplumber`; run the big files one at a time — memory):

       python extract_mh.py "CAP round 2.pdf" R2.jsonl R2
       python extract_mh.py "CAP round 3.pdf" R3.jsonl R3

3. `python build_mh.py mh_<year>.csv` (main = R2, later rounds = R3; edit MAIN/LATER for other rounds)
4. Admin → College Predictor → upload: quota **Maharashtra**, year, round 3, ranks = **NEET All India Rank**.

Seat strings: OPEN/OBC/SC/ST/VJA/NTB/NTC/NTD/SEBC/EWS, women's seats "(W)" or "W" (FEMALE), Hilly
Area seats "H…" (MH_HILLY), "EM…" = reserved seat taken by a merit reserved candidate (same
category). I.Q. (institutional quota) and AIQ seats are open to all states; minority, defence, PwD,
orphan and MKB seats are hidden. College codes 1xxx = MBBS, 2xxx = BDS.
