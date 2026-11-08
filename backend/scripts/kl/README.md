# Kerala (KEAM) cutoffs for the NEET College Predictor

1. Download CEE Kerala's "KEAM <year> - ALLOTMENT TO MBBS/BDS COURSES" phase allotment lists.
2. Extract (needs `pip install pdfplumber`):

       python extract_kl.py "phase2.pdf" P2.jsonl P2
       python extract_kl.py "phase3.pdf" P3.jsonl P3

3. `python build_kl.py kl_<year>.csv` (main = P2, later rounds = P3; edit MAIN/LATER for other phases)
4. Admin → College Predictor → upload: quota **Kerala**, year, round 3, ranks = **State merit rank** (KEAM rank).

Ranks are KEAM ranks, so only Kerala students (who enter their KEAM rank) are matched.
SM-xx counts as an open seat, FL-xx as a community-xx seat; MM (Muslim minority) is matched to MU
students; AC/NC (Christian minority), NR/NM (NRI), PwD and other special seats are hidden.
