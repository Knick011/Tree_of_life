// Tree of Life — Drug-drug interaction layer (V1 starter dictionary)
// Cross-references the currently-selected medication against the patient's currentMeds.
// Designed to be additive: it does NOT change ranking. It surfaces in globalChecks as
// 'caution' or 'blocked' notices the doctor sees before copying.

(function (global) {
  // Match a drug-string against a known class. Patterns are lowercased substring tests
  // intentionally tolerant — V1 quality, not a commercial drug DB.
  const CLASS_PATTERNS = {
    warfarin: [/warfarin/i, /coumadin/i],
    doac: [/apixaban/i, /rivaroxaban/i, /edoxaban/i, /dabigatran/i, /eliquis/i, /xarelto/i, /pradaxa/i],
    nsaid: [/ibuprofen/i, /naproxen/i, /diclofenac/i, /celecoxib/i, /meloxicam/i, /ketorolac/i, /aspirin\b/i],
    'macrolide-qt': [/azithromycin/i, /clarithromycin/i, /erythromycin/i],
    'fluoroquinolone-qt': [/ciprofloxacin/i, /levofloxacin/i, /moxifloxacin/i],
    'qt-other': [/citalopram/i, /escitalopram/i, /haloperidol/i, /ondansetron/i, /amiodarone/i, /sotalol/i],
    'k-sparing': [/spironolactone/i, /eplerenone/i, /amiloride/i, /triamterene/i],
    acei: [/lisinopril/i, /ramipril/i, /enalapril/i, /perindopril/i, /captopril/i],
    arb: [/losartan/i, /valsartan/i, /candesartan/i, /telmisartan/i, /irbesartan/i],
    statin: [/atorvastatin/i, /simvastatin/i, /rosuvastatin/i, /pravastatin/i, /lovastatin/i],
    ssri: [/sertraline/i, /fluoxetine/i, /paroxetine/i, /escitalopram/i, /citalopram/i],
    tramadol: [/tramadol/i],
    triptan: [/sumatriptan/i, /rizatriptan/i, /eletriptan/i, /zolmitriptan/i],
    maoi: [/phenelzine/i, /tranylcypromine/i, /selegiline/i],
    benzo: [/lorazepam/i, /diazepam/i, /clonazepam/i, /alprazolam/i, /temazepam/i],
    opioid: [/morphine/i, /oxycodone/i, /hydromorphone/i, /codeine/i, /fentanyl/i, /tramadol/i],
    digoxin: [/digoxin/i, /lanoxin/i],
    metformin: [/metformin/i],
    'sulfonylurea': [/glipizide/i, /glyburide/i, /glimepiride/i],
    insulin: [/insulin/i],
    levothyroxine: [/levothyroxine/i, /synthroid/i],
    methotrexate: [/methotrexate/i],
    lithium: [/\blithium\b/i],
    sildenafil: [/sildenafil/i, /tadalafil/i, /vardenafil/i],
    nitrate: [/nitroglycerin/i, /isosorbide/i],
    clopidogrel: [/clopidogrel/i],
    ppi: [/omeprazole/i, /pantoprazole/i, /esomeprazole/i, /lansoprazole/i, /rabeprazole/i],
    allopurinol: [/allopurinol/i],
    azathioprine: [/azathioprine/i],
    'tmp-smx': [/sulfamethoxazole/i, /trimethoprim/i, /co-?trimoxazole/i, /bactrim/i, /septra/i],
  };

  // High-severity pairs. effect: 'blocked' or 'caution'. message is shown to doctor.
  const PAIRS = [
    { a: 'warfarin', b: 'nsaid', effect: 'blocked', message: 'Warfarin + NSAID significantly increases GI bleeding risk.' },
    { a: 'warfarin', b: 'tmp-smx', effect: 'blocked', message: 'TMP-SMX potentiates warfarin — major INR rise.' },
    { a: 'warfarin', b: 'macrolide-qt', effect: 'caution', message: 'Macrolides can raise INR with warfarin.' },
    { a: 'warfarin', b: 'fluoroquinolone-qt', effect: 'caution', message: 'Fluoroquinolones can raise INR with warfarin.' },
    { a: 'doac', b: 'nsaid', effect: 'caution', message: 'DOAC + NSAID increases bleeding risk.' },
    { a: 'acei', b: 'k-sparing', effect: 'caution', message: 'ACEi + potassium-sparing diuretic — risk of hyperkalemia.' },
    { a: 'arb', b: 'k-sparing', effect: 'caution', message: 'ARB + potassium-sparing diuretic — risk of hyperkalemia.' },
    { a: 'acei', b: 'arb', effect: 'caution', message: 'Dual ACEi + ARB not recommended.' },
    { a: 'statin', b: 'macrolide-qt', effect: 'caution', message: 'Macrolides (esp. clarithromycin/erythromycin) raise statin levels — myopathy risk.' },
    { a: 'macrolide-qt', b: 'qt-other', effect: 'caution', message: 'Combined QT-prolonging agents.' },
    { a: 'fluoroquinolone-qt', b: 'qt-other', effect: 'caution', message: 'Combined QT-prolonging agents.' },
    { a: 'macrolide-qt', b: 'fluoroquinolone-qt', effect: 'caution', message: 'Combined QT-prolonging antibiotics.' },
    { a: 'ssri', b: 'tramadol', effect: 'caution', message: 'SSRI + tramadol — serotonin syndrome risk.' },
    { a: 'ssri', b: 'triptan', effect: 'caution', message: 'SSRI + triptan — serotonin syndrome risk.' },
    { a: 'ssri', b: 'maoi', effect: 'blocked', message: 'SSRI + MAOI — contraindicated, serotonin syndrome.' },
    { a: 'tramadol', b: 'maoi', effect: 'blocked', message: 'Tramadol + MAOI — contraindicated.' },
    { a: 'opioid', b: 'benzo', effect: 'caution', message: 'Opioid + benzodiazepine — respiratory depression risk.' },
    { a: 'sildenafil', b: 'nitrate', effect: 'blocked', message: 'PDE5 inhibitor + nitrate — severe hypotension; contraindicated.' },
    { a: 'digoxin', b: 'macrolide-qt', effect: 'caution', message: 'Macrolides raise digoxin levels.' },
    { a: 'digoxin', b: 'k-sparing', effect: 'caution', message: 'Spironolactone interferes with digoxin assay; toxicity risk.' },
    { a: 'metformin', b: 'tmp-smx', effect: 'caution', message: 'TMP-SMX may raise metformin levels.' },
    { a: 'sulfonylurea', b: 'tmp-smx', effect: 'caution', message: 'TMP-SMX potentiates sulfonylureas — hypoglycemia risk.' },
    { a: 'lithium', b: 'nsaid', effect: 'caution', message: 'NSAIDs raise lithium levels.' },
    { a: 'lithium', b: 'acei', effect: 'caution', message: 'ACEi raise lithium levels.' },
    { a: 'methotrexate', b: 'nsaid', effect: 'caution', message: 'NSAIDs raise methotrexate toxicity.' },
    { a: 'methotrexate', b: 'tmp-smx', effect: 'blocked', message: 'TMP-SMX + methotrexate — bone marrow toxicity.' },
    { a: 'allopurinol', b: 'azathioprine', effect: 'blocked', message: 'Allopurinol + azathioprine — severe myelosuppression.' },
    { a: 'clopidogrel', b: 'ppi', effect: 'caution', message: 'Omeprazole/esomeprazole reduces clopidogrel efficacy.' },
    { a: 'levothyroxine', b: 'ppi', effect: 'caution', message: 'PPIs may reduce levothyroxine absorption.' },
  ];

  function classifyDrug(text) {
    if (!text) return [];
    const found = [];
    Object.entries(CLASS_PATTERNS).forEach(([cls, patterns]) => {
      if (patterns.some((p) => p.test(text))) found.push(cls);
    });
    return found;
  }

  // Known string aliases that map a 'currentMeds' option (e.g. 'warfarin') directly to a class.
  // Falls back to text classification if not found.
  const ALIAS_MAP = {
    warfarin: 'warfarin',
    doac: 'doac',
    nsaid: 'nsaid',
    aspirin: 'nsaid',
    ssri: 'ssri',
    metformin: 'metformin',
    insulin: 'insulin',
    levothyroxine: 'levothyroxine',
    digoxin: 'digoxin',
    'k-sparing-diuretic': 'k-sparing',
    acei: 'acei',
    arb: 'arb',
    statin: 'statin',
    opioid: 'opioid',
    benzo: 'benzo',
    benzodiazepine: 'benzo',
    methotrexate: 'methotrexate',
    lithium: 'lithium',
    nitrate: 'nitrate',
    sildenafil: 'sildenafil',
    clopidogrel: 'clopidogrel',
    ppi: 'ppi',
    allopurinol: 'allopurinol',
    azathioprine: 'azathioprine',
  };

  function classifyCurrentMed(value) {
    if (!value) return [];
    const direct = ALIAS_MAP[String(value).toLowerCase()];
    if (direct) return [direct];
    return classifyDrug(String(value));
  }

  // Returns array of { level: 'caution'|'blocked', title, body }
  function check(selectedMedicationText, currentMeds) {
    if (!selectedMedicationText || !Array.isArray(currentMeds) || !currentMeds.length) return [];
    const selectedClasses = classifyDrug(selectedMedicationText);
    if (!selectedClasses.length) return [];
    const currentClasses = new Set();
    currentMeds.forEach((m) => classifyCurrentMed(m).forEach((c) => currentClasses.add(c)));
    if (!currentClasses.size) return [];
    const hits = [];
    PAIRS.forEach((pair) => {
      const aHit = selectedClasses.includes(pair.a) && currentClasses.has(pair.b);
      const bHit = selectedClasses.includes(pair.b) && currentClasses.has(pair.a);
      if (aHit || bHit) {
        hits.push({
          level: pair.effect === 'blocked' ? 'blocked' : 'caution',
          title: pair.effect === 'blocked' ? 'Drug interaction — contraindicated' : 'Drug interaction — caution',
          body: pair.message,
        });
      }
    });
    // De-dupe identical messages
    const seen = new Set();
    return hits.filter((h) => {
      if (seen.has(h.body)) return false;
      seen.add(h.body);
      return true;
    });
  }

  global.TOLInteractions = { check, classifyDrug, classifyCurrentMed };
})(typeof window !== 'undefined' ? window : globalThis);
