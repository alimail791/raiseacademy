# Karnataka (KEA) cutoffs for the NEET College Predictor

1. Download KEA's "UGNEET MEDICAL <n> ROUND FINAL SEAT ALLOTMENT LIST" PDF (latest round; it
   is cumulative). Add the DENTAL list the same way when available.
2. `python extract_ka.py "allotment.pdf" KA.jsonl`  (needs `pip install pdfplumber`)
3. `python build_ka.py KA.jsonl ka_<year>.csv`
4. Admin → College Predictor → upload: quota **Karnataka**, year, round, ranks = **NEET All India Rank**.

KEA codes = base category (GM, 1, 2A, 2B, 3A, 3B, S1–S4, ST) + suffix (G, K Kannada medium,
R rural, H Kalyana-Karnataka, KH, RH). Suffixes become `eligibility` groups (KA_KANNADA,
KA_RURAL, KA_KK) shown only when the student ticks them. OPN (private, all-India) and OTH
(management) are open to students from every state; GMP/government seats need Karnataka eligibility.
