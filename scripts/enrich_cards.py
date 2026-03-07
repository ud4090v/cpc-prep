#!/usr/bin/env python3
"""Enrich CPC prep flash cards with real explanations and examples."""
import json, re

def clean(s):
    return s.replace('\xa0', ' ').strip() if s else ''

# Maps definition patterns to proper medical terms (for empty-term cards)
TERM_MAP = [
    (r'arthr/o.*itis', 'Arthritis'),
    (r'oste/o.*malacia', 'Osteomalacia'),
    (r'Muscle development.*trophy', 'Myotrophy'),
    (r'tendin/o.*itis', 'Tendinitis'),
    (r'Cardi/o.*my/o.*pathy', 'Cardiomyopathy'),
    (r'Arteri/o.*sclerosis', 'Arteriosclerosis'),
    (r'Tachy-.*cardia', 'Tachycardia'),
    (r'Blockage of blood flow to the heart', 'Myocardial Infarction'),
    (r'Consistently high blood pressure', 'Hypertension'),
    (r'Abnormal heart rhythm', 'Arrhythmia'),
    (r'heart cannot pump effectively', 'Heart Failure (CHF)'),
    (r'Interrupted blood flow to the brain', 'Stroke (CVA)'),
    (r'Narrowing of arteries supplying limbs', 'Peripheral Artery Disease'),
    (r'Dilation or bulging.*blood vessel', 'Aneurysm'),
    (r'blood clot in a deep vein', 'Deep Vein Thrombosis (DVT)'),
    (r'Records electrical activity of the heart', 'Electrocardiogram (ECG)'),
    (r'Ultrasound image of the heart', 'Echocardiogram'),
    (r'X-ray imaging of blood vessels', 'Angiography'),
    (r'cardiac enzymes', 'Cardiac Blood Panel'),
    (r'heart performance under physical stress', 'Cardiac Stress Test'),
    (r'Nerve root', 'Radicul/o'),
    (r'nerve pain', 'Neuralgia'),
    (r'brain inflammation', 'Encephalitis'),
    (r'spinal cord disease', 'Myelopathy'),
    (r'seizure disorder', 'Epilepsy'),
    (r'loss of muscle coordination', 'Ataxia'),
    (r'difficulty speaking', 'Dysphasia/Aphasia'),
    (r'progressive loss of memory', "Alzheimer's Disease"),
    (r'tremor, rigidity', "Parkinson's Disease"),
    (r'immune system attacks myelin', 'Multiple Sclerosis'),
    (r'sudden, severe headache', 'Migraine'),
    (r'damage to peripheral nerves', 'Peripheral Neuropathy'),
    (r'Records electrical brain activity', 'EEG'),
    (r'Imaging of the brain', 'Brain MRI/CT'),
    (r'Tests nerve conduction', 'Nerve Conduction Study'),
    (r'Analyzes cerebrospinal fluid', 'Lumbar Puncture'),
    (r'Maps blood flow in the brain', 'Cerebral Angiography'),
    (r"clouding of the eye's lens", 'Cataract'),
    (r'damage to the optic nerve', 'Glaucoma'),
    (r'deterioration of the macula', 'Macular Degeneration'),
    (r'inflammation of the conjunctiva', 'Conjunctivitis'),
    (r'detachment of the retina', 'Retinal Detachment'),
    (r'hearing loss due to aging', 'Presbycusis'),
    (r'ringing in the ears', 'Tinnitus'),
    (r'middle ear infection', 'Otitis Media'),
    (r'inner ear disorder', "Meniere's Disease"),
    (r'Measures visual acuity', 'Visual Acuity Test'),
    (r'Measures intraocular pressure', 'Tonometry'),
    (r'Examines the interior of the eye', 'Ophthalmoscopy'),
    (r'Tests hearing sensitivity', 'Audiometry'),
    (r'Tests balance function', 'Vestibular Testing'),
    (r'Maps the visual field', 'Perimetry'),
    (r'inflammation of nasal mucosa', 'Rhinitis'),
    (r'infection of the pharynx', 'Pharyngitis'),
    (r'infection of the larynx', 'Laryngitis'),
    (r'inflammation of bronchial tubes', 'Bronchitis'),
    (r'infection of lung tissue', 'Pneumonia'),
    (r'chronic lung disease', 'COPD'),
    (r'reactive airway disease', 'Asthma'),
    (r'blood clot in pulmonary', 'Pulmonary Embolism'),
    (r'accumulation of fluid in pleural', 'Pleural Effusion'),
    (r'collapse of lung tissue', 'Pneumothorax'),
    (r'Measures lung volumes', 'Spirometry'),
    (r'X-ray of the chest', 'Chest X-ray'),
    (r'Camera examination of airways', 'Bronchoscopy'),
    (r'Measures oxygen levels', 'Pulse Oximetry'),
    (r'CT scan of the chest', 'CT Pulmonary Angiography'),
    (r'Overnight study of sleep', 'Polysomnography'),
    (r'inflammation of the stomach lining', 'Gastritis'),
    (r'sores in the stomach', 'Peptic Ulcer Disease'),
    (r'backward flow of stomach acid', 'GERD'),
    (r'inflammation of the liver', 'Hepatitis'),
    (r'inflammation of the pancreas', 'Pancreatitis'),
    (r'stones in the gallbladder', 'Cholelithiasis'),
    (r'inflammatory bowel', "Crohn's Disease / UC"),
    (r'difficulty swallowing', 'Dysphagia'),
    (r'obstruction of the intestine', 'Bowel Obstruction'),
    (r'pouches in the colon', 'Diverticulitis'),
    (r'Camera examination of upper GI', 'EGD'),
    (r'Camera examination of the colon', 'Colonoscopy'),
    (r'X-ray of the GI tract', 'Barium Study'),
    (r'Blood tests for liver', 'Liver Function Tests'),
    (r'Imaging of abdominal organs', 'Abdominal Ultrasound'),
    (r'Measures acidity in esophagus', 'pH Monitoring'),
    (r'inflammation of the kidney', 'Pyelonephritis'),
    (r'stones in the urinary tract', 'Urolithiasis'),
    (r'Kidney function declines', 'Chronic Kidney Disease'),
    (r'bacterial infection of the bladder', 'Cystitis/UTI'),
    (r'involuntary loss of urine', 'Urinary Incontinence'),
    (r'inability to empty the bladder', 'Urinary Retention'),
    (r'inflammation of the urethra', 'Urethritis'),
    (r'Measures kidney function', 'BUN/Creatinine'),
    (r'Examines urine composition', 'Urinalysis'),
    (r'Imaging of the urinary tract', 'Renal Ultrasound'),
    (r'Camera examination of the bladder', 'Cystoscopy'),
    (r'Measures urine flow', 'Uroflowmetry'),
    (r'Filters waste from the blood', 'Dialysis'),
    (r'overproduction of thyroid', 'Hyperthyroidism'),
    (r'underproduction of thyroid', 'Hypothyroidism'),
    (r'high blood sugar', 'Diabetes Mellitus'),
    (r'bone density decreases', 'Osteoporosis'),
    (r'overproduction of cortisol', "Cushing's Syndrome"),
    (r'adrenal insufficiency', "Addison's Disease"),
    (r'excess growth hormone', 'Acromegaly'),
    (r'Measures hormone levels', 'Hormone Panel'),
    (r'Measures blood sugar', 'HbA1c Test'),
    (r'Imaging of endocrine', 'Thyroid Ultrasound'),
    (r'Measures thyroid function', 'TFTs'),
    (r'Measures bone density', 'DEXA Scan'),
    (r'Evaluates adrenal function', 'ACTH Stimulation Test'),
    (r'inflammation of the prostate', 'Prostatitis'),
    (r'non-cancerous prostate', 'BPH'),
    (r'failure to achieve erection', 'Erectile Dysfunction'),
    (r'undescended testicle', 'Cryptorchidism'),
    (r'twisted spermatic cord', 'Testicular Torsion'),
    (r'painful menstruation', 'Dysmenorrhea'),
    (r'tissue similar to uterine lining', 'Endometriosis'),
    (r'non-cancerous uterine', 'Uterine Fibroids'),
    (r'inflammation of the fallopian', 'PID'),
    (r'ovarian tissue-filled sacs', 'Ovarian Cysts'),
    (r'Examines the prostate', 'DRE'),
    (r'Blood test for prostate', 'PSA Test'),
    (r'Microscopic exam of cervical', 'Pap Smear'),
    (r'Breast imaging', 'Mammography'),
    (r'Ultrasound of reproductive', 'Pelvic Ultrasound'),
    (r'Camera examination of the uterus', 'Hysteroscopy'),
    (r'weakened immune response', 'Immunodeficiency'),
    (r'overactive immune response', 'Autoimmune Disease'),
    (r'Hodgkin and non-Hodgkin', 'Lymphoma'),
    (r'cancer of the blood-forming', 'Leukemia'),
    (r'excessive allergic response', 'Anaphylaxis'),
    (r'persistent fatigue and immune', 'CFS'),
    (r'cancer of plasma cells', 'Multiple Myeloma'),
    (r'chronic inflammatory disease', 'SLE (Lupus)'),
    (r'chronic joint inflammation', 'Rheumatoid Arthritis'),
    (r'Measures immune cell counts', 'CBC'),
    (r'Identifies specific antibodies', 'Immunoglobulin Tests'),
    (r'Examines lymph node tissue', 'Lymph Node Biopsy'),
    (r'Detects inflammatory markers', 'ESR/CRP'),
    (r'Imaging of lymphatic', 'Lymphangiography'),
    (r'Measures complement proteins', 'Complement Test'),
]

def infer_term(defn):
    d = clean(defn)
    for pattern, term in TERM_MAP:
        if re.search(pattern, d, re.IGNORECASE):
            return term
    # Compound: "Root/o + -suffix"
    combo = re.match(r'\(?(\w+/\w+)\s*\+\s*(-\w+)\)?', d)
    if combo:
        return combo.group(1).split('/')[0].capitalize() + combo.group(2).lstrip('-')
    parts = re.findall(r'(\w+/\w+)', d)
    suffixes = re.findall(r'-(\w+)', d)
    if parts and suffixes:
        return parts[0].split('/')[0].capitalize() + suffixes[-1]
    return d[:60] if d else 'Unknown'

def get_sys(system):
    return system.replace('The ', '').replace('the ', '').strip()

def gen_explanation(term, defn, system):
    t, d, s = clean(term), clean(defn), get_sys(system)
    dl = d.lower()
    
    if '/' in t and ',' in t:
        roots = [r.strip() for r in t.split(',')]
        return (f"The combining forms {', '.join(roots)} all mean '{d}'. Multiple roots for the same "
                f"concept reflect different Greek and Latin origins. In {s} coding, recognizing all "
                f"variants ensures accurate interpretation of medical terms in clinical documentation. "
                f"CPC coders encounter these roots in diagnoses, procedure descriptions, and operative reports.")
    
    if '/' in t:
        return (f"The combining form '{t}' means '{d}'. This Greek/Latin root appears throughout "
                f"{s} terminology. CPC coders use combining forms to decode complex medical terms — "
                f"breaking them into root + suffix/prefix reveals the meaning, which is essential "
                f"for selecting the correct CPT and ICD-10 codes.")
    
    if t.endswith('-'):
        return (f"The prefix '{t.rstrip('-')}-' means '{d}'. In {s} terminology, this prefix "
                f"modifies base words to specify conditions or locations. Prefix recognition helps "
                f"CPC coders rapidly interpret diagnostic terms and ensures correct code specificity "
                f"when translating clinical language into billing codes.")
    
    if t.startswith('-'):
        return (f"The suffix '-{t.lstrip('-')}' means '{d}'. Suffixes indicate whether a term "
                f"describes a condition, procedure, or test. In {s} documentation, this suffix "
                f"helps CPC coders determine the appropriate code category — diagnosis (ICD-10-CM) "
                f"vs. procedure (CPT) — before searching for the specific code.")
    
    # Anatomy
    anat_kw = ['bone', 'muscle', 'organ', 'gland', 'vessel', 'artery', 'vein', 'nerve',
               'joint', 'ligament', 'tendon', 'cartilage', 'membrane', 'cavity', 'lobe',
               'arm bone', 'thigh', 'shin', 'kneecap', 'vertebra', 'rib', 'chamber', 'valve']
    if any(a in dl for a in anat_kw):
        return (f"'{t}' refers to {d}. This anatomical structure is part of the {s} and is "
                f"frequently referenced in operative reports and diagnostic records. CPC coders must "
                f"know precise anatomy because many CPT and ICD-10 codes are site-specific — coding "
                f"the wrong anatomical location leads to claim denials and compliance issues.")
    
    # Diseases
    disease_kw = ['disease', 'disorder', 'syndrome', 'inflammation', 'infection', 'failure',
                  'cancer', 'tumor', 'abnormal', 'deficiency', 'chronic', 'acute', 'pain']
    if any(a in dl for a in disease_kw):
        return (f"'{t}' is defined as {d}. This is a significant condition within the {s} that "
                f"CPC coders encounter regularly in medical records. Understanding the condition helps "
                f"coders assign the most specific ICD-10-CM code, verify medical necessity for related "
                f"procedures, and ensure documentation supports the level of service billed.")
    
    # Procedures/tests
    proc_kw = ['procedure', 'surgery', 'test', 'exam', 'imaging', 'scan', 'x-ray', 'biopsy',
               'removal', 'repair', 'excision', 'records', 'measures', 'camera', 'ultrasound']
    if any(a in dl for a in proc_kw):
        return (f"'{t}' involves {dl}. This diagnostic or therapeutic procedure is part of {s} "
                f"medicine. CPC coders assign CPT codes for such procedures and must understand the "
                f"clinical details to select the correct code, apply appropriate modifiers, and "
                f"verify that documentation supports medical necessity.")
    
    # Default
    return (f"'{t}' means '{d}' in {s} medical terminology. This is essential knowledge for CPC "
            f"coders who must interpret clinical documentation accurately. Understanding these terms "
            f"enables proper code selection across ICD-10-CM (diagnosis) and CPT (procedure) code sets, "
            f"which directly affects reimbursement accuracy and compliance.")

def gen_example(term, defn, system):
    t, d, s = clean(term), clean(defn), get_sys(system)
    dl = d.lower()
    tl = t.lower()
    
    # Combining forms - build a medical word from the root
    if '/' in t:
        roots = [r.strip() for r in t.split(',')]
        first = roots[0]
        base = first.split('/')[0].lower()
        
        suffix_combos = {
            'itis': ('inflammation', f'{base}itis means inflammation of the {dl}'),
            'ectomy': ('surgical removal', f'{base}ectomy means surgical removal of the {dl}'),
            'osis': ('condition', f'{base}osis means abnormal condition of the {dl}'),
            'ology': ('study of', f'{base}ology means the study of the {dl}'),
            'algia': ('pain', f'{base}algia means pain in the {dl}'),
            'scopy': ('visual exam', f'{base}scopy means visual examination of the {dl}'),
            'plasty': ('surgical repair', f'{base}plasty means surgical repair of the {dl}'),
            'megaly': ('enlargement', f'{base}megaly means enlargement of the {dl}'),
        }
        
        # Pick a relevant suffix based on what makes medical sense
        if any(a in dl for a in ['skin', 'stomach', 'liver', 'kidney', 'brain', 'joint',
                                  'muscle', 'nerve', 'lung', 'throat', 'bladder', 'heart',
                                  'bone', 'ear', 'eye', 'gland', 'intestine', 'colon',
                                  'uterus', 'ovary', 'vein', 'artery', 'tendon', 'membrane']):
            return (f"Medical term example: {base}itis = inflammation of the {dl}. "
                    f"In a chart note: 'Patient diagnosed with {base}itis' — the coder recognizes "
                    f"'{first}' = {dl} and '-itis' = inflammation to find the correct ICD-10 code.")
        
        if 'fat' in dl or 'oil' in dl or 'sweat' in dl:
            return (f"Example: hyper{base}osis = excessive {dl} production. "
                    f"Recognizing '{first}' helps the coder identify conditions involving {dl}.")
        
        if 'blood' in dl or 'red' in dl or 'white' in dl:
            return (f"Example: {base}emia = {dl} in the blood. "
                    f"In lab reports, terms using '{first}' relate to {dl} levels in blood work.")
        
        return (f"Example: {base}itis = inflammation related to {dl}; {base}ectomy = surgical "
                f"removal related to {dl}. Recognizing '{first}' in medical terms tells the CPC "
                f"coder which body structure or substance is involved.")
    
    # Prefixes
    if t.endswith('-'):
        pfx = t.rstrip('-').lower()
        return (f"Example: '{pfx}' + a root word → e.g., in a diagnosis like '{pfx}trophy' "
                f"(meaning {dl} growth/development). A CPC coder seeing this prefix in a clinical "
                f"note immediately knows the condition involves something that is '{dl}'.")
    
    # Suffixes
    if t.startswith('-'):
        sfx = t.lstrip('-').lower()
        return (f"Example: A root word + '-{sfx}' → e.g., 'cardi-{sfx}' would mean {dl} "
                f"related to the heart. CPC coders use suffix recognition to determine whether "
                f"a term describes a diagnosis, procedure, or anatomical relationship.")
    
    # Anatomy terms
    anat_kw = ['bone', 'muscle', 'joint', 'tendon', 'ligament', 'nerve', 'artery', 'vein',
               'gland', 'organ', 'cavity', 'arm', 'thigh', 'shin', 'kneecap']
    if any(a in dl for a in anat_kw):
        return (f"Clinical scenario: A surgeon documents a procedure on the '{t}'. The CPC coder "
                f"must know this is {dl} to select the correct anatomical site in CPT/ICD-10. "
                f"Wrong site = wrong code = claim denial.")
    
    # Diseases
    if any(a in dl for a in ['disease', 'disorder', 'syndrome', 'inflammation', 'infection',
                             'failure', 'cancer', 'chronic', 'acute']):
        return (f"Chart note: 'Patient presents with {t.lower()}.' The CPC coder searches ICD-10-CM "
                f"for this condition ({dl}) to assign the most specific diagnosis code. This code "
                f"is required to justify any related procedures or treatments billed.")
    
    # Procedures
    if any(a in dl for a in ['procedure', 'test', 'exam', 'imaging', 'scan', 'records',
                             'measures', 'camera', 'ultrasound', 'x-ray']):
        return (f"Scenario: Provider performs {t.lower()}. The CPC coder must select the correct "
                f"CPT code for this procedure ({dl}) and verify documentation supports the service. "
                f"Medical necessity must be established via a linked diagnosis code.")
    
    # Default
    return (f"In clinical documentation: '{t}' ({dl}) appears in the {s} context. The CPC coder "
            f"uses this knowledge to accurately interpret the medical record and assign the "
            f"appropriate diagnosis or procedure code for billing purposes.")


def main():
    with open('data/cards.json') as f:
        cards = json.load(f)
    
    fixed = 0
    terms_filled = 0
    
    for card in cards:
        term = clean(card.get('term', ''))
        defn = clean(card.get('definition', ''))
        system = card.get('system', '')
        
        # Fix empty terms
        if not term:
            card['term'] = infer_term(defn)
            terms_filled += 1
        
        # Fix placeholder explanations
        if card.get('explanation', '') in ['Context and importance in CPC coding.', '']:
            card['explanation'] = gen_explanation(card['term'], defn, system)
            fixed += 1
        
        # Fix placeholder examples
        if card.get('example', '') in ['Example of usage here.', '']:
            card['example'] = gen_example(card['term'], defn, system)
    
    with open('data/cards.json', 'w') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    
    print(f"Enriched {fixed} explanations, filled {terms_filled} empty terms")
    print(f"Total cards: {len(cards)}")

if __name__ == '__main__':
    main()
