// ARBs + SGLT2 inhibitors — added 2026-04 from doctor partner feedback.
// These are 2026 first-line therapy across HTN, T2DM, HF, and CKD; the catalog
// previously had ACEi + statins + insulin but lacked these classes entirely.
//
// renalDosing:
//   { thresholds: [{ minEgfr, maxEgfr, dose, sig, note }], stopBelow }
// Rendered by app-logic.js → output panel as an "Adjusted for eGFR X" block.

(function () {
  const C = window.TOLCatalog;
  if (!C) { console.error('TOLCatalog not found'); return; }

  const ARB_ENTRIES = [
    {
      id: 'losartan-hypertension',
      condition: 'hypertension',
      labels: { en: 'Losartan' },
      type: { en: 'ARB first-line (ACEi cough alternative)' },
      form: { en: '50 mg tablet' },
      rationale: { en: 'ARB equivalent to ACEi for HTN. Preferred when ACEi cough/angioedema occurs. Renal-protective in diabetes.' },
      pros: { en: ['No cough (vs ACEi)', 'Once-daily', 'Renal protection in diabetes / CKD with proteinuria'] },
      cons: { en: ['Hyperkalemia risk', 'Monitor creatinine + K+', 'Contraindicated in pregnancy'] },
      evidence: { en: ['Hypertension Canada / NICE first-line', 'LIFE trial', 'RENAAL renal protection'] },
      basePreference: { CA: 88, US: 86, UK: 90 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB listed', price: 7.8, codeSystem: 'DIN', code: '02241007' },
        US: { available: true, preferred: true, formulary: 'Tier 1 generic', price: 6.4, codeSystem: 'RxNorm', code: '52175' },
        UK: { available: true, preferred: true, formulary: 'First-line NICE', price: 1.6, codeSystem: 'dm+d', code: 'DEMO-UK-LOSA' },
      },
      dose: { en: 'Losartan 50 mg by mouth once daily. Titrate to 100 mg if tolerated.' },
      order: {
        medication: 'Losartan 50 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'ARB initiation. Check creatinine and K+ at 1-2 weeks.' },
      },
      symptomBoosts: { stageOne: 2, stageTwo: 3, diabetes: 4, ckd: 4, aceiCough: 8, proteinuria: 5 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'ARBs are contraindicated in pregnancy — teratogenic.' } },
        { effect: 'blocked', when: (ctx) => ctx.allergies.includes('arb'), reason: { en: 'ARB allergy or prior angioedema.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('acei'), reason: { en: 'Avoid dual ACEi + ARB blockade — increased adverse events.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('k-sparing-diuretic') || ctx.currentMeds.includes('spironolactone'), reason: { en: 'Hyperkalemia risk with K-sparing diuretic.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 30, reason: { en: 'eGFR < 30 — start lower dose, monitor closely.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 60, dose: '25 mg once daily', sig: 'Take 1 tablet (25 mg) by mouth once daily.', note: 'Reduced dose for eGFR 30-60. Recheck creatinine + K+ at 1-2 weeks.' },
          { minEgfr: 0, maxEgfr: 30, dose: '12.5-25 mg once daily', sig: 'Take 1 tablet (12.5 mg) by mouth once daily. Titrate cautiously.', note: 'eGFR < 30 — start very low and titrate. Check K+ within 1 week.' },
        ],
      },
    },
    {
      id: 'valsartan-hypertension',
      condition: 'hypertension',
      labels: { en: 'Valsartan' },
      type: { en: 'ARB alternative' },
      form: { en: '80 mg tablet' },
      rationale: { en: 'Long-acting ARB with strong evidence in HF and post-MI. Good alternative when losartan not tolerated.' },
      pros: { en: ['Strong HF + post-MI evidence', 'Once-daily', 'No cough'] },
      cons: { en: ['Hyperkalemia risk', 'Cost slightly higher than losartan'] },
      evidence: { en: ['Val-HeFT trial', 'VALIANT post-MI'] },
      basePreference: { CA: 80, US: 84, UK: 78 },
      regionData: {
        CA: { available: true, preferred: false, formulary: 'ODB listed', price: 11.5, codeSystem: 'DIN', code: '02244781' },
        US: { available: true, preferred: true, formulary: 'Tier 1 generic', price: 8.9, codeSystem: 'RxNorm', code: '69749' },
        UK: { available: true, preferred: false, formulary: 'NHS listed', price: 2.1, codeSystem: 'dm+d', code: 'DEMO-UK-VALS' },
      },
      dose: { en: 'Valsartan 80 mg by mouth once daily. May titrate to 320 mg.' },
      order: {
        medication: 'Valsartan 80 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'ARB initiation. Recheck creatinine + K+ at 1-2 weeks.' },
      },
      symptomBoosts: { stageTwo: 3, postMi: 5, heartFailure: 4, aceiCough: 6 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'ARBs are contraindicated in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('acei'), reason: { en: 'Avoid dual ACEi + ARB blockade.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 60, dose: '40 mg once daily', sig: 'Take 1 tablet (40 mg) by mouth once daily.', note: 'Halve starting dose for eGFR 30-60.' },
          { minEgfr: 0, maxEgfr: 30, dose: '40 mg once daily', sig: 'Take 1 tablet (40 mg) by mouth once daily. Titrate cautiously.', note: 'eGFR < 30 — use with specialist input. Check K+ weekly initially.' },
        ],
      },
    },
    {
      id: 'candesartan-hypertension',
      condition: 'hypertension',
      labels: { en: 'Candesartan' },
      type: { en: 'ARB alternative — long half-life' },
      form: { en: '8 mg tablet' },
      rationale: { en: 'Long half-life ARB with smooth 24h coverage. Good evidence in HFrEF.' },
      pros: { en: ['Forgiving once-daily', 'CHARM-Alternative HF data', 'Smooth BP control'] },
      cons: { en: ['Hyperkalemia risk', 'Same monitoring as other ARBs'] },
      evidence: { en: ['CHARM-Alternative trial', 'NICE alternative'] },
      basePreference: { CA: 78, US: 74, UK: 86 },
      regionData: {
        CA: { available: true, preferred: false, formulary: 'ODB listed', price: 9.4, codeSystem: 'DIN', code: '02239090' },
        US: { available: true, preferred: false, formulary: 'Tier 2', price: 14.2, codeSystem: 'RxNorm', code: '214354' },
        UK: { available: true, preferred: true, formulary: 'NICE alternative', price: 1.4, codeSystem: 'dm+d', code: 'DEMO-UK-CAND' },
      },
      dose: { en: 'Candesartan 8 mg by mouth once daily. May titrate to 32 mg.' },
      order: {
        medication: 'Candesartan 8 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'ARB initiation. Recheck creatinine + K+ at 1-2 weeks.' },
      },
      symptomBoosts: { heartFailure: 5, aceiCough: 6 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'ARBs are contraindicated in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('acei'), reason: { en: 'Avoid dual ACEi + ARB blockade.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 60, dose: '4 mg once daily', sig: 'Take 1 tablet (4 mg) by mouth once daily.', note: 'Reduce starting dose for eGFR 30-60.' },
          { minEgfr: 0, maxEgfr: 30, dose: '4 mg once daily', sig: 'Take 1 tablet (4 mg) by mouth once daily. Titrate cautiously.', note: 'eGFR < 30 — use with specialist input.' },
        ],
      },
    },
    // Heart-failure indication for ARBs (separate entry so it shows up under HF condition)
    {
      id: 'candesartan-heart-failure',
      condition: 'heart-failure',
      labels: { en: 'Candesartan' },
      type: { en: 'ARB for HFrEF (ACEi-intolerant)' },
      form: { en: '4 mg tablet' },
      rationale: { en: 'ARB with HFrEF mortality benefit (CHARM-Alternative). Use when ACEi cough or angioedema. Now often substituted by ARNI (sacubitril/valsartan) per current guidelines.' },
      pros: { en: ['HFrEF mortality benefit', 'Tolerated in ACEi-intolerant', 'Once-daily'] },
      cons: { en: ['Less preferred than ARNI in HFrEF', 'Hyperkalemia + creatinine bump'] },
      evidence: { en: ['CHARM-Alternative', 'CCS / ESC HF guidelines'] },
      basePreference: { CA: 70, US: 66, UK: 78 },
      regionData: {
        CA: { available: true, preferred: false, formulary: 'ODB listed', price: 9.4, codeSystem: 'DIN', code: '02239090' },
        US: { available: true, preferred: false, formulary: 'Tier 2', price: 14.2, codeSystem: 'RxNorm', code: '214354' },
        UK: { available: true, preferred: true, formulary: 'NICE HF alternative', price: 1.4, codeSystem: 'dm+d', code: 'DEMO-UK-CAND-HF' },
      },
      dose: { en: 'Candesartan 4 mg by mouth once daily; double every 2 weeks to target 32 mg as tolerated.' },
      order: {
        medication: 'Candesartan 4 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily. Up-titrate every 2 weeks to target 32 mg.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'HF up-titration plan. Recheck K+, creatinine, BP at each step.' },
      },
      symptomBoosts: { aceiCough: 8, hfPreserved: 2 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'ARBs are contraindicated in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('acei'), reason: { en: 'Do not combine with ACEi for HF.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 60, dose: '4 mg once daily', sig: 'Take 1 tablet (4 mg) by mouth once daily. Titrate cautiously to 8 mg.', note: 'Slow titration in eGFR 30-60.' },
        ],
        stopBelow: 15,
      },
    },
    // CKD with proteinuria — losartan
    {
      id: 'losartan-ckd',
      condition: 'chronic-kidney-disease',
      labels: { en: 'Losartan (renal protection)' },
      type: { en: 'ARB for proteinuric CKD' },
      form: { en: '50 mg tablet' },
      rationale: { en: 'ARB slows progression of proteinuric CKD (RENAAL). First-line in diabetic and non-diabetic CKD with albuminuria.' },
      pros: { en: ['Slows CKD progression', 'Reduces proteinuria', 'Tolerated long-term'] },
      cons: { en: ['Acute creatinine bump expected (up to 30%)', 'Hyperkalemia in advanced CKD', 'Hold if AKI / volume depletion'] },
      evidence: { en: ['RENAAL trial', 'IDNT trial', 'KDIGO guideline'] },
      basePreference: { CA: 92, US: 90, UK: 92 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB listed', price: 7.8, codeSystem: 'DIN', code: '02241007' },
        US: { available: true, preferred: true, formulary: 'Tier 1 generic', price: 6.4, codeSystem: 'RxNorm', code: '52175' },
        UK: { available: true, preferred: true, formulary: 'NICE CKD', price: 1.6, codeSystem: 'dm+d', code: 'DEMO-UK-LOSA-CKD' },
      },
      dose: { en: 'Losartan 50 mg by mouth once daily. Titrate to 100 mg as tolerated.' },
      order: {
        medication: 'Losartan 50 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'CKD renal protection. Recheck creatinine + K+ within 1-2 weeks.' },
      },
      symptomBoosts: { proteinuria: 8, diabetes: 5, hypertension: 4 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'ARBs are contraindicated in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('acei'), reason: { en: 'Avoid dual ACEi + ARB.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 30, reason: { en: 'eGFR < 30 — start very low. Specialist input recommended.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 60, dose: '25 mg once daily', sig: 'Take 1 tablet (25 mg) by mouth once daily.', note: 'eGFR 30-60: start at 25 mg.' },
          { minEgfr: 0, maxEgfr: 30, dose: '12.5-25 mg once daily', sig: 'Take 1 tablet (12.5 mg) by mouth once daily.', note: 'eGFR < 30: start at 12.5 mg, titrate slowly with weekly K+/Cr checks.' },
        ],
      },
    },
  ];

  const SGLT2_ENTRIES = [
    {
      id: 'empagliflozin-type2-diabetes',
      condition: 'type2-diabetes',
      labels: { en: 'Empagliflozin' },
      type: { en: 'SGLT2 inhibitor — first-line add-on' },
      form: { en: '10 mg tablet' },
      rationale: { en: 'SGLT2 inhibitor with mortality + CV outcome benefit (EMPA-REG). 2026 first-line add-on after metformin, especially with CV disease, HF, or CKD.' },
      pros: { en: ['CV mortality benefit (EMPA-REG)', 'Weight loss + BP reduction', 'HF + CKD benefit'] },
      cons: { en: ['Genital mycotic infection risk', 'Euglycemic DKA (rare)', 'Volume depletion in elderly', 'Hold if NPO / acute illness'] },
      evidence: { en: ['EMPA-REG OUTCOME', 'EMPEROR HF trials', 'Diabetes Canada / ADA first-line add-on'] },
      basePreference: { CA: 90, US: 92, UK: 88 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB LU code (CV/CKD)', price: 92.0, codeSystem: 'DIN', code: '02443937' },
        US: { available: true, preferred: true, formulary: 'Tier 2', price: 580, codeSystem: 'RxNorm', code: '1545653' },
        UK: { available: true, preferred: true, formulary: 'NICE first-line add-on (T2DM + CV/HF/CKD)', price: 36.6, codeSystem: 'dm+d', code: 'DEMO-UK-EMPA' },
      },
      dose: { en: 'Empagliflozin 10 mg by mouth once daily. May titrate to 25 mg.' },
      order: {
        medication: 'Empagliflozin 10 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily in the morning.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'SGLT2 initiation. Counsel on genital hygiene. Hold during acute illness / NPO.' },
      },
      symptomBoosts: { cvd: 6, heartFailure: 8, ckd: 7, weightConcern: 4, postMi: 5 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'SGLT2 inhibitors are not recommended in pregnancy.' } },
        { effect: 'blocked', when: (ctx) => ctx.allergies.includes('sglt2'), reason: { en: 'SGLT2 inhibitor allergy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('insulin') || ctx.currentMeds.includes('sulfonylurea'), reason: { en: 'Hypoglycemia risk if combined with insulin or sulfonylurea — consider reducing those doses.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 30, reason: { en: 'eGFR < 30 — glucose-lowering effect minimal. CV/HF benefit may persist; specialist input.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 30, maxEgfr: 45, dose: '10 mg once daily', sig: 'Take 1 tablet (10 mg) by mouth once daily.', note: 'eGFR 30-45: 10 mg only — do not titrate to 25 mg. Glucose-lowering reduced; CV/HF/CKD benefit retained.' },
          { minEgfr: 20, maxEgfr: 30, dose: '10 mg once daily', sig: 'Take 1 tablet (10 mg) by mouth once daily.', note: 'eGFR 20-30: HF/CKD benefit only. No glucose effect. Continue if already established.' },
        ],
        stopBelow: 20,
      },
    },
    {
      id: 'dapagliflozin-type2-diabetes',
      condition: 'type2-diabetes',
      labels: { en: 'Dapagliflozin' },
      type: { en: 'SGLT2 inhibitor — first-line add-on alternative' },
      form: { en: '10 mg tablet' },
      rationale: { en: 'SGLT2 inhibitor with HF + CKD outcome benefit (DAPA-HF, DAPA-CKD). Equivalent class effect to empagliflozin.' },
      pros: { en: ['DAPA-HF + DAPA-CKD outcomes', 'Once-daily', 'Weight + BP benefit'] },
      cons: { en: ['Genital mycotic infections', 'Euglycemic DKA risk', 'Hold if acute illness'] },
      evidence: { en: ['DAPA-HF', 'DAPA-CKD', 'DECLARE-TIMI 58'] },
      basePreference: { CA: 86, US: 88, UK: 90 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB LU code (CV/CKD)', price: 88.5, codeSystem: 'DIN', code: '02436841' },
        US: { available: true, preferred: true, formulary: 'Tier 2', price: 565, codeSystem: 'RxNorm', code: '1488564' },
        UK: { available: true, preferred: true, formulary: 'NICE first-line add-on', price: 36.6, codeSystem: 'dm+d', code: 'DEMO-UK-DAPA' },
      },
      dose: { en: 'Dapagliflozin 10 mg by mouth once daily.' },
      order: {
        medication: 'Dapagliflozin 10 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily in the morning.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'SGLT2 initiation. Counsel on hygiene. Hold during acute illness.' },
      },
      symptomBoosts: { cvd: 6, heartFailure: 8, ckd: 8, hfPreserved: 6 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'SGLT2 inhibitors are not recommended in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('insulin') || ctx.currentMeds.includes('sulfonylurea'), reason: { en: 'Hypoglycemia risk with insulin / sulfonylurea — adjust those doses.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 25, reason: { en: 'eGFR < 25 — do not initiate. Continue if already established.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 25, maxEgfr: 45, dose: '10 mg once daily', sig: 'Take 1 tablet (10 mg) by mouth once daily.', note: 'eGFR 25-45: 10 mg. CKD/HF benefit retained; glucose effect reduced.' },
        ],
        stopBelow: 25,
      },
    },
    // Heart-failure entries — both classes have HFrEF + HFpEF mortality benefit
    {
      id: 'empagliflozin-heart-failure',
      condition: 'heart-failure',
      labels: { en: 'Empagliflozin (HFrEF/HFpEF)' },
      type: { en: 'SGLT2 inhibitor — first-line in HF' },
      form: { en: '10 mg tablet' },
      rationale: { en: 'SGLT2 inhibitors are now part of the four pillars of GDMT for HFrEF, with proven benefit in HFpEF (EMPEROR-Preserved). Add regardless of diabetes status.' },
      pros: { en: ['HFrEF + HFpEF mortality benefit', 'Reduces HF hospitalisations', 'Add at any LVEF'] },
      cons: { en: ['Genital infection risk', 'Hold if NPO / acute illness'] },
      evidence: { en: ['EMPEROR-Reduced', 'EMPEROR-Preserved', 'CCS / ESC HF GDMT'] },
      basePreference: { CA: 92, US: 90, UK: 92 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB LU code (HF)', price: 92.0, codeSystem: 'DIN', code: '02443937' },
        US: { available: true, preferred: true, formulary: 'Tier 2', price: 580, codeSystem: 'RxNorm', code: '1545653' },
        UK: { available: true, preferred: true, formulary: 'NICE HF', price: 36.6, codeSystem: 'dm+d', code: 'DEMO-UK-EMPA-HF' },
      },
      dose: { en: 'Empagliflozin 10 mg by mouth once daily, regardless of diabetes status.' },
      order: {
        medication: 'Empagliflozin 10 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'HF GDMT pillar. Hold during acute illness / NPO.' },
      },
      symptomBoosts: { hfPreserved: 8, hfReduced: 8, ckd: 5 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Not recommended in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 20, reason: { en: 'eGFR < 20 — limited data. Specialist input.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 20, maxEgfr: 45, dose: '10 mg once daily', sig: 'Take 1 tablet (10 mg) by mouth once daily.', note: 'HF benefit retained at low eGFR. No dose change needed at 20-45.' },
        ],
        stopBelow: 20,
      },
    },
    // CKD slowing — dapagliflozin (DAPA-CKD)
    {
      id: 'dapagliflozin-ckd',
      condition: 'chronic-kidney-disease',
      labels: { en: 'Dapagliflozin (CKD)' },
      type: { en: 'SGLT2 inhibitor for proteinuric CKD' },
      form: { en: '10 mg tablet' },
      rationale: { en: 'Slows CKD progression in diabetic and non-diabetic CKD with albuminuria (DAPA-CKD). Add to ACEi/ARB.' },
      pros: { en: ['Slows CKD progression', 'Reduces all-cause mortality', 'Add on top of ARB/ACEi'] },
      cons: { en: ['Genital infections', 'Acute creatinine dip on initiation', 'Hold if NPO / acute illness'] },
      evidence: { en: ['DAPA-CKD', 'KDIGO 2024 guideline', 'EMPA-KIDNEY (class effect)'] },
      basePreference: { CA: 92, US: 92, UK: 94 },
      regionData: {
        CA: { available: true, preferred: true, formulary: 'ODB LU code (CKD)', price: 88.5, codeSystem: 'DIN', code: '02436841' },
        US: { available: true, preferred: true, formulary: 'Tier 2', price: 565, codeSystem: 'RxNorm', code: '1488564' },
        UK: { available: true, preferred: true, formulary: 'NICE CKD', price: 36.6, codeSystem: 'dm+d', code: 'DEMO-UK-DAPA-CKD' },
      },
      dose: { en: 'Dapagliflozin 10 mg by mouth once daily, regardless of diabetes status.' },
      order: {
        medication: 'Dapagliflozin 10 mg tablet',
        sig: { en: 'Take 1 tablet by mouth once daily.' },
        dispense: '30 tablets',
        refills: '3',
        duration: '30 days',
        pharmacy: { en: 'CKD renal protection. Add on top of ACEi/ARB. Hold during acute illness.' },
      },
      symptomBoosts: { proteinuria: 9, diabetes: 5 },
      rules: [
        { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Not recommended in pregnancy.' } },
        { effect: 'caution', when: (ctx) => ctx.egfr < 25, reason: { en: 'eGFR < 25 — do not initiate. Continue if already established.' } },
      ],
      renalDosing: {
        thresholds: [
          { minEgfr: 25, maxEgfr: 60, dose: '10 mg once daily', sig: 'Take 1 tablet (10 mg) by mouth once daily.', note: 'CKD benefit retained at low eGFR. No dose change.' },
        ],
        stopBelow: 25,
      },
    },
  ];

  C.push(...ARB_ENTRIES, ...SGLT2_ENTRIES);
})();
