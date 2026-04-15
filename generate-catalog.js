#!/usr/bin/env node
// generate-catalog.js — Converts formulary-extracted.json into TOL catalog, config, and data files

const fs = require('fs');
const formulary = require('./formulary-extracted.json');

// ─── Slugify helper ──────────────────────────────────────────────────
function slug(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Category → Domain mapping ──────────────────────────────────────
const CATEGORY_TO_DOMAIN = {
  'Allergy & Immunology': 'allergy',
  'Cardiology': 'cardiovascular',
  'Dermatology': 'dermatology',
  'ENT & Oral': 'ent',
  'Endocrinology & Metabolism': 'endocrine',
  'Gastroenterology': 'gi',
  'Genitourinary & STI': 'sti',
  'Geriatrics & Palliative': 'geriatrics',
  'Gynecology': 'womens-health',
  'Hematology': 'hematology',
  'Infectious Disease': 'infection',
  'Musculoskeletal': 'msk',
  'Neurology': 'neurology',
  'Obstetrics': 'obstetrics',
  'Pediatrics': 'pediatrics',
  'Psychiatry & Addictions': 'mental-health',
  'Renal': 'renal',
  'Respiratory': 'resp-chronic',
  'Rheumatology': 'rheumatology',
  'Urology & Men\'s Health': 'urology',
};

// ─── Subtype mapping (category → subtype value) ─────────────────────
// Each condition gets a subtype within its domain. We generate subtypes from category context.
const CATEGORY_TO_SUBTYPE = {
  'Allergy & Immunology': 'allergy-immunology',
  'Cardiology': 'cardiac-general',
  'Dermatology': 'derm-general',
  'ENT & Oral': 'ent-general',
  'Endocrinology & Metabolism': 'endo-general',
  'Gastroenterology': 'gi-general',
  'Genitourinary & STI': 'gu-sti',
  'Geriatrics & Palliative': 'geriatric-general',
  'Gynecology': 'gynecology',
  'Hematology': 'hematology-general',
  'Infectious Disease': 'infectious-general',
  'Musculoskeletal': 'msk-general',
  'Neurology': 'neuro-general',
  'Obstetrics': 'obstetric-general',
  'Pediatrics': 'peds-general',
  'Psychiatry & Addictions': 'psych-general',
  'Renal': 'renal-general',
  'Respiratory': 'resp-general',
  'Rheumatology': 'rheum-general',
  'Urology & Men\'s Health': 'urology-general',
};

// ─── New domains to add (not already in config) ──────────────────────
const NEW_DOMAINS = [
  { value: 'allergy', en: 'Allergy & Immunology', fr: 'Allergie et immunologie' },
  { value: 'neurology', en: 'Neurology', fr: 'Neurologie' },
  { value: 'hematology', en: 'Hematology', fr: 'Hématologie' },
  { value: 'renal', en: 'Renal', fr: 'Rénal' },
  { value: 'rheumatology', en: 'Rheumatology', fr: 'Rhumatologie' },
  { value: 'urology', en: 'Urology & Men\'s Health', fr: 'Urologie et santé masculine' },
  { value: 'geriatrics', en: 'Geriatrics & Palliative', fr: 'Gériatrie et soins palliatifs' },
  { value: 'obstetrics', en: 'Obstetrics', fr: 'Obstétrique' },
  { value: 'pediatrics', en: 'Pediatrics', fr: 'Pédiatrie' },
];

// ─── New subtypes to add ──────────────────────────────────────────────
const NEW_SUBTYPES = [
  { value: 'allergy-immunology', domain: 'allergy', en: 'Allergy & Immunology', fr: 'Allergie et immunologie' },
  { value: 'cardiac-general', domain: 'cardiovascular', en: 'General cardiology', fr: 'Cardiologie générale' },
  { value: 'derm-general', domain: 'dermatology', en: 'General dermatology', fr: 'Dermatologie générale' },
  { value: 'ent-general', domain: 'ent', en: 'General ENT', fr: 'ORL général' },
  { value: 'endo-general', domain: 'endocrine', en: 'General endocrine', fr: 'Endocrinologie générale' },
  { value: 'gi-general', domain: 'gi', en: 'General GI', fr: 'Gastro général' },
  { value: 'gu-sti', domain: 'sti', en: 'Genitourinary & STI', fr: 'Génito-urinaire et IST' },
  { value: 'geriatric-general', domain: 'geriatrics', en: 'General geriatrics', fr: 'Gériatrie générale' },
  { value: 'gynecology', domain: 'womens-health', en: 'Gynecology', fr: 'Gynécologie' },
  { value: 'hematology-general', domain: 'hematology', en: 'General hematology', fr: 'Hématologie générale' },
  { value: 'infectious-general', domain: 'infection', en: 'General infectious disease', fr: 'Infectiologie générale' },
  { value: 'msk-general', domain: 'msk', en: 'General MSK', fr: 'MSK général' },
  { value: 'neuro-general', domain: 'neurology', en: 'General neurology', fr: 'Neurologie générale' },
  { value: 'obstetric-general', domain: 'obstetrics', en: 'General obstetrics', fr: 'Obstétrique générale' },
  { value: 'peds-general', domain: 'pediatrics', en: 'General pediatrics', fr: 'Pédiatrie générale' },
  { value: 'psych-general', domain: 'mental-health', en: 'General psychiatry', fr: 'Psychiatrie générale' },
  { value: 'renal-general', domain: 'renal', en: 'General renal', fr: 'Néphro général' },
  { value: 'resp-general', domain: 'resp-chronic', en: 'General respiratory', fr: 'Respiratoire général' },
  { value: 'rheum-general', domain: 'rheumatology', en: 'General rheumatology', fr: 'Rhumatologie générale' },
  { value: 'urology-general', domain: 'urology', en: 'General urology', fr: 'Urologie générale' },
];

// ─── Existing conditions (don't duplicate) ───────────────────────────
const EXISTING_CONDITIONS = new Set([
  'cystitis','cellulitis','ringworm','otitis-media','chlamydia','pharyngitis',
  'sinusitis','bronchitis-bacterial','impetigo','uti-male','conjunctivitis',
  'gonorrhea','trichomoniasis','bv','vulvovaginal-candidiasis','shingles',
  'dental-abscess','pyelonephritis','otitis-externa','cap','lyme-disease',
  'herpes-simplex','depression','gad','insomnia','hypertension','hyperlipidemia',
  'type2-diabetes','hypothyroidism','vitamin-d-deficiency','iron-deficiency',
  'gerd','h-pylori','low-back-pain','osteoarthritis','gout-flare','migraine',
  'acne-vulgaris','atopic-dermatitis','ocp-combined','menopause-hrt',
  'allergic-rhinitis','copd-exacerbation',
]);

// ─── Existing catalog IDs (don't duplicate) ──────────────────────────
const existingCatalogIds = new Set();
['a','b','c','d','e'].forEach(letter => {
  const content = fs.readFileSync(`app-catalog-${letter}.js`, 'utf8');
  const matches = content.match(/id:\s*'([^']+)'/g);
  if (matches) matches.forEach(m => existingCatalogIds.add(m.replace("id: '","").replace("'","")));
});
console.log(`Existing catalog IDs: ${existingCatalogIds.size}`);

// ─── Condition slug mapping (formulary condition name → TOL condition value) ──
// Map formulary names to existing condition slugs where they match
const CONDITION_OVERRIDES = {
  'Allergic Rhinitis': 'allergic-rhinitis',
  'Hypertension': 'hypertension',
  'Dyslipidemia': 'hyperlipidemia',
  'Acne Vulgaris': 'acne-vulgaris',
  'Cellulitis': 'cellulitis',
  'Impetigo': 'impetigo',
  'Eczema/Atopic Dermatitis': 'atopic-dermatitis',
  'Eczema': 'atopic-dermatitis',
  'Otitis Externa': 'otitis-externa',
  'Otitis Media': 'otitis-media',
  'Pharyngitis/Tonsillitis': 'pharyngitis',
  'Sinusitis': 'sinusitis',
  'Hypothyroidism': 'hypothyroidism',
  'Iron Deficiency': 'iron-deficiency',
  'Vitamin D Deficiency': 'vitamin-d-deficiency',
  'GERD/Dyspepsia': 'gerd',
  'Helicobacter pylori infection': 'h-pylori',
  'Chlamydia trachomatis Infection': 'chlamydia',
  'Gonorrhea (uncomplicated)': 'gonorrhea',
  'Trichomoniasis': 'trichomoniasis',
  'Genital Herpes (HSV)': 'herpes-simplex',
  'Low Back Pain': 'low-back-pain',
  'Osteoarthritis': 'osteoarthritis',
  'Gout (Acute)': 'gout-flare',
  'Headache/Migraine': 'migraine',
  'Depression': 'depression',
  'Anxiety Disorders': 'gad',
  'Insomnia': 'insomnia',
  'Community-Acquired Pneumonia': 'cap',
  'Lyme Disease (early localized)': 'lyme-disease',
  'Pyelonephritis': 'pyelonephritis',
  'Type 2 Diabetes': 'type2-diabetes',
  'Urinary Tract Infection (simple)': 'cystitis',
  'Contraception Counselling': 'ocp-combined',
  'Menopause Symptoms': 'menopause-hrt',
  'COPD': 'copd-exacerbation',
  'Vaginitis (Bacterial)': 'bv',
  'Vaginitis (Candidiasis)': 'vulvovaginal-candidiasis',
  'Tinea Corporis/Pedis/Cruris (Ringworm/Athlete\'s foot)': 'ringworm',
  'Oral Ulcers/Dental Infections': 'dental-abscess',
  'Acute Bronchitis': 'bronchitis-bacterial',
  'Acne': 'peds-acne', // pediatric acne is separate
};

// ─── Drug class → rules mapping ──────────────────────────────────────
function generateRules(drugClass, drug, condition) {
  const rules = [];
  const cls = (drugClass || '').toLowerCase();
  const drg = (drug || '').toLowerCase();

  // NSAID rules
  if (cls.includes('nsaid') || drg.includes('ibuprofen') || drg.includes('naproxen') || drg.includes('diclofenac') || drg.includes('ketorolac') || drg.includes('celecoxib') || drg.includes('indomethacin')) {
    rules.push({ effect: 'caution', when: 'ctx.egfr < 60', reason: 'Renal caution: NSAIDs may worsen kidney function when eGFR is below 60.' });
    rules.push({ effect: 'blocked', when: 'ctx.egfr < 30', reason: 'Avoid NSAIDs when eGFR is below 30 due to risk of acute kidney injury.' });
    rules.push({ effect: 'caution', when: 'ctx.pregnancy === "yes"', reason: 'NSAIDs are generally avoided in pregnancy, especially in the third trimester.' });
    rules.push({ effect: 'caution', when: 'ctx.allergies.includes("nsaid")', reason: 'Patient has documented NSAID allergy or intolerance.' });
  }

  // ACE inhibitor / ARB rules
  if (cls.includes('ace inhibitor') || cls.includes('acei') || drg.includes('ramipril') || drg.includes('lisinopril') || drg.includes('enalapril') || drg.includes('perindopril')) {
    rules.push({ effect: 'blocked', when: 'ctx.pregnancy === "yes"', reason: 'ACE inhibitors are contraindicated in pregnancy (teratogenic).' });
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("ace-inhibitor")', reason: 'Patient has documented ACE inhibitor allergy (cough/angioedema).' });
    rules.push({ effect: 'caution', when: 'ctx.egfr < 30', reason: 'Monitor renal function closely with ACE inhibitors when eGFR is low.' });
  }
  if (cls.includes('arb') || drg.includes('losartan') || drg.includes('valsartan') || drg.includes('candesartan') || drg.includes('irbesartan') || drg.includes('telmisartan')) {
    rules.push({ effect: 'blocked', when: 'ctx.pregnancy === "yes"', reason: 'ARBs are contraindicated in pregnancy.' });
    rules.push({ effect: 'caution', when: 'ctx.egfr < 30', reason: 'Monitor renal function closely with ARBs when eGFR is low.' });
  }

  // Statin rules
  if (cls.includes('statin') || drg.includes('atorvastatin') || drg.includes('rosuvastatin') || drg.includes('simvastatin') || drg.includes('pravastatin')) {
    rules.push({ effect: 'blocked', when: 'ctx.pregnancy === "yes"', reason: 'Statins are contraindicated in pregnancy.' });
    rules.push({ effect: 'caution', when: 'ctx.hepaticRisk === "major"', reason: 'Statins require liver function monitoring; avoid with active liver disease.' });
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("statin-allergy")', reason: 'Patient has documented statin intolerance.' });
  }

  // Antibiotic — penicillin class
  if (cls.includes('penicillin') || cls.includes('aminopenicillin') || drg.includes('amoxicillin') || drg.includes('ampicillin') || drg.includes('penicillin') || drg.includes('cloxacillin') || drg.includes('piperacillin')) {
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("penicillin")', reason: 'Patient has documented penicillin/beta-lactam allergy.' });
  }

  // Cephalosporin rules
  if (cls.includes('cephalosporin') || drg.includes('cephalexin') || drg.includes('cefuroxime') || drg.includes('ceftriaxone') || drg.includes('cefixime')) {
    rules.push({ effect: 'caution', when: 'ctx.allergies.includes("penicillin")', reason: 'Cross-reactivity risk with penicillin allergy (low but non-zero for cephalosporins).' });
  }

  // Macrolide rules
  if (cls.includes('macrolide') || drg.includes('azithromycin') || drg.includes('clarithromycin') || drg.includes('erythromycin')) {
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("macrolide")', reason: 'Patient has documented macrolide allergy.' });
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("qtRisk")', reason: 'Macrolides can prolong QT interval; use caution with other QT-prolonging drugs.' });
  }

  // Fluoroquinolone rules
  if (cls.includes('fluoroquinolone') || drg.includes('ciprofloxacin') || drg.includes('levofloxacin') || drg.includes('moxifloxacin')) {
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("fluoroquinolone")', reason: 'Patient has documented fluoroquinolone allergy.' });
    rules.push({ effect: 'caution', when: 'ctx.age < 18', reason: 'Fluoroquinolones are generally avoided in children/adolescents due to cartilage concerns.' });
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("qtRisk")', reason: 'Fluoroquinolones can prolong QT interval.' });
  }

  // Tetracycline rules
  if (cls.includes('tetracycline') || drg.includes('doxycycline') || drg.includes('minocycline') || drg.includes('tetracycline')) {
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("tetracycline")', reason: 'Patient has documented tetracycline allergy.' });
    rules.push({ effect: 'blocked', when: 'ctx.pregnancy === "yes"', reason: 'Tetracyclines are contraindicated in pregnancy (tooth/bone effects).' });
    rules.push({ effect: 'caution', when: 'ctx.age < 8', reason: 'Tetracyclines are generally avoided under age 8 due to tooth discoloration.' });
  }

  // Sulfonamide rules
  if (cls.includes('sulfonamide') || drg.includes('trimethoprim-sulfamethoxazole') || drg.includes('tmp-smx') || drg.includes('sulfamethoxazole')) {
    rules.push({ effect: 'blocked', when: 'ctx.allergies.includes("sulfonamide")', reason: 'Patient has documented sulfonamide allergy.' });
    rules.push({ effect: 'caution', when: 'ctx.pregnancy === "yes"', reason: 'Sulfonamides have pregnancy risks, especially near term.' });
  }

  // Metformin rules
  if (drg.includes('metformin')) {
    rules.push({ effect: 'caution', when: 'ctx.egfr < 45', reason: 'Metformin dose should be reduced when eGFR is 30-45; contraindicated below 30.' });
    rules.push({ effect: 'blocked', when: 'ctx.egfr < 30', reason: 'Metformin is contraindicated when eGFR is below 30 (lactic acidosis risk).' });
  }

  // SSRI / SNRI rules
  if (cls.includes('ssri') || cls.includes('snri') || drg.includes('sertraline') || drg.includes('escitalopram') || drg.includes('fluoxetine') || drg.includes('citalopram') || drg.includes('paroxetine') || drg.includes('venlafaxine') || drg.includes('duloxetine')) {
    rules.push({ effect: 'blocked', when: 'ctx.currentMeds.includes("maoi")', reason: 'Serotonin syndrome risk: SSRIs/SNRIs are contraindicated with MAOIs.' });
    rules.push({ effect: 'caution', when: 'ctx.age < 18', reason: 'Monitor closely for suicidality in youth starting antidepressants.' });
  }

  // Benzodiazepine rules
  if (cls.includes('benzodiazepine') || drg.includes('lorazepam') || drg.includes('diazepam') || drg.includes('clonazepam') || drg.includes('alprazolam')) {
    rules.push({ effect: 'caution', when: 'ctx.age >= 65', reason: 'Benzodiazepines increase fall risk and cognitive impairment in older adults (Beers criteria).' });
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("opioid")', reason: 'Combined benzodiazepine + opioid use increases respiratory depression risk.' });
    rules.push({ effect: 'caution', when: 'ctx.pregnancy === "yes"', reason: 'Benzodiazepines have pregnancy risks (neonatal withdrawal, possible teratogenicity).' });
  }

  // Opioid rules
  if (cls.includes('opioid') || drg.includes('codeine') || drg.includes('tramadol') || drg.includes('morphine') || drg.includes('hydromorphone') || drg.includes('oxycodone')) {
    rules.push({ effect: 'caution', when: 'ctx.age >= 65', reason: 'Opioids increase fall and sedation risk in older adults.' });
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("benzodiazepine") || ctx.currentMeds.includes("opioid")', reason: 'Risk of respiratory depression with concurrent sedatives.' });
    rules.push({ effect: 'caution', when: 'ctx.pregnancy === "yes"', reason: 'Opioids in pregnancy carry risk of neonatal abstinence syndrome.' });
  }

  // Corticosteroid (systemic) rules
  if ((cls.includes('corticosteroid') || drg.includes('prednisone') || drg.includes('prednisolone') || drg.includes('dexamethasone') || drg.includes('methylprednisolone') || drg.includes('hydrocortisone')) && !drg.includes('cream') && !drg.includes('ointment') && !drg.includes('nasal') && !drg.includes('inhale')) {
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("nsaid")', reason: 'Combined corticosteroid + NSAID use increases GI bleeding risk.' });
  }

  // Warfarin / anticoagulant rules
  if (drg.includes('warfarin') || drg.includes('apixaban') || drg.includes('rivaroxaban') || drg.includes('dabigatran') || drg.includes('edoxaban')) {
    rules.push({ effect: 'caution', when: 'ctx.currentMeds.includes("nsaid")', reason: 'NSAIDs with anticoagulants significantly increase bleeding risk.' });
    rules.push({ effect: 'blocked', when: 'ctx.pregnancy === "yes"', reason: 'Anticoagulants require careful pregnancy management (warfarin is teratogenic).' });
  }

  // PPI rules
  if (cls.includes('ppi') || cls.includes('proton pump') || drg.includes('omeprazole') || drg.includes('pantoprazole') || drg.includes('esomeprazole') || drg.includes('lansoprazole') || drg.includes('rabeprazole')) {
    // PPIs are generally safe but long-term use has concerns
  }

  // Specialist required
  // (handled separately via specialist field)

  return rules;
}

// ─── Parse dose string into order fields ─────────────────────────────
function parseDose(doseStr, drug) {
  const dose = doseStr || '';

  // Extract frequency
  let frequency = '';
  if (/\bonce daily\b/i.test(dose) || /\bQD\b/.test(dose) || /\bOD\b/.test(dose) || /\bdaily\b/i.test(dose)) frequency = 'OD';
  else if (/\btwice daily\b/i.test(dose) || /\bBID\b/i.test(dose)) frequency = 'BID';
  else if (/\bthree times daily\b/i.test(dose) || /\bTID\b/i.test(dose)) frequency = 'TID';
  else if (/\bfour times daily\b/i.test(dose) || /\bQID\b/i.test(dose)) frequency = 'QID';
  else if (/\bat bedtime\b/i.test(dose) || /\bQHS\b/i.test(dose)) frequency = 'QHS';
  else if (/\bevery (\d+) hours?\b/i.test(dose)) frequency = `Q${dose.match(/every (\d+) hours?/i)[1]}H`;
  else if (/\bonce\b/i.test(dose) || /\bsingle dose\b/i.test(dose)) frequency = 'once';
  else if (/\bweekly\b/i.test(dose)) frequency = 'weekly';
  else if (/\bmonthly\b/i.test(dose)) frequency = 'monthly';

  // Extract route
  let route = 'PO';
  if (/\b(topical|apply|cream|ointment|gel)\b/i.test(dose)) route = 'TOP';
  else if (/\bIM\b/.test(dose) || /intramuscular/i.test(dose)) route = 'IM';
  else if (/\bIV\b/.test(dose) || /intravenous/i.test(dose)) route = 'IV';
  else if (/\bSC\b/.test(dose) || /subcutaneous/i.test(dose)) route = 'SC';
  else if (/\bsublingual\b/i.test(dose) || /\bSL\b/.test(dose)) route = 'SL';
  else if (/\binhale\b/i.test(dose) || /\binhal/i.test(dose) || /\bpuff/i.test(dose) || /\bnebul/i.test(dose)) route = 'INH';
  else if (/\bnasal\b/i.test(dose) || /\bspray.*nostril\b/i.test(dose) || /\bnose\b/i.test(dose)) route = 'IN';
  else if (/\brectal\b/i.test(dose) || /\bPR\b/.test(dose) || /\bsuppository\b/i.test(dose)) route = 'PR';
  else if (/\bvaginal\b/i.test(dose)) route = 'VAG';
  else if (/\bophthalmic\b/i.test(dose) || /\beye drop/i.test(dose) || /\binto.*eye/i.test(dose)) route = 'OPH';
  else if (/\botic\b/i.test(dose) || /\bear drop/i.test(dose)) route = 'OT';

  // Extract duration
  let duration = '';
  const durMatch = dose.match(/(?:for\s+)?(\d+[\s–-]+\d+|\d+)\s*(day|week|month|year)s?\b/i);
  if (durMatch) duration = `${durMatch[1]} ${durMatch[2]}${durMatch[1] !== '1' ? 's' : ''}`;

  // Build sig
  let sig = dose;

  // Extract form
  let form = '';
  if (/\bcapsule/i.test(dose)) form = 'capsule';
  else if (/\btablet/i.test(dose)) form = 'tablet';
  else if (/\bcream/i.test(dose)) form = 'cream';
  else if (/\bointment/i.test(dose)) form = 'ointment';
  else if (/\bgel\b/i.test(dose)) form = 'gel';
  else if (/\bsolution/i.test(dose)) form = 'solution';
  else if (/\bsuspension/i.test(dose)) form = 'suspension';
  else if (/\bdrop/i.test(dose)) form = 'drops';
  else if (/\bspray/i.test(dose)) form = 'spray';
  else if (/\binhaler/i.test(dose)) form = 'inhaler';
  else if (/\bsachet/i.test(dose)) form = 'sachet';
  else if (/\bpatch/i.test(dose)) form = 'patch';
  else if (/\binjection/i.test(dose) || /\bvial/i.test(dose)) form = 'injection';
  else if (/\bsyrup/i.test(dose)) form = 'syrup';
  else if (/\bsuppository/i.test(dose)) form = 'suppository';
  else form = 'tablet'; // default

  // Extract quantity hint
  let quantity = '';
  const mgMatch = dose.match(/(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|mL|IU|units?)\b/i);
  const doseAmount = mgMatch ? mgMatch[0] : '';

  return { frequency, route, duration, sig, form, doseAmount, quantity };
}

// ─── Base preference by line of therapy ──────────────────────────────
function basePreference(line) {
  switch(line) {
    case '1st': return { CA: 90, US: 85, UK: 88 };
    case '2nd': return { CA: 78, US: 75, UK: 76 };
    case '3rd': return { CA: 65, US: 62, UK: 64 };
    case '4th': return { CA: 55, US: 52, UK: 54 };
    case '5th': return { CA: 45, US: 42, UK: 44 };
    case '6th': return { CA: 40, US: 38, UK: 39 };
    default: return { CA: 60, US: 58, UK: 59 };
  }
}

// ─── Generate catalog entry ─────────────────────────────────────────
function generateCatalogEntry(condSlug, entry, conditionName, category) {
  const drugSlug = slug(entry.drug);
  const id = `${drugSlug}-${condSlug}`;

  // Skip if already exists
  if (existingCatalogIds.has(id) || existingCatalogIds.has(drugSlug)) return null;

  const parsed = parseDose(entry.dose, entry.drug);
  const pref = basePreference(entry.line);
  const rules = generateRules(entry.drugClass, entry.drug, condSlug);
  const specialistNote = entry.specialist === 'Yes' ? ' Specialist referral recommended.' : '';

  // Build sig text
  const sigText = `${entry.drug} ${entry.dose}${specialistNote ? ' ' + specialistNote.trim() : ''}`;

  return {
    id,
    condition: condSlug,
    labels: `{ en: '${esc(entry.drug)}' }`,
    type: `{ en: '${esc(entry.line)} line — ${esc(entry.drugClass)}' }`,
    form: `{ en: '${esc(parsed.doseAmount)} ${parsed.form}' }`,
    rationale: `{ en: '${esc(entry.comments || `${entry.line} line ${entry.drugClass.toLowerCase()} for ${conditionName.toLowerCase()}.`)}' }`,
    pros: generatePros(entry),
    cons: generateCons(entry),
    evidence: `{ en: ['${esc(category)} formulary', '${esc(entry.line)} line therapy'] }`,
    basePreference: `{ CA: ${pref.CA}, US: ${pref.US}, UK: ${pref.UK} }`,
    regionData: generateRegionData(entry, pref),
    dose: `{ en: '${esc(entry.dose)}' }`,
    order: generateOrder(entry, parsed, specialistNote),
    symptomBoosts: '{}',
    rules: formatRules(rules),
  };
}

function esc(str) {
  return (str || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function generatePros(entry) {
  const pros = [];
  if (entry.line === '1st') pros.push('First-line recommended therapy');
  else if (entry.line === '2nd') pros.push('Well-established alternative');
  else pros.push('Available when first-line options are unsuitable');

  if (entry.specialist !== 'Yes') pros.push('Can be initiated in primary care');
  if (entry.brands) pros.push(`Available as ${entry.brands}`);
  if (/once daily/i.test(entry.dose) || /daily/i.test(entry.dose)) pros.push('Convenient dosing schedule');

  return `{ en: [${pros.map(p => `'${esc(p)}'`).join(', ')}] }`;
}

function generateCons(entry) {
  const cons = [];
  if (entry.specialist === 'Yes') cons.push('May require specialist initiation or oversight');
  if (entry.line !== '1st') cons.push('Not first-line; consider only after preferred options');
  if (entry.comments && entry.comments.includes('monitor')) cons.push('Requires monitoring');
  if (entry.comments && entry.comments.includes('side effect')) cons.push('Side effect profile requires discussion');
  if (cons.length === 0) cons.push('Review patient-specific factors before initiating');

  return `{ en: [${cons.map(c => `'${esc(c)}'`).join(', ')}] }`;
}

function generateRegionData(entry, pref) {
  const preferred = entry.line === '1st';
  return `{
      CA: { available: true, preferred: ${preferred}, formulary: '${esc(entry.line)} line', price: 0, codeSystem: 'DIN', code: 'FORMULARY' },
      US: { available: true, preferred: ${preferred}, formulary: '${esc(entry.line)} line', price: 0, codeSystem: 'RxNorm', code: 'FORMULARY' },
      UK: { available: true, preferred: ${preferred}, formulary: '${esc(entry.line)} line', price: 0, codeSystem: 'dm+d', code: 'FORMULARY' },
    }`;
}

function generateOrder(entry, parsed, specialistNote) {
  return `{
      medication: '${esc(entry.drug)}${parsed.doseAmount ? ' ' + esc(parsed.doseAmount) : ''} ${parsed.form}',
      sig: { en: '${esc(entry.dose)}${specialistNote ? ' ' + esc(specialistNote.trim()) : ''}' },
      dispense: '${parsed.form === 'cream' || parsed.form === 'ointment' || parsed.form === 'gel' ? '1 tube' : '30 ' + parsed.form + 's'}',
      refills: '${entry.line === '1st' ? '2' : '0'}',
      duration: '${esc(parsed.duration || '30 days')}',
      pharmacy: { en: '${esc(entry.comments || entry.drug + ' for ' + entry.drugClass.toLowerCase())}' },
    }`;
}

function formatRules(rules) {
  if (rules.length === 0) return '[]';
  const lines = rules.map(r => {
    return `{ effect: '${r.effect}', when: (ctx) => ${r.when}, reason: { en: '${esc(r.reason)}' } }`;
  });
  return `[\n      ${lines.join(',\n      ')},\n    ]`;
}

// ─── Main generation ─────────────────────────────────────────────────

const newConditions = [];
const catalogEntries = [];
const conditionSlugs = new Map(); // formulary condition → slug

// Process all formulary entries
for (const [category, conditions] of Object.entries(formulary)) {
  const domain = CATEGORY_TO_DOMAIN[category];
  const subtype = CATEGORY_TO_SUBTYPE[category];

  for (const [condName, drugs] of Object.entries(conditions)) {
    // Get or create condition slug
    let condSlug = CONDITION_OVERRIDES[condName] || slug(condName);
    conditionSlugs.set(`${category}|${condName}`, condSlug);

    // Add new condition if not existing
    if (!EXISTING_CONDITIONS.has(condSlug)) {
      // Check we haven't already added this slug
      if (!newConditions.find(c => c.value === condSlug)) {
        newConditions.push({
          value: condSlug,
          domain,
          subtype,
          en: condName,
          summary: `${drugs[0]?.drugClass || 'Pharmacotherapy'}-based review for ${condName.toLowerCase()} in primary care.`,
        });
      }
    }

    // Generate catalog entries for each drug
    for (const drug of drugs) {
      const entry = generateCatalogEntry(condSlug, drug, condName, category);
      if (entry) catalogEntries.push(entry);
    }
  }
}

console.log(`New conditions to add: ${newConditions.length}`);
console.log(`New catalog entries: ${catalogEntries.length}`);

// ─── Write new conditions file (to append to app-data.js) ────────────
let conditionsJs = `// ─── Auto-generated conditions from formulary ───────────────────────
// Append these to the CONDITIONS array in app-data.js

const NEW_CONDITIONS = [\n`;

for (const c of newConditions) {
  conditionsJs += `  {
    value: '${c.value}',
    domain: '${c.domain}',
    subtype: '${c.subtype}',
    en: '${esc(c.en)}',
    summary: { en: '${esc(c.summary)}' },
  },\n`;
}
conditionsJs += '];\n';
fs.writeFileSync('generated-conditions.js', conditionsJs);

// ─── Write catalog files (split into chunks) ─────────────────────────
const CHUNK_SIZE = 60;
const chunks = [];
for (let i = 0; i < catalogEntries.length; i += CHUNK_SIZE) {
  chunks.push(catalogEntries.slice(i, i + CHUNK_SIZE));
}

const fileLetters = ['f', 'g', 'h', 'i', 'j', 'k'];
chunks.forEach((chunk, idx) => {
  const letter = fileLetters[idx] || `extra-${idx}`;
  let js = `// app-catalog-${letter}.js — Auto-generated from formulary data
// ${chunk.length} entries

(function () {
  const C = window.TOLCatalog;
  if (!C) { console.error('TOLCatalog not found'); return; }

  const entries = [\n`;

  for (const entry of chunk) {
    js += `    {
      id: '${entry.id}',
      condition: '${entry.condition}',
      labels: ${entry.labels},
      type: ${entry.type},
      form: ${entry.form},
      rationale: ${entry.rationale},
      pros: ${entry.pros},
      cons: ${entry.cons},
      evidence: ${entry.evidence},
      basePreference: ${entry.basePreference},
      regionData: ${entry.regionData},
      dose: ${entry.dose},
      order: ${entry.order},
      symptomBoosts: ${entry.symptomBoosts},
      rules: ${entry.rules},
    },\n`;
  }

  js += `  ];

  entries.forEach(e => C.push(e));
})();
`;

  fs.writeFileSync(`app-catalog-${letter}.js`, js);
  console.log(`Written app-catalog-${letter}.js (${chunk.length} entries)`);
});

// ─── Write domains/subtypes additions ────────────────────────────────
let configAdditions = `// ─── New domains and subtypes to add to app-config.js ───────────────

// Add to DOMAINS array:
const NEW_DOMAINS_TO_ADD = [\n`;
for (const d of NEW_DOMAINS) {
  configAdditions += `  { value: '${d.value}', en: '${esc(d.en)}', fr: '${esc(d.fr)}' },\n`;
}
configAdditions += `];\n\n// Add to SUBTYPES array:\nconst NEW_SUBTYPES_TO_ADD = [\n`;
for (const s of NEW_SUBTYPES) {
  configAdditions += `  { value: '${s.value}', domain: '${s.domain}', en: '${esc(s.en)}', fr: '${esc(s.fr)}' },\n`;
}
configAdditions += '];\n';
fs.writeFileSync('generated-config-additions.js', configAdditions);

console.log('\nDone! Files generated:');
console.log('  generated-conditions.js — New conditions for app-data.js');
console.log('  generated-config-additions.js — New domains/subtypes for app-config.js');
chunks.forEach((_, idx) => {
  console.log(`  app-catalog-${fileLetters[idx]}.js — Catalog entries`);
});
