# Uttar Pradesh (DGME UP) cutoffs for the NEET College Predictor

**Current bundled data (`up_2025.csv`) is interim:** 2025 round 1 + 2 closing ranks for the
46 government / autonomous MBBS colleges, copied from a published college-wise table
(`source_2025.csv`), because upneet.gov.in could not be reached to download the official
2026 allotment PDFs. No private colleges, no BDS, no 2026 ranks yet.

    python build_up.py source_2025.csv ../../data/predictor/up_2025.csv

## Replacing it with official 2026 data

1. From upneet.gov.in download the 2026 MBBS/BDS seat allotment results (rounds 1, 2, mop-up,
   stray) or the opening/closing rank PDFs.
2. Convert with `../allotment_pdf_to_csv.py` (or a UP extractor like the other states).
3. Admin → College Predictor → upload: quota **Uttar Pradesh**, year **2026**, ranks =
   **NEET All India Rank**. The predictor always uses the latest year, so 2026 replaces 2025.

UP category lists: UR (open), EW (EWS), BC (OBC), SC, ST; each as OP (all) and GL (girls →
eligibility FEMALE). FF, PH and other special lists are not included.
