# Punjab (BFUHS Faridkot) cutoffs for the NEET College Predictor

1. Download BFUHS "Provisional allocation of MBBS/BDS seats" PDFs for rounds 2 and 3 (they carry
   the NEET rank; the round-1 list only has the state merit number, so it is not used).
2. Extract (needs `pip install pdfplumber`):

       python extract_pb.py "round2.pdf" R2.jsonl R2
       python extract_pb.py "round3.pdf" R3.jsonl R3

3. `python build_pb.py pb_<year>.csv` (main = round 2 holdings, later rounds = round 3)
4. Admin → College Predictor → upload: quota **Punjab**, year, round 3, ranks = **NEET All India Rank**.

Govt and management quota → Punjab students (Backward Area / Border Area as tick boxes); Open quota
"Open" and AIQ seats → all states; minority, NRI and special categories hidden.
