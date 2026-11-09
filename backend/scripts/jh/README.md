# Jharkhand (JCECEB) cutoffs

Source: JCECEB 2026 UG Medical counselling, state-quota allotment lists, rounds 1 and 2.

1. `python3 extract_jh.py <round1.pdf> R1.jsonl R1` and `python3 extract_jh.py <round2.pdf> R2.jsonl R2` → `R1.jsonl`, `R2.jsonl`
2. `python3 build_jh.py jh_2026.csv`

- Ranks are JCECEB **CML (state merit list) ranks**, not NEET AIR → `rankType: STATE`, matched only for Jharkhand students.
- Main closing rank = round 1; round 2 = later (borderline only).
- MBBS + BDS only (B.H.M.S. dropped). PwD seats hidden; Primitive Tribe seats → `JH_PTG` tick box.
- The separate "All India seats" lists use their own merit list and are not used.
