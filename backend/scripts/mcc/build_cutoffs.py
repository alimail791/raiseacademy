#!/usr/bin/env python3
"""Build College Predictor cutoff CSVs from extracted MCC allotments.

Main closing rank          = highest rank allotted in rounds 1–2 for that college/course/seat type/category.
stray_closing_rank (later) = highest rank allotted in round 3 + Stray + Special Stray.
Seat buckets seen only in those later rounds are written with stray_only=yes.

Outputs: aiq_2026.csv (All India: open seats + restricted MCC quotas)
         dl_2026.csv  (Delhi University + IP University quota — Delhi domicile)
"""
import collections
import csv
import json
import re

MAIN = ["R1", "R2"]
STRAY = ["R3", "STRAY", "SPECIAL"]  # "later rounds": round 3 + stray + special stray

OPEN_SEATS = {"all india", "open seat quota", "deemed/paid seats quota", "self-financed merit seat", "(amu) self finance all india"}
DELHI = {"delhi university quota", "ip university quota"}

STATES = [
    ("Andhra Pradesh", r"vijayawada|ananthapur|eluru|kadapa|nandyal|paderu|piduguralla|rajamahendravaram|rajahmundry|guntur|kurnool|srikakulam|kakinada|tirupati|ongole|nellore|machilipatnam|vizianagaram|visakhapatnam|vizag|markapur|adoni|madanapalle|pulivendula|amalapuram|narsaraopet|bapatla|parvathipuram|andhra|\bA\.?P\.?\b"), ("Arunachal Pradesh", r"naharlagun|tomo riba|arunachal"), ("Assam", r"silchar|kokrajhar|nagaon|nalbari|pragjyotishpur|dhubri|barpeta|jorhat|dibrugarh|tezpur|lakhimpur|diphu|tinsukia|assam|guwahati"),
    ("Bihar", r"chapra|saran|purnia|madhepura|sitamarhi|samastipur|siwan|begusarai|vaishali|saharsa|pawapuri|bihar|patna|darbhanga|gaya|bhagalpur|muzaffarpur|purnea|bettiah|nalanda"),
    ("Chhattisgarh", r"durg|dantewada|janjgir|korba|kabeerdham|kawardha|jagdalpur|bastar|rajnandgaon|ambikapur|kanker|mahasamund|chhattisgarh|raipur|bilaspur|\(c\.?g\.?\)"), ("Goa", r"\bgoa\b"), ("Gujarat", r"gujarat|ahmedabad|surat|vadodara|baroda|rajkot|bhavnagar|jamnagar"),
    ("Haryana", r"sonepat|sonipat|bhiwani|koriawas|mahendragarh|jind|panchkula|haryana|rohtak|faridabad|gurugram|gurgaon|karnal|nuh"), ("Himachal Pradesh", r"himachal|shimla|tanda|mandi|hamirpur|chamba|nahan"),
    ("Jharkhand", r"hazaribagh|palamu|dumka|koderma|jharkhand|ranchi|dhanbad|jamshedpur|deoghar"), ("Karnataka", r"mangalur|mangaluru|bagalkot|bidar|chitradurga|bellary|ballari|gulbarga|kalaburagi|hassan|karwar|kodagu|koppal|kolar|chikkaballapur|gadag|yadgir|vijaynagar|manipal|yenepoya|moorusavirmath|chamarajanagar|mandya|raichur|tumkur|haveri|udupi|dharwad|vijayapura|bijapur|chikmagalur|chickmagalur|karkala|karnataka|bengaluru|bangalore|mysore|mysuru|hubli|belgaum|belagavi|mangalore|davangere|shimoga|shivamogga"),
    ("Kerala", r"kochi|cochin|elamkara|parippally|kasaragod|malappuram|kerala|thiruvananthapuram|trivandrum|kozhikode|calicut|thrissur|kottayam|alappuzha|ernakulam|kannur|kollam|palakkad|manjeri|idukki|wayanad|pathanamthitta"),
    ("Madhya Pradesh", r"datia|satna|seoni|shahdol|vidisha|sundarlal patwa|mandsaur|sakhlecha|neemuch|khandwa|shivpuri|chhindwara|khargone|damoh|singrauli|sidhi|\bm\.?p\.?\b|madhya pradesh|bhopal|indore|gwalior|jabalpur|rewa|sagar|ratlam|\(m\.?p\.?\)"), ("Maharashtra", r"alibag|ambernath|amravati|bhandara|buldhana|gadchiroli|hingoli|jalna|nandurbar|osmanabad|dharashiv|parbhani|sindhudurg|panvel|thane|washim|wardha|beed|ratnagiri|palghar|raigad|maharashtra|mumbai|pune|nagpur|aurangabad|nashik|solapur|kolhapur|latur|akola|gondia|miraj|sangli|yavatmal|nanded|dhule|ambajogai|chandrapur|jalgaon|baramati|satara|loni"),
    ("Manipur", r"churachandpur|manipur|imphal"), ("Meghalaya", r"meghalaya|shillong"), ("Mizoram", r"mizoram|aizawl"), ("Nagaland", r"nagaland|kohima"),
    ("Odisha", r"phulbani|kandhamal|jajati keshari|bolangir|keonjhar|sundargarh|jajpur|talcher|odisha|orissa|bhubaneswar|cuttack|berhampur|burla|balasore|koraput|baripada"),
    ("Punjab", r"ludhiana|jalandhar|kapurthala|punjab|amritsar|patiala|faridkot|mohali|bathinda"), ("Rajasthan", r"baran|bundi|dausa|dholpur|hanumangarh|jaisalmer|jhunjhunu|karauli|nagaur|sirohi|chittorgarh|tonk|sawai madhopur|banswara|bhilwara|pratapgarh, raj|rajsamand|jalore|ganganagar|rajasthan|jaipur|jodhpur|udaipur|bikaner|ajmer|kota|jhalawar|alwar|sikar|bharatpur|barmer|pali|dungarpur|churu"),
    ("Sikkim", r"sikkim|gangtok"), ("Tamil Nadu", r"chettinad|cuddalore|chidambaram|annamalai|omandurar|thiruvannamalai|thiruvarur|vels|\bt\.?n\b|pallavaram|tamil ?nadu|chennai|madurai|coimbatore|tirunelveli|salem|thanjavur|trichy|tiruchirap|vellore|kanyakumari|villupuram|perambalur|karur|erode|dharmapuri|sivaganga|theni|pudukkottai|tiruvarur|chengalpattu|thoothukudi|tuticorin|namakkal|nagapattinam|krishnagiri|kallakurichi|ariyalur|dindigul|virudhunagar|nilgiris|ooty|tiruppur|ramanathapuram|tenkasi|kanchipuram|tiruvannamalai|kumbakonam"),
    ("Telangana", r"jayashankar|bhupalpally|jogulamba|jogulumba|gadwal|mahabubabad|mulugu|narsampet|ramagundam|yadadri|bhongir|kothagudem|asifabad|narayanpet|medchal|quthbullapur|maheshwaram|telangana|hyderabad|secunderabad|warangal|nizamabad|karimnagar|khammam|siddipet|nalgonda|suryapet|mahabubnagar|sircilla|adilabad|sangareddy|mancherial|jagtial|wanaparthy|nagarkurnool|kamareddy|bhadradri|vikarabad|jangaon|medak|nirmal"),
    ("Tripura", r"tripura|agartala"), ("Uttar Pradesh", r"pilibhit|sonebhadra|varansi|koriawas|saharanpur|mahatma vidur|bijnor|lalitpur|mirzapur|uttar pradesh|lucknow|kanpur|agra|meerut|allahabad|prayagraj|varanasi|gorakhpur|jhansi|aligarh|bareilly|saifai|noida|kushinagar|rae ?bareli|ayodhya|azamgarh|banda|basti|firozabad|bahraich|shahjahanpur|ambedkar nagar|kannauj|jalaun|orai|hardoi|etah|fatehpur|deoria|mirzapur|pratapgarh|sultanpur|ghazipur|jaunpur|lalitpur|siddharth|bijnor|chandauli|amethi|kaushambi|lakhimpur|bulandshahr|auraiya|mainpuri|sonbhadra|gonda|\bu\.?p\.?\b"),
    ("Uttarakhand", r"uttarakhand|dehradun|rishikesh|haldwani|srinagar garhwal|almora|rudrapur|haridwar"), ("West Bengal", r"west bengal|kolkata|calcutta|\bw\.?b\.?\b|burdwan|bardhaman|bankura|midnapore|medinipur|malda|murshidabad|siliguri|darjeeling|coochbehar|cooch behar|purulia|raiganj|rampurhat|jhargram|tamluk|diamond harbour|barasat|uluberia|arambagh|howrah|jalpaiguri|krishnanagar"),
    ("Delhi", r"new delhi|\bdelhi\b"), ("Jammu & Kashmir", r"handwara|udhampur|kupwara|jammu|kashmir|srinagar|anantnag|baramulla|doda|kathua|rajouri"), ("Puducherry", r"puducherry|pondicherry|karaikal"),
    ("Chandigarh", r"chandigarh"), ("Andaman & Nicobar", r"andaman|port blair"), ("Dadra & Nagar Haveli", r"silvassa|dadra"),
]
SHORT = r"durg|saran|baran|gaya|pali|sagar|kota|rewa|nuh|loni|beed|tonk|mandi|theni|erode|karur|salem|hassan|vels|bundi|korba|jind|siwan|damoh|sidhi|datia|tezpur|diphu|seoni|satna|ongole|adoni|bapatla|medak|nirmal|jangaon|banda|basti|etah|orai|gonda|amethi|deoria|kannauj|mainpuri|auraiya|hardoi|kollam|kannur|idukki|goa|pune|akola|latur|dhule|miraj|sangli|satara|wardha|washim|panvel|thane|raigad|beed|alwar|sikar|churu|ajmer|pali|bikaner|chamba|mandi|nahan|tanda|una|jammu|doda|kathua|ranchi|gangtok|aizawl|kohima|imphal|shillong|agartala|silchar|nagaon|jorhat|dhubri|barpeta|nalbari"
SHORT_SET = set(SHORT.split("|"))
def compile_state(p):
    parts = [x for x in p.split("|") if x]
    return re.compile("|".join((rf"\b{x}\b" if x in SHORT_SET else rf"\b{x}") if not x.startswith("\\") and not x.startswith("(") else x for x in parts), re.I)
STATES = [(n, compile_state(p)) for n, p in STATES]

clean_ws = lambda s: re.sub(r"\s+", " ", s).strip()


def short_name(inst):
    s = clean_ws(inst)
    return clean_ws(re.split(r"\s,|,(?=\S)", s, maxsplit=1)[0]).rstrip(" ,.")


squash = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())


def key_of(inst, name):
    # name + start of the address, so same-named colleges in different cities stay apart,
    # while spacing/line-wrap differences between rounds don't matter
    return squash(inst)[: len(squash(name)) + 30]


def second_part(inst):
    parts = re.split(r"\s,|,(?=\S)", clean_ws(inst))
    return clean_ws(parts[1]).title() if len(parts) > 1 else ""


CANON = {}


def seat_type(q):
    q = clean_ws(q)
    k = re.sub(r"[^a-z]", "", q.lower())
    if k in CANON:
        return CANON[k]
    q = re.sub(r"Employee s", "Employees", q)
    q = re.sub(r"\(\s*ES\s*I\s*\)|\( ESI\)", "(ESI)", q)
    CANON[k] = q
    return q


def college_type(name, st):
    n, s = name.lower(), st.lower()
    if "aiims" in n or "all india institute" in n: return "AIIMS"
    if "jipmer" in n: return "JIPMER"
    if s == "deemed/paid seats quota": return "Deemed"
    if s.startswith("self-financed") or "self finance" in s: return "Deemed / private"
    if "esic" in n or "employees state insurance" in n or "esi" in s: return "ESIC"
    if s in ("all india", "delhi university quota", "ip university quota"): return "Government"
    if s == "open seat quota": return "Central / university"
    return ""


def load(labels):
    rows = []
    for lab in labels:
        for line in open(f"{lab}.jsonl"):
            r = json.loads(line)
            course = r["course"].upper().replace(".", "").replace(" ", "")
            if course not in ("MBBS", "BDS"):
                continue
            r["course"] = course
            r["seat"] = seat_type(r["quota"])
            r["name"] = short_name(r["inst"])
            r["key"] = squash(r["name"])
            r["cat"] = clean_ws(r["cat"])
            rows.append(r)
    return rows


main_rows, stray_rows = load(MAIN), load(STRAY)
for r in main_rows + stray_rows:
    r["seat"] = seat_type(r["seat"])

# Same short name, different city (e.g. "GOVT. DENTAL COLLEGE & HOSP,AHMEDABAD" / ",MUMBAI"):
# split those groups by city; otherwise one college even if the address text varies.
city_like = lambda x: x and len(x.split()) <= 3 and squash(x) not in ("na", "")
groups = collections.defaultdict(list)
for r in main_rows + stray_rows:
    groups[r["key"]].append(r)
SPLIT = {}
for k, rs in groups.items():
    cities = {squash(second_part(r["inst"])) for r in rs if city_like(second_part(r["inst"]))}
    if len(cities) > 1:
        SPLIT[k] = sorted(cities)
for r in main_rows + stray_rows:
    if r["key"] in SPLIT:
        sp = squash(second_part(r["inst"]))
        city = sp if sp in SPLIT[r["key"]] else next((c for c in SPLIT[r["key"]] if c in squash(r["inst"])), SPLIT[r["key"]][0])
        r["key"] = r["key"] + "|" + city
print("same-name colleges split by city:", {k: v for k, v in SPLIT.items()})
names = collections.defaultdict(collections.Counter)
seconds = collections.defaultdict(collections.Counter)
texts = collections.defaultdict(str)
for r in main_rows + stray_rows:
    names[r["key"]][r["name"]] += 1
    texts[r["key"]] += " " + clean_ws(r["inst"])
    seconds[r["key"]][second_part(r["inst"])] += 1
short_count = collections.Counter(names[k].most_common(1)[0][0].lower() for k in names)


def display(key):
    n = names[key].most_common(1)[0][0]
    if short_count[n.lower()] > 1:
        extra = seconds[key].most_common(1)[0][0]
        if extra:
            n = f"{n}, {extra}"
    return n


def state_of(key):
    t = texts[key]
    for n, rx in STATES:
        if rx.search(t):
            return n
    return ""


def agg(rows):
    g = {}
    for r in rows:
        k = (r["key"], r["course"], r["seat"].lower(), r["cat"])
        lo, hi, seat = g.get(k, (10**9, 0, r["seat"]))
        g[k] = (min(lo, r["rank"]), max(hi, r["rank"]), seat)
    return g


m, s = agg(main_rows), agg(stray_rows)
out = {"aiq": [], "dl": []}
for k in sorted(set(m) | set(s)):
    key, course, seat_l, cat = k
    seat = (m.get(k) or s.get(k))[2]
    name = display(key)
    target = "dl" if seat_l in DELHI else "aiq"
    open_all = "yes" if seat_l in OPEN_SEATS else "no"
    if k in m:
        lo, hi, _ = m[k]
        stray_hi = s[k][1] if k in s else ""
        row = [name, course, cat, lo, hi, stray_hi, "", seat, state_of(key), college_type(name, seat), open_all]
    else:
        lo, hi, _ = s[k]
        row = [name, course, cat, lo, hi, hi, "yes", seat, state_of(key), college_type(name, seat), open_all]
    out[target].append(row)

hdr = ["college", "course", "category", "opening_rank", "closing_rank", "stray_closing_rank", "stray_only", "seat_type", "college_state", "college_type", "open_to_all"]
for t, rows in out.items():
    with open(f"{t}_2026.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(hdr); w.writerows(rows)
    print(t, len(rows), "buckets,", len({r[0] for r in rows}), "colleges")
print("main allotments", len(main_rows), "stray allotments", len(stray_rows))
nostate = sorted({display(k) for k in names if not state_of(k)})
print("colleges with no state detected:", len(nostate), "of", len(names))
open("nostate.txt", "w").write("\n".join(nostate))
dups = collections.Counter(display(k).lower() for k in names)
print("display-name duplicates:", [n for n, c in dups.items() if c > 1][:20])
