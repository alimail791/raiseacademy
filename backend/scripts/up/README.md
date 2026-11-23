# Uttar Pradesh (DGME UP) cutoffs for the NEET College Predictor

upneet.gov.in could not be reached, so the bundled data is built from published
college-wise closing ranks (NEET All India Rank, MBBS):

| File | What | Used for |
| --- | --- | --- |
| `up_2026.csv` ← `source_2026_open.csv` | 2026 rounds 1–3 open-seat closing ranks, 45 govt + 2 ESIC + 41 private colleges | everyone (private colleges also for other states) |
| `up_2025.csv` ← `source_2025.csv` | 2025 rounds 1–2 govt category lists (UR/EWS/OBC/SC/ST, open + girls) | EWS/OBC/SC/ST students only, shown as 2025 |

    python build_up.py source_2026_open.csv ../../data/predictor/up_2026.csv
    python build_up.py source_2025.csv      ../../data/predictor/up_2025.csv

The predictor uses the latest year; for categories that year lacks it falls back to the
previous year's rows for that quota (`latestDatasets` → `fallback`). No BDS, no opening ranks.

## Replacing it with official 2026 data

Download the 2026 MBBS/BDS allotment results from upneet.gov.in, convert with
`../allotment_pdf_to_csv.py`, and upload in Admin → College Predictor: quota **Uttar Pradesh**,
year **2026**, round 3, ranks = **NEET All India Rank** (replace existing). Once the 2026
upload has the reserved categories, the 2025 fallback stops being used automatically.
