# Tamil Nadu cutoffs for the NEET College Predictor

Source: tnmedicalselection.net MBBS/BDS provisional allotment lists.

1. Download the round lists: Government Quota, Management Quota and 7.5% Government School
   (the cumulative "ALLOTTED FROM / ALLOTTED TO" lists), plus any later fresh-only lists.
2. Extract each (needs `pip install pdfplumber`); file names must match `build_tn.py`:

       python extract_tn.py "GQ round 2.pdf" GQ.jsonl GQ
       python extract_tn.py "MQ round 2.pdf" MQ.jsonl MQ
       python extract_tn.py "7.5 percent.pdf" GS.jsonl GS
       python extract_tn.py "GQ later.pdf" GQ_LATE.jsonl GQ_LATE
       python extract_tn.py "MQ later.pdf" MQ_LATE.jsonl MQ_LATE

3. `python build_tn.py` → `tn_<year>.csv`
4. Admin → College Predictor → upload with quota **Tamil Nadu**, the year, round 2,
   ranks = **NEET marks**.

Matching is on NEET marks (each TN list has its own rank list). Category = community;
"Open" is estimated as the mark at the 31% position of everyone admitted to a college.
Special groups (7.5% govt school, PwD, sports, ex-servicemen, minority, NRI, ESIC) carry an
`eligibility` value and are shown only to students who say they belong to that group
(currently only the 7.5% govt-school tick box exists on the page).
