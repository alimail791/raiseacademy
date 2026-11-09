# Gujarat (ACPUGMEC) cutoffs for the NEET College Predictor

1. Download ACPUGMEC's "Institutewise Admitted List For UG MBBS/BDS" PDF (final, after all rounds).
2. `python extract_gj.py admitted.pdf GJ.jsonl` (needs `pip install pdfplumber`)
3. `python build_gj.py gj_<year>.csv`
4. Admin → College Predictor → upload: quota **Gujarat**, year, round 4, ranks = **NEET All India Rank**.

GQ (Gujarat students): OP→Open, SE→SEBC, EW→EWS, SC, ST. MQ management quota → all states.
LQ local quota at NHL Ahmedabad / SMIMER Surat → tick boxes (GJ_AMD_LOCAL / GJ_SURAT_LOCAL).
NRI (NQ) and PwD (PH) hidden. Dental colleges (name has Dental/Dentistry) → BDS.
