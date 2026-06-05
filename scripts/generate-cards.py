#!/usr/bin/env python3
"""Generate CPC prep flash cards from raw text data."""

import json
import re

# ── PREFIXES ──────────────────────────────────────────────────────────────────
prefixes_raw = """An- - without Brady- - slow Bi- - two Uni- - one De- - from or away Dys- - difficult or painful En- - within Epi- - upon or above Hemi- - half Hyper- - excessive Hypo- - below or deficient Intra- - within Mal- - bad or abnormal Peri- - around Post- - after Pre- - before Pro- - before or forward Retro- - behind or against Sub- - below or under Supra- - above Trans- - through Poly- - many or much Olig- - scanty or little Noct- - night Tachy- - fast Brady- - slow Macro- - large Micro- - small Anti- - against Auto- - self Allo- - other or different Syn- - same or together Neo- - new Para- - beside or abnormal Peri- - around Extra- - outside Inter- - between Intra- - within Multi- - many Uni- - one Bi- - two Tri- - three Semi- - half Pan- - all Re- - again A- - without or not"""

# Parse prefixes (format: "Term- - meaning")
# Handle multiline, split by pattern: word ending in hyphen, space, dash, space, meaning
prefix_items = []
# Split by token pattern: capture term and definition
pattern = r'([A-Za-z]+-)\s*-\s*([a-z\s]+?)(?=\s+[A-Za-z]+-\s*-|$)'
matches = re.findall(pattern, prefixes_raw + ' ')
for term, defn in matches:
    prefix_items.append((term.strip(), defn.strip()))

# ── SUFFIXES ──────────────────────────────────────────────────────────────────
suffixes_raw = """-algia - pain -centesis - surgical puncture -dynia - pain -ectomy - surgical removal -emesis - vomiting -gram - record or image -graphy - process of recording or imaging -iasis - condition or formation -itis - inflammation -lith - stone -logy - study of -lysis - breakdown or destruction -megaly - enlargement -oma - tumor -orrhaphy - surgical repair or suturing -oscopy - visual examination -ostomy - creating an opening -otomy - incision or cutting into -pathy - disease -pepsia - digestion -pexy - surgical fixation -plasty - surgical repair or reconstruction -plegia - paralysis -paresis - partial paralysis -ptosis - drooping or prolapse -rrhea - flow or discharge -rrhage - excessive bleeding -sclerosis - hardening -stenosis - narrowing -stomy - creating an opening -tomy - incision -uria - urine condition -phagia - eating or swallowing -phasia - speech -esthesia - sensation or feeling -algesia - pain sensitivity -opia - vision condition -trophy - nourishment or development -genesis - origin or production -desis - surgical fusion or binding -cele - hernia or swelling -ectasis - dilation or expansion -spasm - involuntary contraction -kinesis - movement -emia - blood condition -penia - deficiency -cytosis - condition of cells -phobia - fear -mania - obsession -pnea - breathing -thorax - chest condition -cardia - heart condition -cyte - cell -blast - immature cell -clast - breaking down cell"""

suffix_items = []
pattern2 = r'(-[a-z]+)\s*-\s*([a-z\s]+?)(?=\s+-[a-z]+\s*-|$)'
matches2 = re.findall(pattern2, suffixes_raw + ' ')
for term, defn in matches2:
    suffix_items.append((term.strip(), defn.strip()))

# ── ROOT WORDS ───────────────────────────────────────────────────────────────
roots_raw = """Abdomin - abdomen Aden - gland Adren - adrenal gland Alveol - air sac in lung An - anus Angi - vessel Aort - aorta Append - appendix Arteri - artery Atri - upper heart chamber Audi - hearing Bil - bile Blephar - eyelid Bronch - bronchus airway Bronchiol - small airway Burs - bursa Calcane - heel bone Cardio - heart Carp - wrist bones Cec - cecum Cerebr - brain Cerebell - cerebellum Cervic - cervical neck or cervix Cheil - lip Chol - bile Cholangi - bile duct Cholecyst - gallbladder Choledoch - common bile duct Chondro - cartilage Cochle - cochlea hearing organ Col - colon Colp - vagina Conjunctiv - conjunctiva membrane covering eye Corne - cornea Cost - rib Crani - skull Cutane - skin Cyst - bladder Dacry - tear or lacrimal Dent - tooth Derm - skin Duoden - duodenum Dur - dura mater outer brain covering Encephal - brain Endocardi - inner lining of heart Endometri - inner lining of uterus Enter - intestine Epididym - epididymis Episio - vulva or perineum Esophag - esophagus Femor - femur thigh bone Fibul - fibula smaller lower leg bone Gastr - stomach Gingiv - gums Glomerul - filtering unit of kidney Gloss - tongue Gonad - reproductive gland Hepat - liver Herni - hernia Humer - humerus upper arm bone Hyster - uterus Ile - ileum Iri - iris Jejun - jejunum Labi - lip Lacrim - tear or tear duct Lapar - abdomen Laryng - larynx voice box Lingu - tongue Lumb - lumbar lower back Mamm - breast Mast - breast Mastoid - mastoid bone behind ear Men - menstruation Mening - brain coverings Metr - uterus Myocardi - heart muscle Myel - spinal cord or bone marrow Myometri - muscular wall of uterus Myring - eardrum Nas - nose Nephr - kidney Neur - nerve Ocul - eye Oophor - ovary Ophthalm - eye Opt - vision or eye Or - mouth Orchid - testis Orchi -testis Ossicl - small bones of middle ear Osteo - bone Ot - ear Ovari - ovary Pancreat - pancreas Parathyr - parathyroid Patell - kneecap Pelvi - pelvis Pen - penis Pericardi - sac around heart Peritone - peritoneum Pharyng - pharynx throat Phalang - finger or toe bones Phleb - vein Phren - diaphragm Pituit - pituitary gland Pleur - pleura lung covering Pneumo - lung or air Proct - rectum and anus Prostat - prostate Pulmon - lung Pylor - pylorus Pyel - renal pelvis Radi - radius lower arm bone or radiation Rect - rectum Ren - kidney Retin - retina Rhin - nose Sacr - sacrum Salping - fallopian tube Scler - sclera white of eye Scrot - scrotum Sept - dividing wall Sialaden - salivary gland Sigmoid - sigmoid colon Sinus - hollow space in skull Spleno - spleen Stern - sternum breastbone Stomat - mouth Tars - ankle bones Tend - tendon Thorac - chest Thym - thymus gland Thyr - thyroid Tibi - tibia shin bone Trache - trachea windpipe Turbin - scroll shaped bone in nose Tympan - eardrum Uln - ulna lower arm bone Ureter - ureter Urethr - urethra Ur - urine Uter - uterus Vagin - vagina Valv - valve Vas - vas deferens Ven - vein Vesic - bladder Vesicul - seminal vesicle Vestibul - vestibule Ventricu - ventricle of heart or brain Vulv - vulva"""

root_items = []
pattern3 = r'([A-Za-z]+)\s*-\s*([a-z\s/]+?)(?=\s+[A-Z][a-z]+\s*-|$)'
matches3 = re.findall(pattern3, roots_raw + ' ')
for term, defn in matches3:
    root_items.append((term.strip(), defn.strip()))

# Map root words to body systems based on definition
def map_system(term, defn):
    d = defn.lower()
    # Integumentary
    if term.lower() in ('cutane', 'derm', 'tricho', 'pilo', 'psycho', 'onycho', 'ungu'):
        return "Integumentary"
    if 'skin' in d or 'hair' in d or 'nail' in d or 'mamm' in d:
        return "Integumentary"
    # Musculoskeletal
    if term.lower() in ('oste', 'chondro', 'arthr', 'my', 'myos', 'tend', 'ligament',
                         'crani', 'cost', 'stern', 'spondyl', 'vertebr',
                         'carp', 'tars', 'phalang', 'femor', 'tibi', 'fibul', 'radi', 'uln',
                         'humer', 'patell', 'calcane', 'pelvi', 'sacr', 'lumb',
                         'maxill', 'mandib', 'burs', 'synov'):
        return "Musculoskeletal"
    if 'bone' in d or 'cartilage' in d or 'joint' in d or 'bursa' in d:
        return "Musculoskeletal"
    if 'heel' in d or 'wrist' in d or 'ankle' in d or 'kneecap' in d:
        return "Musculoskeletal"
    if 'thigh' in d or 'shin' in d or 'lower leg' in d or 'lower arm' in d:
        return "Musculoskeletal"
    if 'breastbone' in d or 'rib' in d or 'skull' in d or 'pelvis' in d:
        return "Musculoskeletal"
    if 'sacrum' in d or 'finger' in d or 'toe' in d or 'cervical' in d or 'neck' in d:
        return "Musculoskeletal"
    # Cardiovascular
    if term.lower() in ('cardi', 'angi', 'arteri', 'ven', 'phleb', 'atri', 'ventricu',
                         'myocardi', 'endocardi', 'pericardi', 'aort', 'valv', 'spleno', 'hemat'):
        return "Cardiovascular"
    if 'heart' in d or 'vessel' in d or 'artery' in d or 'vein' in d or 'aorta' in d:
        return "Cardiovascular"
    if 'blood' in d or 'spleen' in d:
        return "Cardiovascular"
    # Lymphatic
    if 'lymph' in d:
        return "Lymphatic"
    # Respiratory
    if term.lower() in ('pulmon', 'pneumo', 'pleur', 'bronch', 'bronchiol', 'alveol',
                         'trache', 'laryng', 'pharyng', 'nas', 'rhin', 'phren',
                         'sinus', 'turbin', 'thorac'):
        return "Respiratory"
    if 'lung' in d or 'airway' in d or 'air sac' in d or 'trachea' in d:
        return "Respiratory"
    if 'windpipe' in d or 'larynx' in d or 'voice box' in d:
        return "Respiratory"
    if 'throat' in d or 'nose' in d or 'sinus' in d or 'skull bone' in d:
        return "Respiratory"
    if 'chest' in d or 'diaphragm' in d:
        return "Respiratory"
    # Digestive
    if term.lower() in ('gastr', 'enter', 'col', 'hepat', 'chol', 'cholecyst',
                         'choledoch', 'cholang', 'append', 'esophag', 'or', 'stomat',
                         'gloss', 'lingu', 'dent', 'gingiv', 'labi', 'cheil',
                         'pharyng', 'duoden', 'jejun', 'ile', 'cec',
                         'sigmoid', 'rect', 'an', 'proct', 'prost', 'pancreat',
                         'pylor', 'peritone', 'sialaden', 'bil'):
        return "Digestive"
    if 'stomach' in d or 'intestine' in d or 'colon' in d or 'liver' in d:
        return "Digestive"
    if 'bile' in d or 'gallbladder' in d or 'esophagus' in d:
        return "Digestive"
    if 'mouth' in d or 'tongue' in d or 'lip' in d or 'tooth' in d or 'gums' in d:
        return "Digestive"
    if 'digest' in d or 'palate' in d:
        return "Digestive"
    if 'pancreas' in d or 'salivary' in d or 'rectum' in d or 'anus' in d:
        return "Digestive"
    # Urinary
    if term.lower() in ('ren', 'nephr', 'ureter', 'urethr', 'cyst', 'vesic',
                         'glomerul', 'pyel', 'ur'):
        return "Urinary"
    if 'kidney' in d or 'bladder' in d or 'ureter' in d or 'urethra' in d:
        return "Urinary"
    if 'urine' in d or 'renal' in d:
        return "Urinary"
    # Reproductive
    if term.lower() in ('hyster', 'metr', 'uter', 'oophor', 'ovari', 'salping',
                         'vagin', 'colp', 'men', 'endometri', 'myometri',
                         'episio', 'vulv', 'labi', 'mast', 'mamm',
                         'orchid', 'orchi', 'test', 'epididym', 'vas', 'vesicul',
                         'pen', 'scrot', 'prostat', 'gonad', 'proct'):
        return "Reproductive"
    if 'uterus' in d or 'ovary' in d or 'fallopian' in d or 'vagina' in d:
        return "Reproductive"
    if 'vulva' in d or 'perineum' in d or 'menstruation' in d:
        return "Reproductive"
    if 'testis' in d or 'epididymis' in d or 'penis' in d or 'scrotum' in d:
        return "Reproductive"
    if 'prostate' in d or 'seminal' in d or 'vas deferens' in d:
        return "Reproductive"
    if 'breast' in d or 'cervix' in d or 'cervical' in d:
        return "Reproductive"
    # Endocrine
    if term.lower() in ('thyr', 'parathyr', 'adren', 'pituit', 'thym',
                         'pancreat'):
        return "Endocrine"
    if 'thyroid' in d or 'parathyroid' in d or 'adrenal' in d or 'pituitary' in d:
        return "Endocrine"
    if 'thymus' in d or 'gland' in d:
        return "Endocrine"
    if term.lower() == 'pancreat':
        return "Endocrine"  # has both endocrine & exocrine
    # Nervous
    if term.lower() in ('neur', 'encephal', 'cerebr', 'cerebell', 'mening',
                         'dur', 'myel', 'ventricu'):
        return "Nervous"
    if 'brain' in d or 'nerve' in d or 'spinal cord' in d or 'dura' in d:
        return "Nervous"
    if 'cerebellum' in d or 'cerebrum' in d:
        return "Nervous"
    # Ear & Eye
    if term.lower() in ('ot', 'cochle', 'myring', 'tympan', 'ossicl',
                         'ophthalm', 'ocul', 'opt', 'retin', 'corne',
                         'conjunctiv', 'scler', 'iri', 'blephar',
                         'lacrim', 'dacry', 'vestibul', 'audi'):
        return "Ear & Eye"
    if 'ear' in d or 'cochlea' in d or 'eardrum' in d or 'hearing' in d:
        return "Ear & Eye"
    if 'eye' in d or 'retina' in d or 'cornea' in d or 'iris' in d or 'vision' in d:
        return "Ear & Eye"
    if 'eyelid' in d or 'conjunctiva' in d or 'sclera' in d:
        return "Ear & Eye"
    return "General"

def make_explanation(term, defn, category):
    if category == "prefix":
        return f"The prefix {term} means '{defn}'. In CPC coding, recognizing prefixes helps decode medical terminology in clinical documentation, enabling accurate code selection across ICD-10-CM and CPT code sets."
    elif category == "suffix":
        return f"The suffix {term} means '{defn}'. Suffixes are essential for CPC coders to interpret medical procedures, diagnoses, and conditions from clinical documentation, directly affecting code selection and reimbursement accuracy."
    else:
        return f"The root '{term}' means '{defn}'. Recognizing medical root words is fundamental for CPC coders to interpret clinical documentation accurately and assign the correct diagnosis and procedure codes."

def make_example(term, defn, category):
    if category == "prefix":
        return f"Example: '{term}' combines with medical terms to indicate '{defn}'. CPC coders encounter this prefix in operative reports, diagnostic findings, and clinical notes when determining the correct ICD-10-CM and CPT codes."
    elif category == "suffix":
        return f"Example: In clinical documentation, '{term}' indicates '{defn}'. Recognizing this suffix helps the CPC coder accurately interpret the medical record for proper code assignment and billing."
    else:
        return f"Example: '{term}' = '{defn}'. CPC coders use this root to interpret clinical documentation and select the appropriate ICD-10-CM diagnosis code or CPT procedure code for accurate billing and reimbursement."

# Build cards
cards = []

for i, (term, defn) in enumerate(prefix_items):
    slug = term.rstrip('-').lower().replace('/', '-').replace(' ', '-')
    cards.append({
        "id": f"prefixes-{slug}-{i+1:03d}",
        "system": "Prefixes",
        "category": "prefix",
        "term": term,
        "definition": defn,
        "explanation": make_explanation(term, defn, "prefix"),
        "example": make_example(term, defn, "prefix"),
        "difficulty": "basic"
    })

for i, (term, defn) in enumerate(suffix_items):
    slug = term.lstrip('-').rstrip('-').lower().replace('/', '-').replace(' ', '-')
    cards.append({
        "id": f"suffixes-{slug}-{i+1:03d}",
        "system": "Suffixes",
        "category": "suffix",
        "term": term,
        "definition": defn,
        "explanation": make_explanation(term, defn, "suffix"),
        "example": make_example(term, defn, "suffix"),
        "difficulty": "basic"
    })

for i, (term, defn) in enumerate(root_items):
    sys = map_system(term, defn)
    slug = term.lower().replace('/', '-').replace(' ', '-')
    cards.append({
        "id": f"root-words-{slug}-{i+1:03d}",
        "system": sys,
        "category": "root_word",
        "term": term,
        "definition": defn,
        "explanation": make_explanation(term, defn, "root"),
        "example": make_example(term, defn, "root"),
        "difficulty": "basic"
    })

with open('cards.json', 'w') as f:
    json.dump(cards, f, indent=2)

print(f"Generated {len(cards)} cards:")
print(f"  Prefixes: {len(prefix_items)}")
print(f"  Suffixes: {len(suffix_items)}")
print(f"  Root words: {len(root_items)}")

# Show system breakdown for roots
from collections import Counter
sys_counts = Counter(c['system'] for c in cards)
for sys, cnt in sorted(sys_counts.items(), key=lambda x: -x[1]):
    print(f"  {sys}: {cnt}")
