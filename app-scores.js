// ─── CLINICAL DECISION SUPPORT CALCULATORS ─────────────────────────────
// Each calculator: id, name, category, desc, fields[], calculate(vals,patient) → result
// Result: { score, label, interpretation, risk, actions[] }
// actions[]: { kind: 'rx'|'test'|'referral'|'monitor', name, dose, rationale, condition?, catalogId?, order? }
// Only kind:'rx' actions produce copyable prescriptions.

window.TOLScores = (() => {

  const CATEGORIES = [
    'Cardiology', 'Psychiatry', 'Respiratory', 'Infectious Disease',
    'Renal / Electrolytes', 'GI / Hepatology', 'Endocrine / Metabolic',
    'Pain / Opioid', 'Urology', 'Hematology',
  ];

  // ─── SCORE-TO-CATALOG MAPPING ──────────────────────────────────────
  // Maps score rx actions to real catalog entries for full Rx output.
  // Keys: "calculatorId:actionName" (lowercase), value: catalogId or condition value
  const CATALOG_MAP = {
    // ASCVD
    'ascvd:rosuvastatin': { condition: 'hyperlipidemia', search: 'rosuvastatin' },
    'ascvd:atorvastatin': { condition: 'hyperlipidemia', search: 'atorvastatin' },
    'ascvd:ezetimibe': { condition: 'hyperlipidemia', search: 'ezetimibe' },
    // PHQ-9
    'phq9:sertraline': { condition: 'depression', search: 'sertraline' },
    'phq9:escitalopram': { condition: 'depression', search: 'escitalopram' },
    'phq9:duloxetine': { condition: 'depression', search: 'duloxetine' },
    'phq9:venlafaxine xr': { condition: 'depression', search: 'venlafaxine' },
    'phq9:mirtazapine': { condition: 'depression', search: 'mirtazapine' },
    // GAD-7
    'gad7:sertraline': { condition: 'gad', search: 'sertraline' },
    'gad7:escitalopram': { condition: 'gad', search: 'escitalopram' },
    'gad7:duloxetine': { condition: 'gad', search: 'duloxetine' },
    'gad7:venlafaxine xr': { condition: 'gad', search: 'venlafaxine' },
    // Centor
    'centor:penicillin v': { condition: 'pharyngitis', search: 'penicillin' },
    'centor:amoxicillin': { condition: 'pharyngitis', search: 'amoxicillin' },
    'centor:azithromycin': { condition: 'pharyngitis', search: 'azithromycin' },
    'centor:cephalexin': { condition: 'pharyngitis', search: 'cephalexin' },
    // CHA2DS2-VASc
    'cha2ds2-vasc:apixaban': { condition: 'atrial-fibrillation-flutter', search: 'apixaban' },
    'cha2ds2-vasc:rivaroxaban': { condition: 'atrial-fibrillation-flutter', search: 'rivaroxaban' },
    // CURB-65
    'curb65:amoxicillin': { condition: 'pneumonia-cap', search: 'amoxicillin' },
    'curb65:doxycycline': { condition: 'pneumonia-cap', search: 'doxycycline' },
    'curb65:azithromycin': { condition: 'pneumonia-cap', search: 'azithromycin' },
    // IPSS
    'ipss:tamsulosin': { condition: 'luts-bph', search: 'tamsulosin' },
    'ipss:finasteride': { condition: 'luts-bph', search: 'finasteride' },
    'ipss:dutasteride': { condition: 'luts-bph', search: 'dutasteride' },
    // BMI
    'bmi:semaglutide': { condition: 'obesity', search: 'semaglutide' },
    'bmi:orlistat': { condition: 'obesity', search: 'orlistat' },
    // HOMA-IR
    'homa-ir:metformin': { condition: 'type-2-diabetes', search: 'metformin' },
  };

  // ─── BUILD STRUCTURED ORDER ────────────────────────────────────────
  // Creates a full order object from a score rx action for Rx/Chart/Pharmacy output
  function buildScoreOrder(action, patient) {
    return {
      medication: action.name,
      sig: { en: action.dose, fr: action.dose },
      dispense: action.dispense || '30-day supply',
      refills: action.refills ?? 2,
      duration: action.duration || '30 days',
      pharmacy: action.pharmacy || '',
    };
  }

  // Try to find a matching catalog entry for a score action
  function findCatalogMatch(calcId, action) {
    if (action.kind !== 'rx') return null;
    const key = `${calcId}:${action.name.toLowerCase()}`;
    return CATALOG_MAP[key] || null;
  }

  // Build a copy-ready Rx block from a score action
  function buildScoreCopyPack(action, patient) {
    if (action.kind !== 'rx') return null;
    const order = buildScoreOrder(action, patient);
    const rx = `${order.medication}\n${order.sig.en}\nDisp: ${order.dispense}\nRefills: ${order.refills}\nDuration: ${order.duration}`;
    const chart = `Prescribed ${order.medication} (${order.sig.en}) for ${action.rationale}`;
    return { rx, chart, order };
  }

  const CALCULATORS = [

    // ════════════════════════════════════════════════════════════════
    // 1. CHA₂DS₂-VASc
    // ════════════════════════════════════════════════════════════════
    {
      id: 'cha2ds2-vasc',
      name: 'CHA\u2082DS\u2082-VASc',
      category: 'Cardiology',
      desc: 'Stroke risk in atrial fibrillation \u2014 guides anticoagulation decision',
      fields: [
        { id: 'chf', label: 'CHF / LV dysfunction', type: 'bool', points: 1 },
        { id: 'htn', label: 'Hypertension', type: 'bool', points: 1 },
        { id: 'age75', label: 'Age \u2265 75', type: 'bool', points: 2, patientAuto: s => s.age >= 75 },
        { id: 'diabetes', label: 'Diabetes mellitus', type: 'bool', points: 1 },
        { id: 'stroke', label: 'Stroke / TIA / thromboembolism', type: 'bool', points: 2 },
        { id: 'vascular', label: 'Vascular disease (MI, PAD, aortic plaque)', type: 'bool', points: 1 },
        { id: 'age65', label: 'Age 65\u201374', type: 'bool', points: 1, patientAuto: s => s.age >= 65 && s.age < 75 },
        { id: 'female', label: 'Female sex', type: 'bool', points: 1, patientAuto: s => s.sex === 'female' },
      ],
      calculate(v, pt) {
        const score = (v.chf?1:0) + (v.htn?1:0) + (v.age75?2:0) + (v.diabetes?1:0) +
          (v.stroke?2:0) + (v.vascular?1:0) + (v.age65?1:0) + (v.female?1:0);
        const isMale = pt?.sex === 'male';
        let label, interpretation, risk, actions = [];

        if (score === 0) {
          label = 'Low risk'; risk = 'low';
          interpretation = 'Annual stroke risk ~0%. No anticoagulation needed.';
          actions = [{ kind: 'monitor', name: 'Reassess annually', dose: 'Repeat CHA\u2082DS\u2082-VASc in 12 months', rationale: 'Risk may change with new comorbidities' }];
        } else if (score === 1 && isMale) {
          label = 'Low\u2013moderate'; risk = 'caution';
          interpretation = 'Annual stroke risk ~1.3%. Consider anticoagulation.';
          actions = [
            { kind: 'rx', name: 'Apixaban', dose: '5 mg PO BID', rationale: 'DOAC preferred over warfarin; lower bleeding risk', condition: 'atrial-fibrillation-flutter', dispense: '60 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Rivaroxaban', dose: '20 mg PO daily with food', rationale: 'Once-daily DOAC option', condition: 'atrial-fibrillation-flutter', dispense: '30 tabs', duration: '30 days' },
          ];
        } else if (score === 1 && !isMale) {
          label = 'Low risk (female)'; risk = 'low';
          interpretation = 'Score of 1 from female sex alone \u2014 no anticoagulation needed.';
          actions = [{ kind: 'monitor', name: 'Reassess annually', dose: 'Repeat CHA\u2082DS\u2082-VASc in 12 months', rationale: 'Female sex alone does not warrant anticoagulation' }];
        } else {
          label = 'Moderate\u2013high risk'; risk = 'high';
          const rates = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 6.7, 15.2];
          interpretation = `Annual stroke risk ~${rates[Math.min(score,9)]}%. Anticoagulation recommended.`;
          actions = [
            { kind: 'rx', name: 'Apixaban', dose: '5 mg PO BID (2.5 mg if \u226580y, \u226460kg, or Cr\u2265133)', rationale: 'Preferred DOAC \u2014 ARISTOTLE: superior efficacy, less bleeding vs warfarin', condition: 'atrial-fibrillation-flutter', dispense: '60 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Rivaroxaban', dose: '20 mg PO daily with evening meal', rationale: 'Once-daily dosing, good for adherence', condition: 'atrial-fibrillation-flutter', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Dabigatran', dose: '150 mg PO BID (110 mg if \u226580y or high bleed risk)', rationale: 'Reversible with idarucizumab', dispense: '60 caps', duration: '30 days' },
            { kind: 'rx', name: 'Edoxaban', dose: '60 mg PO daily (30 mg if CrCl 15\u201350 or \u226460kg)', rationale: 'Once-daily, lowest GI bleeding of DOACs', dispense: '30 tabs', duration: '30 days' },
            { kind: 'test', name: 'Baseline labs', dose: 'CBC, Cr, INR, LFTs before starting DOAC', rationale: 'Required before initiating anticoagulation' },
          ];
        }
        return { score, max: 9, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 2. HAS-BLED
    // ════════════════════════════════════════════════════════════════
    {
      id: 'has-bled',
      name: 'HAS-BLED',
      category: 'Cardiology',
      desc: 'Bleeding risk on anticoagulation \u2014 pair with CHA\u2082DS\u2082-VASc',
      fields: [
        { id: 'htn', label: 'Hypertension (SBP >160)', type: 'bool', points: 1 },
        { id: 'renal', label: 'Abnormal renal function (dialysis, transplant, Cr>200)', type: 'bool', points: 1 },
        { id: 'liver', label: 'Abnormal liver function (cirrhosis, bilirubin >2\u00d7, AST/ALT >3\u00d7)', type: 'bool', points: 1 },
        { id: 'stroke', label: 'Stroke history', type: 'bool', points: 1 },
        { id: 'bleeding', label: 'Prior major bleeding or predisposition', type: 'bool', points: 1 },
        { id: 'labile', label: 'Labile INR (TTR <60%)', type: 'bool', points: 1 },
        { id: 'elderly', label: 'Age >65', type: 'bool', points: 1, patientAuto: s => s.age > 65 },
        { id: 'drugs', label: 'Antiplatelet / NSAID use', type: 'bool', points: 1 },
        { id: 'alcohol', label: 'Alcohol excess (\u22658 drinks/week)', type: 'bool', points: 1 },
      ],
      calculate(v) {
        const score = Object.keys(v).reduce((s, k) => s + (v[k] ? 1 : 0), 0);
        let label, interpretation, risk, actions = [];
        if (score <= 2) {
          label = 'Low\u2013moderate bleed risk'; risk = 'low';
          interpretation = `Score ${score}/9. Bleeding risk is acceptable for anticoagulation.`;
          actions = [{ kind: 'monitor', name: 'Standard monitoring', dose: 'CBC, Cr q6\u201312 months on anticoagulation', rationale: 'Routine monitoring for patients on DOACs' }];
        } else {
          label = 'High bleed risk'; risk = 'high';
          interpretation = `Score ${score}/9. High bleeding risk \u2014 does NOT contraindicate anticoagulation but requires closer monitoring. Address modifiable risk factors.`;
          actions = [
            { kind: 'rx', name: 'Apixaban', dose: '2.5\u20135 mg PO BID', rationale: 'Lowest major bleeding rate among DOACs (ARISTOTLE)', dispense: '60 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Pantoprazole', dose: '40 mg PO daily', rationale: 'GI prophylaxis if concurrent antiplatelet or GI bleed risk', dispense: '30 tabs', duration: '30 days' },
            { kind: 'monitor', name: 'Close monitoring', dose: 'CBC, Cr q3 months; stool guaiac PRN', rationale: 'High bleed risk requires closer surveillance' },
          ];
        }
        return { score, max: 9, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 3. HEART Score
    // ════════════════════════════════════════════════════════════════
    {
      id: 'heart',
      name: 'HEART Score',
      category: 'Cardiology',
      desc: 'Risk stratification for acute chest pain in ED',
      fields: [
        { id: 'history', label: 'History', type: 'select', options: [
          { value: 0, label: 'Slightly suspicious (0)' },
          { value: 1, label: 'Moderately suspicious (1)' },
          { value: 2, label: 'Highly suspicious (2)' },
        ]},
        { id: 'ecg', label: 'ECG', type: 'select', options: [
          { value: 0, label: 'Normal (0)' },
          { value: 1, label: 'Non-specific repolarization abnormality (1)' },
          { value: 2, label: 'Significant ST deviation (2)' },
        ]},
        { id: 'age', label: 'Age', type: 'select', options: [
          { value: 0, label: '<45 (0)' },
          { value: 1, label: '45\u201364 (1)' },
          { value: 2, label: '\u226565 (2)' },
        ], patientAuto: s => s.age < 45 ? 0 : s.age < 65 ? 1 : 2 },
        { id: 'riskFactors', label: 'Risk factors (HTN, DM, obesity, smoking, lipids, family Hx)', type: 'select', options: [
          { value: 0, label: 'No known risk factors (0)' },
          { value: 1, label: '1\u20132 risk factors (1)' },
          { value: 2, label: '\u22653 risk factors or atherosclerotic disease (2)' },
        ]},
        { id: 'troponin', label: 'Troponin', type: 'select', options: [
          { value: 0, label: 'Normal (0)' },
          { value: 1, label: '1\u20133\u00d7 upper limit (1)' },
          { value: 2, label: '>3\u00d7 upper limit (2)' },
        ]},
      ],
      calculate(v) {
        const score = (Number(v.history)||0) + (Number(v.ecg)||0) + (Number(v.age)||0) + (Number(v.riskFactors)||0) + (Number(v.troponin)||0);
        let label, interpretation, risk, actions = [];
        if (score <= 3) {
          label = 'Low risk (1.7% MACE)'; risk = 'low';
          interpretation = 'Low risk for major adverse cardiac event. Consider early discharge with outpatient follow-up.';
          actions = [
            { kind: 'rx', name: 'ASA', dose: '81 mg PO daily', rationale: 'Low-dose ASA for primary prevention if risk factors present', dispense: '30 tabs', duration: '30 days' },
            { kind: 'monitor', name: 'Outpatient follow-up', dose: 'PCP within 72 hours', rationale: 'Ensure safe disposition from ED' },
          ];
        } else if (score <= 6) {
          label = 'Moderate risk (12\u201317% MACE)'; risk = 'caution';
          interpretation = 'Moderate risk. Admit for observation, serial troponins, and cardiology consult.';
          actions = [
            { kind: 'rx', name: 'ASA', dose: '160\u2013325 mg loading, then 81 mg daily', rationale: 'Antiplatelet for ACS management', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Atorvastatin', dose: '80 mg PO daily', rationale: 'High-intensity statin for ACS', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Enoxaparin', dose: '1 mg/kg SC BID', rationale: 'Anticoagulation for ACS if invasive strategy planned' },
            { kind: 'test', name: 'Serial troponins', dose: 'q3\u20136h \u00d7 2', rationale: 'Rule out MI with serial markers' },
            { kind: 'referral', name: 'Cardiology consult', dose: 'Inpatient', rationale: 'Risk stratification and possible angiography' },
          ];
        } else {
          label = 'High risk (50\u201365% MACE)'; risk = 'high';
          interpretation = 'High risk for MACE. Urgent invasive strategy. Dual antiplatelet + anticoagulation.';
          actions = [
            { kind: 'rx', name: 'ASA', dose: '325 mg loading, then 81 mg daily', rationale: 'Antiplatelet \u2014 start immediately', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Ticagrelor', dose: '180 mg loading, then 90 mg BID', rationale: 'P2Y12 inhibitor \u2014 preferred in ACS (PLATO trial)', dispense: '60 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Atorvastatin', dose: '80 mg PO daily', rationale: 'High-intensity statin', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Heparin', dose: 'Enoxaparin 1 mg/kg SC BID or UFH per protocol', rationale: 'Anticoagulation for invasive strategy' },
            { kind: 'rx', name: 'Nitroglycerin', dose: '0.4 mg SL PRN chest pain', rationale: 'Symptom relief' },
            { kind: 'referral', name: 'Urgent cardiology', dose: 'Cath lab activation', rationale: 'Invasive strategy for high-risk ACS' },
          ];
        }
        return { score, max: 10, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 4. ASCVD 10-Year Risk
    // ════════════════════════════════════════════════════════════════
    {
      id: 'ascvd',
      name: 'ASCVD Risk / Statin Decision',
      category: 'Cardiology',
      desc: '10-year cardiovascular risk \u2014 guides statin intensity',
      fields: [
        { id: 'age', label: 'Age', type: 'number', min: 20, max: 79, patientAuto: s => s.age || '' },
        { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], patientAuto: s => s.sex },
        { id: 'totalChol', label: 'Total cholesterol (mmol/L)', type: 'number', min: 2, max: 12, step: 0.1, placeholder: '5.2' },
        { id: 'hdl', label: 'HDL cholesterol (mmol/L)', type: 'number', min: 0.5, max: 4, step: 0.1, placeholder: '1.3' },
        { id: 'sbp', label: 'Systolic BP (mmHg)', type: 'number', min: 80, max: 250, placeholder: '130' },
        { id: 'bpTreated', label: 'On BP treatment', type: 'bool' },
        { id: 'diabetes', label: 'Diabetes', type: 'bool' },
        { id: 'smoker', label: 'Current smoker', type: 'bool' },
      ],
      calculate(v) {
        const age = Number(v.age) || 0;
        const tc = Number(v.totalChol) || 0;
        const hdl = Number(v.hdl) || 0;
        const sbp = Number(v.sbp) || 0;
        if (!age || !tc || !hdl || !sbp) return { score: null, label: 'Incomplete', interpretation: 'Enter all values to calculate.', risk: 'none', actions: [] };

        let points = 0;
        const male = v.sex === 'male';
        if (male) {
          if (age < 35) points += 0; else if (age < 40) points += 2;
          else if (age < 45) points += 5; else if (age < 50) points += 6;
          else if (age < 55) points += 8; else if (age < 60) points += 10;
          else if (age < 65) points += 11; else if (age < 70) points += 12;
          else points += 14;
        } else {
          if (age < 35) points += 0; else if (age < 40) points += 2;
          else if (age < 45) points += 4; else if (age < 50) points += 5;
          else if (age < 55) points += 7; else if (age < 60) points += 8;
          else if (age < 65) points += 9; else if (age < 70) points += 10;
          else points += 11;
        }
        const ratio = tc / hdl;
        if (ratio > 7) points += 4; else if (ratio > 6) points += 3;
        else if (ratio > 5) points += 2; else if (ratio > 4) points += 1;
        const bpMult = v.bpTreated ? 1.5 : 1.0;
        const adjSBP = sbp * bpMult;
        if (adjSBP >= 180) points += 4; else if (adjSBP >= 160) points += 3;
        else if (adjSBP >= 140) points += 2; else if (adjSBP >= 130) points += 1;
        if (v.diabetes) points += 3;
        if (v.smoker) points += 3;
        let risk10 = male ? Math.min(95, Math.max(1, Math.round(points * 1.8))) : Math.min(95, Math.max(1, Math.round(points * 1.4)));

        let label, interpretation, risk, actions = [];
        if (risk10 < 5) {
          label = 'Low risk (<5%)'; risk = 'low';
          interpretation = `Estimated 10-year ASCVD risk ~${risk10}%. Lifestyle modifications \u2014 statin not routinely indicated.`;
          actions = [{ kind: 'monitor', name: 'Lifestyle counseling', dose: 'Diet, exercise, smoking cessation', rationale: 'Primary prevention through risk factor modification' }];
        } else if (risk10 < 7.5) {
          label = 'Borderline (5\u20137.5%)'; risk = 'caution';
          interpretation = `Estimated 10-year ASCVD risk ~${risk10}%. Consider statin if risk enhancers (family Hx, metabolic syndrome, CRP >2, CAC >0).`;
          actions = [
            { kind: 'rx', name: 'Rosuvastatin', dose: '5\u201310 mg PO daily', rationale: 'Moderate-intensity statin if risk enhancers present', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Atorvastatin', dose: '10\u201320 mg PO daily', rationale: 'Moderate-intensity alternative', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'test', name: 'Coronary artery calcium (CAC)', dose: 'CT calcium score', rationale: 'CAC >0 upgrades risk and supports statin initiation' },
          ];
        } else if (risk10 < 20) {
          label = 'Intermediate (7.5\u201320%)'; risk = 'caution';
          interpretation = `Estimated 10-year ASCVD risk ~${risk10}%. Moderate-to-high intensity statin recommended.`;
          actions = [
            { kind: 'rx', name: 'Rosuvastatin', dose: '10\u201320 mg PO daily', rationale: 'Moderate-high intensity statin for intermediate risk', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Atorvastatin', dose: '20\u201340 mg PO daily', rationale: 'Moderate-high intensity alternative', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'test', name: 'Fasting lipid panel', dose: 'Repeat in 4\u201312 weeks after starting statin', rationale: 'Assess LDL response to therapy' },
          ];
        } else {
          label = 'High (\u226520%)'; risk = 'high';
          interpretation = `Estimated 10-year ASCVD risk ~${risk10}%. High-intensity statin therapy strongly recommended. Target LDL <1.8 mmol/L.`;
          actions = [
            { kind: 'rx', name: 'Rosuvastatin', dose: '20\u201340 mg PO daily', rationale: 'High-intensity statin \u2014 most potent LDL reduction', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Atorvastatin', dose: '40\u201380 mg PO daily', rationale: 'High-intensity alternative \u2014 extensive trial data', condition: 'hyperlipidemia', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Ezetimibe', dose: '10 mg PO daily (add-on)', rationale: 'Add if LDL not at target on max statin (IMPROVE-IT trial)', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'test', name: 'Fasting lipid panel', dose: 'Repeat in 4\u201312 weeks', rationale: 'Confirm LDL target achieved' },
          ];
        }
        return { score: risk10, max: 100, unit: '%', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 5. Corrected QTc
    // ════════════════════════════════════════════════════════════════
    {
      id: 'qtc',
      name: 'Corrected QTc (Bazett)',
      category: 'Cardiology',
      desc: 'QT correction for heart rate \u2014 drug safety screening',
      fields: [
        { id: 'qt', label: 'QT interval (ms)', type: 'number', min: 200, max: 700, placeholder: '400' },
        { id: 'hr', label: 'Heart rate (bpm)', type: 'number', min: 30, max: 200, placeholder: '72' },
      ],
      calculate(v) {
        const qt = Number(v.qt) || 0;
        const hr = Number(v.hr) || 0;
        if (!qt || !hr) return { score: null, label: 'Incomplete', interpretation: 'Enter QT interval and heart rate.', risk: 'none', actions: [] };
        const rr = 60 / hr;
        const qtc = Math.round(qt / Math.sqrt(rr));
        let label, interpretation, risk, actions = [];
        if (qtc < 450) {
          label = 'Normal QTc'; risk = 'low';
          interpretation = `QTc = ${qtc} ms. Normal range. QT-prolonging drugs can be used with monitoring.`;
          actions = [{ kind: 'monitor', name: 'Routine ECG monitoring', dose: 'If starting QT-prolonging drug', rationale: 'Baseline QTc normal \u2014 repeat after drug initiation' }];
        } else if (qtc < 500) {
          label = 'Borderline prolonged'; risk = 'caution';
          interpretation = `QTc = ${qtc} ms. Borderline prolongation \u2014 use caution with QT-prolonging drugs. Monitor ECG.`;
          actions = [
            { kind: 'monitor', name: 'Review QT-prolonging drugs', dose: 'Audit medication list', rationale: 'Common offenders: macrolides, fluoroquinolones, antipsychotics, ondansetron, methadone, SSRIs' },
            { kind: 'test', name: 'Electrolytes', dose: 'K, Mg, Ca', rationale: 'Correct electrolyte abnormalities that worsen QT prolongation' },
          ];
        } else {
          label = 'Prolonged \u2014 high risk'; risk = 'high';
          interpretation = `QTc = ${qtc} ms. Significantly prolonged \u2014 AVOID all QT-prolonging drugs. Risk of Torsades de Pointes.`;
          actions = [
            { kind: 'rx', name: 'STOP QT-prolonging drugs', dose: 'Discontinue offending agents', rationale: 'Risk of fatal arrhythmia (TdP)' },
            { kind: 'rx', name: 'Magnesium sulfate', dose: '2 g IV if symptomatic', rationale: 'First-line for TdP prophylaxis/treatment' },
            { kind: 'monitor', name: 'Correct electrolytes', dose: 'Target K >4.0, Mg >0.8', rationale: 'Hypokalemia and hypomagnesemia worsen QT prolongation' },
            { kind: 'test', name: 'Continuous telemetry', dose: 'Until QTc <500 ms', rationale: 'Monitor for arrhythmia while correcting' },
          ];
        }
        return { score: qtc, unit: 'ms', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 6. PHQ-9
    // ════════════════════════════════════════════════════════════════
    {
      id: 'phq9',
      name: 'PHQ-9',
      category: 'Psychiatry',
      desc: 'Depression severity \u2014 guides antidepressant initiation',
      scaleHeader: ['0 \u2014 Not at all', '1 \u2014 Several days', '2 \u2014 More than half', '3 \u2014 Nearly every day'],
      fields: [
        { id: 'q1', label: 'Little interest or pleasure in doing things', type: 'scale', max: 3 },
        { id: 'q2', label: 'Feeling down, depressed, or hopeless', type: 'scale', max: 3 },
        { id: 'q3', label: 'Trouble falling/staying asleep, or sleeping too much', type: 'scale', max: 3 },
        { id: 'q4', label: 'Feeling tired or having little energy', type: 'scale', max: 3 },
        { id: 'q5', label: 'Poor appetite or overeating', type: 'scale', max: 3 },
        { id: 'q6', label: 'Feeling bad about yourself \u2014 or that you are a failure', type: 'scale', max: 3 },
        { id: 'q7', label: 'Trouble concentrating on things', type: 'scale', max: 3 },
        { id: 'q8', label: 'Moving or speaking so slowly / being fidgety or restless', type: 'scale', max: 3 },
        { id: 'q9', label: 'Thoughts that you would be better off dead, or of hurting yourself', type: 'scale', max: 3 },
      ],
      calculate(v) {
        const score = Object.values(v).reduce((s, x) => s + (Number(x) || 0), 0);
        let label, interpretation, risk, actions = [];

        if (score <= 4) {
          label = 'Minimal depression'; risk = 'low';
          interpretation = 'Score indicates minimal symptoms. Monitor and reassess. No pharmacotherapy needed.';
          actions = [{ kind: 'monitor', name: 'Reassess in 2\u20134 weeks', dose: 'Repeat PHQ-9', rationale: 'Monitor for symptom progression' }];
        } else if (score <= 9) {
          label = 'Mild depression'; risk = 'low';
          interpretation = 'Mild symptoms. Consider watchful waiting, psychoeducation, and supportive counseling.';
          actions = [
            { kind: 'referral', name: 'Counseling / CBT', dose: 'Refer for psychotherapy', rationale: 'First-line for mild depression' },
            { kind: 'monitor', name: 'Repeat PHQ-9', dose: 'In 4 weeks', rationale: 'Track response to counseling' },
          ];
        } else if (score <= 14) {
          label = 'Moderate depression'; risk = 'caution';
          interpretation = 'Moderate depression. Antidepressant OR psychotherapy recommended (or both).';
          actions = [
            { kind: 'rx', name: 'Sertraline', dose: '50 mg PO daily (titrate to 100\u2013200 mg)', rationale: 'First-line SSRI \u2014 broad evidence, good tolerability', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Escitalopram', dose: '10 mg PO daily (max 20 mg)', rationale: 'First-line SSRI \u2014 fewest drug interactions', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'referral', name: 'CBT referral', dose: '12\u201316 sessions', rationale: 'Equal efficacy to medication for moderate depression' },
          ];
        } else if (score <= 19) {
          label = 'Moderately severe'; risk = 'high';
          interpretation = 'Moderately severe depression. Antidepressant recommended + psychotherapy.';
          actions = [
            { kind: 'rx', name: 'Sertraline', dose: '50\u2013100 mg PO daily, titrate to 200 mg', rationale: 'First-line SSRI with strong evidence base', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Escitalopram', dose: '10\u201320 mg PO daily', rationale: 'Well-tolerated SSRI option', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Duloxetine', dose: '60 mg PO daily', rationale: 'SNRI \u2014 consider if comorbid pain or anxiety', condition: 'depression', dispense: '30 caps', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Mirtazapine', dose: '15\u201345 mg PO at bedtime', rationale: 'Consider if insomnia or poor appetite predominate', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'referral', name: 'CBT + psychotherapy', dose: 'Concurrent with medication', rationale: 'Combined therapy superior to monotherapy in moderate\u2013severe' },
          ];
        } else {
          label = 'Severe depression'; risk = 'high';
          interpretation = 'Severe depression. Antidepressant + psychotherapy strongly recommended. Assess suicidality. Consider psychiatry referral.';
          actions = [
            { kind: 'rx', name: 'Sertraline', dose: '50\u2013100 mg PO daily, titrate to max 200 mg', rationale: 'First-line \u2014 start promptly', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Venlafaxine XR', dose: '75 mg PO daily, titrate to 150\u2013225 mg', rationale: 'SNRI \u2014 may have higher remission rates in severe depression', condition: 'depression', dispense: '30 caps', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Duloxetine', dose: '60\u2013120 mg PO daily', rationale: 'SNRI alternative with pain benefit', condition: 'depression', dispense: '30 caps', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Mirtazapine', dose: '15\u201345 mg PO at bedtime', rationale: 'Augmentation or monotherapy for insomnia/appetite issues', condition: 'depression', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'referral', name: 'Psychiatry referral', dose: 'Urgent', rationale: 'Severe depression with possible suicidality' },
          ];
        }
        if (Number(v.q9) >= 2) {
          interpretation += ' \u26a0\ufe0f Item 9 elevated \u2014 assess suicide risk immediately.';
        }
        return { score, max: 27, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 7. GAD-7
    // ════════════════════════════════════════════════════════════════
    {
      id: 'gad7',
      name: 'GAD-7',
      category: 'Psychiatry',
      desc: 'Generalized anxiety severity \u2014 guides anxiolytic / SSRI selection',
      scaleHeader: ['0 \u2014 Not at all', '1 \u2014 Several days', '2 \u2014 More than half', '3 \u2014 Nearly every day'],
      fields: [
        { id: 'q1', label: 'Feeling nervous, anxious, or on edge', type: 'scale', max: 3 },
        { id: 'q2', label: 'Not being able to stop or control worrying', type: 'scale', max: 3 },
        { id: 'q3', label: 'Worrying too much about different things', type: 'scale', max: 3 },
        { id: 'q4', label: 'Trouble relaxing', type: 'scale', max: 3 },
        { id: 'q5', label: 'Being so restless that it is hard to sit still', type: 'scale', max: 3 },
        { id: 'q6', label: 'Becoming easily annoyed or irritable', type: 'scale', max: 3 },
        { id: 'q7', label: 'Feeling afraid, as if something awful might happen', type: 'scale', max: 3 },
      ],
      calculate(v) {
        const score = Object.values(v).reduce((s, x) => s + (Number(x) || 0), 0);
        let label, interpretation, risk, actions = [];
        if (score <= 4) {
          label = 'Minimal anxiety'; risk = 'low';
          interpretation = 'Minimal anxiety symptoms. No pharmacotherapy indicated.';
          actions = [{ kind: 'monitor', name: 'Reassess in 4 weeks', dose: 'Repeat GAD-7', rationale: 'Monitor for symptom progression' }];
        } else if (score <= 9) {
          label = 'Mild anxiety'; risk = 'low';
          interpretation = 'Mild anxiety. Consider counseling and lifestyle modifications.';
          actions = [
            { kind: 'referral', name: 'CBT referral', dose: '8\u201312 sessions', rationale: 'First-line for mild GAD' },
            { kind: 'monitor', name: 'Repeat GAD-7', dose: 'In 4 weeks', rationale: 'Track response' },
          ];
        } else if (score <= 14) {
          label = 'Moderate anxiety'; risk = 'caution';
          interpretation = 'Moderate anxiety. SSRI/SNRI recommended as first-line pharmacotherapy + consider CBT.';
          actions = [
            { kind: 'rx', name: 'Sertraline', dose: '50 mg PO daily (titrate to 100\u2013200 mg)', rationale: 'First-line SSRI for GAD', condition: 'gad', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Escitalopram', dose: '10 mg PO daily (max 20 mg)', rationale: 'SSRI with fewest interactions, well tolerated', condition: 'gad', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Duloxetine', dose: '60 mg PO daily', rationale: 'SNRI \u2014 FDA-approved for GAD', condition: 'gad', dispense: '30 caps', duration: '30 days', refills: 3 },
            { kind: 'referral', name: 'CBT referral', dose: '12\u201316 sessions', rationale: 'Combined therapy recommended' },
          ];
        } else {
          label = 'Severe anxiety'; risk = 'high';
          interpretation = 'Severe anxiety. Pharmacotherapy strongly recommended. Consider short-term benzodiazepine bridge.';
          actions = [
            { kind: 'rx', name: 'Escitalopram', dose: '10\u201320 mg PO daily', rationale: 'First-line for severe GAD', condition: 'gad', dispense: '30 tabs', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Venlafaxine XR', dose: '75 mg, titrate to 150\u2013225 mg daily', rationale: 'SNRI \u2014 strong evidence for GAD', condition: 'gad', dispense: '30 caps', duration: '30 days', refills: 3 },
            { kind: 'rx', name: 'Pregabalin', dose: '75 mg BID, titrate to 150\u2013300 mg BID', rationale: 'Alternative if SSRI/SNRI contraindicated or failed', dispense: '60 caps', duration: '30 days' },
            { kind: 'rx', name: 'Lorazepam', dose: '0.5\u20131 mg PO BID-TID PRN (max 2\u20134 weeks)', rationale: 'Bridge therapy while SSRI takes effect \u2014 taper and discontinue', dispense: '20 tabs', duration: '14 days', refills: 0 },
            { kind: 'referral', name: 'Psychiatry referral', dose: 'If refractory to first-line', rationale: 'Specialist input for severe/treatment-resistant GAD' },
          ];
        }
        return { score, max: 21, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 8. CIWA-Ar
    // ════════════════════════════════════════════════════════════════
    {
      id: 'ciwa',
      name: 'CIWA-Ar',
      category: 'Psychiatry',
      desc: 'Alcohol withdrawal severity \u2014 guides benzodiazepine dosing',
      fields: [
        { id: 'nausea', label: 'Nausea / vomiting', type: 'scale', max: 7, scaleLabels: ['None', '', '', '', 'Intermittent nausea', '', '', 'Constant nausea / dry heaves'] },
        { id: 'tremor', label: 'Tremor (arms extended)', type: 'scale', max: 7, scaleLabels: ['None', '', '', '', 'Moderate', '', '', 'Severe'] },
        { id: 'sweat', label: 'Paroxysmal sweats', type: 'scale', max: 7, scaleLabels: ['None', 'Barely perceptible', '', '', 'Beads on forehead', '', '', 'Drenching'] },
        { id: 'anxiety', label: 'Anxiety', type: 'scale', max: 7, scaleLabels: ['None', '', '', '', 'Moderate', '', '', 'Panic-level'] },
        { id: 'agitation', label: 'Agitation', type: 'scale', max: 7, scaleLabels: ['Normal', '', '', '', 'Moderately restless', '', '', 'Pacing / thrashing'] },
        { id: 'tactile', label: 'Tactile disturbances', type: 'scale', max: 7, scaleLabels: ['None', 'Itching/pins', '', 'Itching/burning', '', 'Hallucinations', '', 'Continuous'] },
        { id: 'auditory', label: 'Auditory disturbances', type: 'scale', max: 7, scaleLabels: ['None', 'Mildly harsh', '', 'Moderately harsh', '', 'Hallucinations', '', 'Continuous'] },
        { id: 'visual', label: 'Visual disturbances', type: 'scale', max: 7, scaleLabels: ['None', 'Mild sensitivity', '', 'Moderate', '', 'Hallucinations', '', 'Continuous'] },
        { id: 'headache', label: 'Headache / fullness', type: 'scale', max: 7, scaleLabels: ['None', 'Mild', '', 'Moderate', '', 'Severe', '', 'Extremely severe'] },
        { id: 'orientation', label: 'Orientation / clouding', type: 'scale', max: 4, scaleLabels: ['Oriented', '', 'Uncertain of date', '', 'Disoriented'] },
      ],
      calculate(v) {
        const score = Object.values(v).reduce((s, x) => s + (Number(x) || 0), 0);
        let label, interpretation, risk, actions = [];
        if (score < 10) {
          label = 'Mild withdrawal'; risk = 'low';
          interpretation = `CIWA-Ar ${score}/67. Mild withdrawal. Supportive care. Reassess q4\u20138h.`;
          actions = [
            { kind: 'rx', name: 'Thiamine', dose: '100 mg PO/IV daily \u00d7 3\u20135 days', rationale: 'Prevent Wernicke encephalopathy', dispense: '5 tabs', duration: '5 days' },
            { kind: 'rx', name: 'Folic acid', dose: '1 mg PO daily', rationale: 'Correct folate deficiency common in alcohol use', dispense: '30 tabs', duration: '30 days' },
            { kind: 'monitor', name: 'Repeat CIWA-Ar', dose: 'q4\u20138h', rationale: 'Monitor for escalation to moderate/severe withdrawal' },
          ];
        } else if (score <= 18) {
          label = 'Moderate withdrawal'; risk = 'caution';
          interpretation = `CIWA-Ar ${score}/67. Moderate withdrawal. Symptom-triggered benzodiazepine therapy. Reassess q1\u20132h.`;
          actions = [
            { kind: 'rx', name: 'Diazepam', dose: '10\u201320 mg PO q1\u20132h PRN (CIWA \u226510)', rationale: 'Long-acting benzo \u2014 smoother withdrawal curve', dispense: '20 tabs', duration: 'PRN' },
            { kind: 'rx', name: 'Lorazepam', dose: '2\u20134 mg PO/IV q1\u20132h PRN', rationale: 'Preferred if hepatic impairment (no active metabolites)', dispense: '20 tabs', duration: 'PRN' },
            { kind: 'rx', name: 'Thiamine', dose: '100\u2013250 mg IV daily \u00d7 3\u20135 days', rationale: 'Give BEFORE glucose \u2014 prevent Wernicke' },
            { kind: 'monitor', name: 'Repeat CIWA-Ar', dose: 'q1\u20132h', rationale: 'Titrate benzodiazepine to symptom control' },
          ];
        } else {
          label = 'Severe withdrawal'; risk = 'high';
          interpretation = `CIWA-Ar ${score}/67. Severe withdrawal \u2014 high seizure and DT risk. Aggressive benzo dosing. ICU consideration.`;
          actions = [
            { kind: 'rx', name: 'Diazepam', dose: '20 mg PO/IV q1h until CIWA <10', rationale: 'Front-loading protocol \u2014 reduces seizure risk' },
            { kind: 'rx', name: 'Lorazepam', dose: '2\u20134 mg IV q15\u201330min if refractory', rationale: 'For hepatic impairment or diazepam inadequacy' },
            { kind: 'rx', name: 'Phenobarbital', dose: '130\u2013260 mg IV (adjunct)', rationale: 'Add if >3 doses of benzo without improvement' },
            { kind: 'rx', name: 'Thiamine', dose: '500 mg IV TID \u00d7 3 days', rationale: 'High-dose for suspected Wernicke (Caine criteria)' },
            { kind: 'referral', name: 'ICU assessment', dose: 'If refractory or hemodynamically unstable', rationale: 'Severe withdrawal with DT risk requires close monitoring' },
          ];
        }
        return { score, max: 67, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 9. Wells DVT
    // ════════════════════════════════════════════════════════════════
    {
      id: 'wells-dvt',
      name: 'Wells\u2019 DVT',
      category: 'Hematology',
      desc: 'DVT probability \u2014 guides anticoagulation and imaging',
      fields: [
        { id: 'cancer', label: 'Active cancer (treatment within 6 mo or palliative)', type: 'bool', points: 1 },
        { id: 'paralysis', label: 'Paralysis / paresis / recent lower extremity immobilization', type: 'bool', points: 1 },
        { id: 'bedridden', label: 'Bedridden >3 days or major surgery within 12 weeks', type: 'bool', points: 1 },
        { id: 'tenderness', label: 'Localized tenderness along deep venous system', type: 'bool', points: 1 },
        { id: 'legSwollen', label: 'Entire leg swollen', type: 'bool', points: 1 },
        { id: 'calfSwelling', label: 'Calf swelling >3 cm vs. asymptomatic leg', type: 'bool', points: 1 },
        { id: 'pitting', label: 'Pitting edema (symptomatic leg only)', type: 'bool', points: 1 },
        { id: 'collateral', label: 'Collateral superficial veins (non-varicose)', type: 'bool', points: 1 },
        { id: 'prevDVT', label: 'Previously documented DVT', type: 'bool', points: 1 },
        { id: 'altDx', label: 'Alternative diagnosis at least as likely', type: 'bool', points: -2 },
      ],
      calculate(v) {
        let score = 0;
        for (const [k, val] of Object.entries(v)) {
          if (!val) continue;
          const f = this.fields.find(f => f.id === k);
          score += f ? f.points : 0;
        }
        let label, interpretation, risk, actions = [];
        if (score <= 0) {
          label = 'Low probability (5%)'; risk = 'low';
          interpretation = `Wells ${score}. Low probability \u2014 order D-dimer. If negative, DVT excluded.`;
          actions = [
            { kind: 'test', name: 'D-dimer', dose: 'Age-adjusted cutoff', rationale: 'If negative, DVT reliably excluded in low-risk patients' },
          ];
        } else if (score <= 2) {
          label = 'Moderate probability (17%)'; risk = 'caution';
          interpretation = `Wells ${score}. Moderate probability \u2014 order D-dimer \u2192 if positive, compression ultrasound.`;
          actions = [
            { kind: 'test', name: 'D-dimer', dose: 'Quantitative', rationale: 'First step in moderate probability' },
            { kind: 'test', name: 'Compression ultrasound', dose: 'Proximal leg veins (if D-dimer positive)', rationale: 'Definitive imaging for DVT' },
          ];
        } else {
          label = 'High probability (53%)'; risk = 'high';
          interpretation = `Wells ${score}. High probability \u2014 start empiric anticoagulation while awaiting ultrasound.`;
          actions = [
            { kind: 'rx', name: 'Rivaroxaban', dose: '15 mg PO BID \u00d7 21 days, then 20 mg daily', rationale: 'DOAC monotherapy \u2014 no initial heparin needed (EINSTEIN-DVT)', dispense: '42 tabs (starter)', duration: '21 days + ongoing' },
            { kind: 'rx', name: 'Apixaban', dose: '10 mg PO BID \u00d7 7 days, then 5 mg BID', rationale: 'DOAC monotherapy option (AMPLIFY)', dispense: '14 tabs (starter)', duration: '7 days + ongoing' },
            { kind: 'rx', name: 'Enoxaparin', dose: '1 mg/kg SC BID (bridge)', rationale: 'LMWH bridge if DOAC not suitable' },
            { kind: 'test', name: 'Urgent compression ultrasound', dose: 'Same day', rationale: 'Confirm DVT diagnosis' },
          ];
        }
        return { score, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 10. Wells PE
    // ════════════════════════════════════════════════════════════════
    {
      id: 'wells-pe',
      name: 'Wells\u2019 PE',
      category: 'Respiratory',
      desc: 'Pulmonary embolism probability \u2014 guides workup and anticoagulation',
      fields: [
        { id: 'dvtSigns', label: 'Clinical signs/symptoms of DVT', type: 'bool', points: 3 },
        { id: 'peLikely', label: 'PE is #1 diagnosis or equally likely', type: 'bool', points: 3 },
        { id: 'hr100', label: 'Heart rate >100', type: 'bool', points: 1.5 },
        { id: 'immobilization', label: 'Immobilization (\u22653 days) or surgery in previous 4 weeks', type: 'bool', points: 1.5 },
        { id: 'prevDVTPE', label: 'Previous DVT/PE', type: 'bool', points: 1.5 },
        { id: 'hemoptysis', label: 'Hemoptysis', type: 'bool', points: 1 },
        { id: 'malignancy', label: 'Malignancy (treatment within 6 mo or palliative)', type: 'bool', points: 1 },
      ],
      calculate(v) {
        let score = 0;
        for (const [k, val] of Object.entries(v)) {
          if (!val) continue;
          const f = this.fields.find(f => f.id === k);
          score += f ? f.points : 0;
        }
        let label, interpretation, risk, actions = [];
        if (score <= 4) {
          label = 'PE unlikely (\u22644)'; risk = 'low';
          interpretation = `Wells ${score}. PE unlikely \u2014 order D-dimer. If negative, PE excluded.`;
          actions = [
            { kind: 'test', name: 'D-dimer', dose: 'Age-adjusted cutoff', rationale: 'If negative, PE excluded. If positive, proceed to CTPA' },
          ];
        } else {
          label = 'PE likely (>4)'; risk = 'high';
          interpretation = `Wells ${score}. PE likely \u2014 order CTPA. Consider empiric anticoagulation while awaiting imaging.`;
          actions = [
            { kind: 'test', name: 'CT pulmonary angiography', dose: 'Urgent', rationale: 'Definitive imaging for PE' },
            { kind: 'rx', name: 'Rivaroxaban', dose: '15 mg PO BID \u00d7 21 days, then 20 mg daily', rationale: 'DOAC monotherapy if PE confirmed (EINSTEIN-PE)', dispense: '42 tabs', duration: '21 days + ongoing' },
            { kind: 'rx', name: 'Apixaban', dose: '10 mg PO BID \u00d7 7 days, then 5 mg BID', rationale: 'DOAC monotherapy alternative (AMPLIFY)', dispense: '14 tabs', duration: '7 days + ongoing' },
            { kind: 'rx', name: 'Enoxaparin', dose: '1 mg/kg SC BID (bridge)', rationale: 'LMWH while awaiting CTPA or starting warfarin' },
          ];
        }
        return { score, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 11. CURB-65
    // ════════════════════════════════════════════════════════════════
    {
      id: 'curb65',
      name: 'CURB-65',
      category: 'Infectious Disease',
      desc: 'Pneumonia severity \u2014 guides antibiotic selection and disposition',
      fields: [
        { id: 'confusion', label: 'Confusion (new disorientation)', type: 'bool', points: 1 },
        { id: 'urea', label: 'Urea >7 mmol/L (BUN >19 mg/dL)', type: 'bool', points: 1 },
        { id: 'resp', label: 'Respiratory rate \u226530/min', type: 'bool', points: 1 },
        { id: 'bp', label: 'BP: systolic <90 or diastolic \u226460 mmHg', type: 'bool', points: 1 },
        { id: 'age65', label: 'Age \u226565', type: 'bool', points: 1, patientAuto: s => s.age >= 65 },
      ],
      calculate(v) {
        const score = Object.values(v).filter(Boolean).length;
        let label, interpretation, risk, actions = [];
        if (score <= 1) {
          label = 'Low severity \u2014 outpatient'; risk = 'low';
          interpretation = `CURB-65 = ${score}. Low mortality risk (~1.5%). Outpatient management.`;
          actions = [
            { kind: 'rx', name: 'Amoxicillin', dose: '1 g PO TID \u00d7 5 days', rationale: 'First-line for uncomplicated CAP (CTS)', condition: 'pneumonia-cap', dispense: '15 tabs', duration: '5 days', refills: 0 },
            { kind: 'rx', name: 'Doxycycline', dose: '100 mg PO BID \u00d7 5 days', rationale: 'Alternative if penicillin allergy', condition: 'pneumonia-cap', dispense: '10 tabs', duration: '5 days', refills: 0 },
            { kind: 'rx', name: 'Azithromycin', dose: '500 mg day 1, then 250 mg \u00d7 4 days', rationale: 'Macrolide alternative \u2014 covers atypicals', dispense: '6 tabs', duration: '5 days', refills: 0 },
            { kind: 'monitor', name: 'Follow-up', dose: 'Reassess in 48\u201372 hours', rationale: 'Ensure clinical improvement on antibiotics' },
          ];
        } else if (score === 2) {
          label = 'Moderate severity'; risk = 'caution';
          interpretation = `CURB-65 = ${score}. Moderate mortality (~9%). Consider short inpatient stay.`;
          actions = [
            { kind: 'rx', name: 'Amoxicillin-clavulanate', dose: '875/125 mg PO BID \u00d7 7 days', rationale: 'Broader coverage for moderate CAP', dispense: '14 tabs', duration: '7 days', refills: 0 },
            { kind: 'rx', name: 'Azithromycin', dose: '500 mg PO daily \u00d7 3 days (add to above)', rationale: 'Add macrolide for atypical coverage', dispense: '3 tabs', duration: '3 days', refills: 0 },
            { kind: 'rx', name: 'Levofloxacin', dose: '750 mg PO daily \u00d7 5 days', rationale: 'Respiratory FQ monotherapy (reserve for allergy/failure)', dispense: '5 tabs', duration: '5 days', refills: 0 },
            { kind: 'test', name: 'Chest X-ray', dose: 'PA and lateral', rationale: 'Confirm pneumonia and assess severity' },
          ];
        } else {
          label = 'Severe \u2014 hospitalize'; risk = 'high';
          interpretation = `CURB-65 = ${score}. High mortality (15\u201340%). Hospitalize. ICU if 4\u20135.`;
          actions = [
            { kind: 'rx', name: 'Ceftriaxone', dose: '1\u20132 g IV daily', rationale: 'Empiric IV beta-lactam for severe CAP' },
            { kind: 'rx', name: 'Azithromycin', dose: '500 mg IV daily', rationale: 'Macrolide for atypical coverage \u2014 mandatory in severe CAP' },
            { kind: 'rx', name: 'Levofloxacin', dose: '750 mg IV daily', rationale: 'Alternative monotherapy if beta-lactam allergy' },
            { kind: 'referral', name: 'Hospital admission', dose: 'ICU if CURB-65 \u22654', rationale: 'High mortality risk requires inpatient management' },
            { kind: 'test', name: 'Blood cultures', dose: '\u00d72 sets before antibiotics', rationale: 'Identify causative organism in severe pneumonia' },
          ];
        }
        return { score, max: 5, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 12. Centor / McIsaac
    // ════════════════════════════════════════════════════════════════
    {
      id: 'centor',
      name: 'Centor / McIsaac',
      category: 'Infectious Disease',
      desc: 'Strep pharyngitis probability \u2014 guides rapid test and antibiotics',
      fields: [
        { id: 'fever', label: 'Fever >38\u00b0C (history or measured)', type: 'bool', points: 1 },
        { id: 'noCough', label: 'Absence of cough', type: 'bool', points: 1 },
        { id: 'lymph', label: 'Tender anterior cervical lymphadenopathy', type: 'bool', points: 1 },
        { id: 'tonsils', label: 'Tonsillar swelling or exudate', type: 'bool', points: 1 },
        { id: 'ageMod', label: 'Age group', type: 'select', options: [
          { value: 1, label: '3\u201314 years (+1)' },
          { value: 0, label: '15\u201344 years (0)' },
          { value: -1, label: '\u226545 years (\u22121)' },
        ], patientAuto: s => s.age < 15 ? 1 : s.age < 45 ? 0 : -1 },
      ],
      calculate(v) {
        const score = (v.fever?1:0) + (v.noCough?1:0) + (v.lymph?1:0) + (v.tonsils?1:0) + (Number(v.ageMod)||0);
        let label, interpretation, risk, actions = [];
        if (score <= 1) {
          label = 'Low risk (~5\u201310%)'; risk = 'low';
          interpretation = `McIsaac ${score}. Low probability of GAS. No rapid test or antibiotics needed.`;
          actions = [
            { kind: 'rx', name: 'Ibuprofen', dose: '400 mg PO q6h PRN pain', rationale: 'Symptomatic relief for sore throat', dispense: '20 tabs', duration: '5 days' },
            { kind: 'monitor', name: 'Return if worsening', dose: 'Within 48 hours', rationale: 'Reassess if symptoms do not improve' },
          ];
        } else if (score <= 3) {
          label = 'Moderate risk (~15\u201335%)'; risk = 'caution';
          interpretation = `McIsaac ${score}. Moderate probability. Order rapid strep test. Treat only if positive.`;
          actions = [
            { kind: 'test', name: 'Rapid strep antigen test', dose: 'Throat swab', rationale: 'Confirm GAS before prescribing antibiotics' },
            { kind: 'rx', name: 'Penicillin V', dose: '600 mg PO BID \u00d7 10 days (if strep+)', rationale: 'First-line for confirmed GAS pharyngitis', condition: 'pharyngitis', dispense: '20 tabs', duration: '10 days', refills: 0 },
            { kind: 'rx', name: 'Amoxicillin', dose: '500 mg PO BID \u00d7 10 days', rationale: 'Alternative first-line \u2014 better taste for children', condition: 'pharyngitis', dispense: '20 tabs', duration: '10 days', refills: 0 },
          ];
        } else {
          label = 'High risk (~50%)'; risk = 'high';
          interpretation = `McIsaac ${score}. High probability. Rapid strep recommended \u2014 consider empiric antibiotics.`;
          actions = [
            { kind: 'test', name: 'Rapid strep antigen test', dose: 'Throat swab', rationale: 'Confirm GAS (still recommended even at high probability)' },
            { kind: 'rx', name: 'Penicillin V', dose: '600 mg PO BID \u00d7 10 days', rationale: 'First-line for GAS pharyngitis', condition: 'pharyngitis', dispense: '20 tabs', duration: '10 days', refills: 0 },
            { kind: 'rx', name: 'Amoxicillin', dose: '500 mg PO BID \u00d7 10 days (50 mg/kg for children)', rationale: 'First-line alternative', condition: 'pharyngitis', dispense: '20 tabs', duration: '10 days', refills: 0 },
            { kind: 'rx', name: 'Azithromycin', dose: '500 mg day 1, then 250 mg \u00d7 4 days', rationale: 'If penicillin allergy (non-anaphylaxis)', condition: 'pharyngitis', dispense: '6 tabs', duration: '5 days', refills: 0 },
            { kind: 'rx', name: 'Cephalexin', dose: '500 mg PO BID \u00d7 10 days', rationale: 'If mild penicillin allergy', condition: 'pharyngitis', dispense: '20 tabs', duration: '10 days', refills: 0 },
          ];
        }
        return { score, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 13. STOP-BANG
    // ════════════════════════════════════════════════════════════════
    {
      id: 'stopbang',
      name: 'STOP-BANG',
      category: 'Respiratory',
      desc: 'Obstructive sleep apnea screening \u2014 guides sleep study referral',
      fields: [
        { id: 'snoring', label: 'Snoring loudly', type: 'bool', points: 1 },
        { id: 'tired', label: 'Tired / sleepy / fatigued during daytime', type: 'bool', points: 1 },
        { id: 'observed', label: 'Observed to stop breathing during sleep', type: 'bool', points: 1 },
        { id: 'pressure', label: 'Treated for high blood pressure', type: 'bool', points: 1 },
        { id: 'bmi', label: 'BMI >35', type: 'bool', points: 1 },
        { id: 'age50', label: 'Age >50', type: 'bool', points: 1, patientAuto: s => s.age > 50 },
        { id: 'neck', label: 'Neck circumference >40 cm (16 in)', type: 'bool', points: 1 },
        { id: 'male', label: 'Male gender', type: 'bool', points: 1, patientAuto: s => s.sex === 'male' },
      ],
      calculate(v) {
        const score = Object.values(v).filter(Boolean).length;
        let label, interpretation, risk, actions = [];
        if (score <= 2) {
          label = 'Low risk for OSA'; risk = 'low';
          interpretation = `STOP-BANG ${score}/8. Low risk for obstructive sleep apnea.`;
          actions = [{ kind: 'monitor', name: 'Reassess if symptoms develop', dose: 'Annual screening', rationale: 'Risk may change with weight gain or aging' }];
        } else if (score <= 4) {
          label = 'Intermediate risk'; risk = 'caution';
          interpretation = `STOP-BANG ${score}/8. Intermediate risk. Consider polysomnography if symptomatic.`;
          actions = [
            { kind: 'referral', name: 'Sleep study referral', dose: 'Polysomnography', rationale: 'Confirm diagnosis before treatment' },
          ];
        } else {
          label = 'High risk for OSA'; risk = 'high';
          interpretation = `STOP-BANG ${score}/8. High probability of moderate\u2013severe OSA.`;
          actions = [
            { kind: 'referral', name: 'Urgent sleep study', dose: 'Polysomnography', rationale: 'Confirm diagnosis and titrate CPAP' },
            { kind: 'rx', name: 'CPAP therapy', dose: 'Auto-CPAP or fixed pressure per sleep study', rationale: 'First-line for moderate\u2013severe OSA' },
            { kind: 'rx', name: 'Modafinil', dose: '200 mg PO every morning', rationale: 'Adjunct for residual daytime sleepiness despite CPAP', dispense: '30 tabs', duration: '30 days' },
          ];
        }
        return { score, max: 8, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 14. Cockcroft-Gault CrCl
    // ════════════════════════════════════════════════════════════════
    {
      id: 'crcl',
      name: 'Cockcroft-Gault CrCl',
      category: 'Renal / Electrolytes',
      desc: 'Creatinine clearance \u2014 essential for renal dose adjustment',
      fields: [
        { id: 'age', label: 'Age', type: 'number', min: 1, max: 120, patientAuto: s => s.age || '' },
        { id: 'weight', label: 'Weight (kg)', type: 'number', min: 20, max: 300, patientAuto: s => s.weight || '' },
        { id: 'scr', label: 'Serum creatinine (\u00b5mol/L)', type: 'number', min: 20, max: 1500, placeholder: '88' },
        { id: 'female', label: 'Female', type: 'bool', patientAuto: s => s.sex === 'female' },
      ],
      calculate(v) {
        const age = Number(v.age) || 0;
        const wt = Number(v.weight) || 0;
        const scr = Number(v.scr) || 0;
        if (!age || !wt || !scr) return { score: null, label: 'Incomplete', interpretation: 'Enter age, weight, and serum creatinine.', risk: 'none', actions: [] };
        let crcl = ((140 - age) * wt) / (0.815 * scr);
        if (v.female) crcl *= 0.85;
        crcl = Math.round(crcl);
        let label, interpretation, risk, actions = [];
        if (crcl >= 90) {
          label = 'Normal (\u226590)'; risk = 'low';
          interpretation = `CrCl \u2248 ${crcl} mL/min. Normal renal function. Standard drug dosing.`;
          actions = [{ kind: 'monitor', name: 'No adjustment needed', dose: 'Standard dosing for all medications', rationale: 'Normal renal clearance' }];
        } else if (crcl >= 60) {
          label = 'Mild impairment (60\u201389)'; risk = 'low';
          interpretation = `CrCl \u2248 ${crcl} mL/min. Mild impairment. Check dose adjustments for renally-cleared drugs.`;
          actions = [
            { kind: 'monitor', name: 'Dose review', dose: 'Check renally-cleared medications', rationale: 'Gabapentin, metformin, DOACs, digoxin may need adjustment' },
          ];
        } else if (crcl >= 30) {
          label = 'Moderate impairment (30\u201359)'; risk = 'caution';
          interpretation = `CrCl \u2248 ${crcl} mL/min. Moderate impairment. Reduce doses for renally-cleared drugs.`;
          actions = [
            { kind: 'rx', name: 'Gabapentin', dose: 'Reduce to 200\u2013300 mg BID (not TID)', rationale: '100% renally cleared \u2014 must reduce', dispense: '60 caps', duration: '30 days' },
            { kind: 'rx', name: 'Metformin', dose: 'Max 1000 mg/day if CrCl 30\u201345; hold if <30', rationale: 'Lactic acidosis risk with renal decline' },
            { kind: 'monitor', name: 'Repeat Cr/CrCl', dose: 'q3\u20136 months', rationale: 'Monitor for progression of CKD' },
          ];
        } else if (crcl >= 15) {
          label = 'Severe impairment (15\u201329)'; risk = 'high';
          interpretation = `CrCl \u2248 ${crcl} mL/min. Severe impairment. Major dose reductions. Avoid nephrotoxins.`;
          actions = [
            { kind: 'rx', name: 'STOP NSAIDs', dose: 'Discontinue all NSAIDs', rationale: 'Nephrotoxic \u2014 will worsen renal function' },
            { kind: 'rx', name: 'HOLD metformin', dose: 'Discontinue if CrCl <30', rationale: 'Lactic acidosis risk' },
            { kind: 'referral', name: 'Nephrology referral', dose: 'Urgent', rationale: 'CKD stage 4 \u2014 plan for possible RRT' },
          ];
        } else {
          label = 'End-stage (<15)'; risk = 'high';
          interpretation = `CrCl \u2248 ${crcl} mL/min. End-stage renal disease.`;
          actions = [
            { kind: 'referral', name: 'Nephrology referral', dose: 'Urgent \u2014 dialysis planning', rationale: 'CKD stage 5 / ESRD' },
          ];
        }
        return { score: crcl, unit: 'mL/min', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 15. Corrected Calcium
    // ════════════════════════════════════════════════════════════════
    {
      id: 'calcium',
      name: 'Corrected Calcium',
      category: 'Renal / Electrolytes',
      desc: 'Corrects calcium for albumin \u2014 guides supplementation',
      fields: [
        { id: 'ca', label: 'Measured total calcium (mmol/L)', type: 'number', min: 1, max: 5, step: 0.01, placeholder: '2.20' },
        { id: 'albumin', label: 'Albumin (g/L)', type: 'number', min: 10, max: 55, placeholder: '40' },
      ],
      calculate(v) {
        const ca = Number(v.ca) || 0;
        const alb = Number(v.albumin) || 0;
        if (!ca || !alb) return { score: null, label: 'Incomplete', interpretation: 'Enter calcium and albumin.', risk: 'none', actions: [] };
        const corrected = +(ca + 0.02 * (40 - alb)).toFixed(2);
        let label, interpretation, risk, actions = [];
        if (corrected < 2.12) {
          label = 'Hypocalcemia'; risk = 'caution';
          interpretation = `Corrected Ca = ${corrected} mmol/L. Low \u2014 investigate cause.`;
          actions = [
            { kind: 'rx', name: 'Calcium carbonate', dose: '500\u20131000 mg elemental Ca PO BID-TID', rationale: 'Oral supplementation for mild\u2013moderate hypocalcemia', dispense: '90 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Vitamin D3', dose: '1000\u20132000 IU PO daily', rationale: 'Correct underlying deficiency', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Calcitriol', dose: '0.25 \u00b5g PO daily', rationale: 'If CKD with impaired 1-alpha-hydroxylation', dispense: '30 caps', duration: '30 days' },
            { kind: 'test', name: 'PTH, 25-OH Vitamin D', dose: 'Fasting', rationale: 'Identify cause of hypocalcemia' },
          ];
        } else if (corrected <= 2.62) {
          label = 'Normal'; risk = 'low';
          interpretation = `Corrected Ca = ${corrected} mmol/L. Normal (2.12\u20132.62).`;
          actions = [{ kind: 'monitor', name: 'No action needed', dose: 'Routine monitoring', rationale: 'Calcium within normal range' }];
        } else if (corrected <= 3.0) {
          label = 'Mild hypercalcemia'; risk = 'caution';
          interpretation = `Corrected Ca = ${corrected} mmol/L. Mildly elevated.`;
          actions = [
            { kind: 'rx', name: 'IV Normal Saline', dose: '200\u2013300 mL/hr', rationale: 'Hydration first-line for hypercalcemia' },
            { kind: 'test', name: 'PTH, 25-OH Vit D, PTHrP, SPEP', dose: 'Investigate cause', rationale: 'Most common: primary hyperparathyroidism, malignancy' },
          ];
        } else {
          label = 'Severe hypercalcemia'; risk = 'high';
          interpretation = `Corrected Ca = ${corrected} mmol/L. Severely elevated \u2014 medical emergency.`;
          actions = [
            { kind: 'rx', name: 'IV Normal Saline', dose: '200\u2013500 mL/hr (aggressive)', rationale: 'Volume expansion \u2014 first priority' },
            { kind: 'rx', name: 'Zoledronic acid', dose: '4 mg IV over 15 min', rationale: 'Bisphosphonate for malignancy-related (onset 2\u20134 days)' },
            { kind: 'rx', name: 'Calcitonin', dose: '4 IU/kg SC/IM q12h', rationale: 'Rapid onset (hours) \u2014 bridge until bisphosphonate works' },
            { kind: 'rx', name: 'Furosemide', dose: '20\u201340 mg IV after hydration', rationale: 'Calciuresis \u2014 only AFTER euvolemia' },
            { kind: 'referral', name: 'Hospital admission', dose: 'Urgent', rationale: 'Severe hypercalcemia requires inpatient management' },
          ];
        }
        return { score: corrected, unit: 'mmol/L', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 16. Corrected Sodium
    // ════════════════════════════════════════════════════════════════
    {
      id: 'sodium',
      name: 'Corrected Sodium',
      category: 'Renal / Electrolytes',
      desc: 'Corrects sodium for hyperglycemia \u2014 guides fluid management',
      fields: [
        { id: 'na', label: 'Measured sodium (mmol/L)', type: 'number', min: 100, max: 180, placeholder: '135' },
        { id: 'glucose', label: 'Glucose (mmol/L)', type: 'number', min: 2, max: 80, step: 0.1, placeholder: '5.5' },
      ],
      calculate(v) {
        const na = Number(v.na) || 0;
        const glu = Number(v.glucose) || 0;
        if (!na || !glu) return { score: null, label: 'Incomplete', interpretation: 'Enter sodium and glucose.', risk: 'none', actions: [] };
        const corrected = +(na + 2.4 * ((glu - 5.5) / 5.5)).toFixed(1);
        let label, interpretation, risk, actions = [];
        if (corrected < 130) {
          label = 'Hyponatremia'; risk = 'caution';
          interpretation = `Corrected Na \u2248 ${corrected} mmol/L. True hyponatremia after glucose correction.`;
          actions = [
            { kind: 'rx', name: 'Fluid restriction', dose: '1\u20131.5 L/day', rationale: 'First-line for euvolemic hyponatremia (SIADH)' },
            { kind: 'rx', name: 'Normal Saline', dose: '0.9% NaCl if hypovolemic', rationale: 'Volume replacement for hypovolemic hyponatremia' },
            { kind: 'test', name: 'Serum osmolality, urine Na/osmolality', dose: 'Stat', rationale: 'Determine etiology: SIADH vs hypovolemic vs hypervolemic' },
          ];
        } else if (corrected > 145) {
          label = 'Hypernatremia (true)'; risk = 'caution';
          interpretation = `Corrected Na \u2248 ${corrected} mmol/L. True hypernatremia.`;
          actions = [
            { kind: 'rx', name: 'D5W or free water', dose: 'Replace deficit over 48\u201372h', rationale: 'Correct no faster than 10 mmol/L per 24h' },
            { kind: 'monitor', name: 'Serum Na q4\u20136h', dose: 'During correction', rationale: 'Avoid overcorrection causing cerebral edema' },
          ];
        } else {
          label = 'Normal (after correction)'; risk = 'low';
          interpretation = `Corrected Na \u2248 ${corrected} mmol/L. Normal after glucose correction.`;
          actions = [{ kind: 'monitor', name: 'No action needed', dose: 'Apparent hyponatremia was dilutional', rationale: 'Will normalize as glucose is corrected' }];
        }
        return { score: corrected, unit: 'mmol/L', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 17. FIB-4
    // ════════════════════════════════════════════════════════════════
    {
      id: 'fib4',
      name: 'FIB-4',
      category: 'GI / Hepatology',
      desc: 'Liver fibrosis risk \u2014 guides hepatology referral',
      fields: [
        { id: 'age', label: 'Age', type: 'number', min: 18, max: 120, patientAuto: s => s.age || '' },
        { id: 'ast', label: 'AST (U/L)', type: 'number', min: 1, max: 1000, placeholder: '25' },
        { id: 'alt', label: 'ALT (U/L)', type: 'number', min: 1, max: 1000, placeholder: '25' },
        { id: 'platelets', label: 'Platelets (\u00d710\u2079/L)', type: 'number', min: 10, max: 1000, placeholder: '250' },
      ],
      calculate(v) {
        const age = Number(v.age) || 0;
        const ast = Number(v.ast) || 0;
        const alt = Number(v.alt) || 0;
        const plt = Number(v.platelets) || 0;
        if (!age || !ast || !alt || !plt) return { score: null, label: 'Incomplete', interpretation: 'Enter all values.', risk: 'none', actions: [] };
        const fib4 = +((age * ast) / (plt * Math.sqrt(alt))).toFixed(2);
        let label, interpretation, risk, actions = [];
        if (fib4 < 1.3) {
          label = 'Low risk for fibrosis'; risk = 'low';
          interpretation = `FIB-4 = ${fib4}. Low probability of advanced fibrosis (NPV >90%).`;
          actions = [{ kind: 'monitor', name: 'Reassess in 1\u20133 years', dose: 'Repeat FIB-4', rationale: 'Low risk \u2014 routine monitoring sufficient' }];
        } else if (fib4 <= 2.67) {
          label = 'Indeterminate'; risk = 'caution';
          interpretation = `FIB-4 = ${fib4}. Indeterminate \u2014 further assessment needed.`;
          actions = [
            { kind: 'referral', name: 'FibroScan referral', dose: 'Transient elastography', rationale: 'Confirm/rule out significant fibrosis (F2+)' },
            { kind: 'monitor', name: 'Lifestyle modification', dose: 'Weight loss if MASLD, alcohol cessation', rationale: 'First-line for all liver fibrosis causes' },
          ];
        } else {
          label = 'High risk \u2014 advanced fibrosis'; risk = 'high';
          interpretation = `FIB-4 = ${fib4}. High probability of advanced fibrosis/cirrhosis (PPV 65\u201380%).`;
          actions = [
            { kind: 'referral', name: 'Hepatology referral', dose: 'Urgent', rationale: 'Assessment for cirrhosis, variceal screening, HCC surveillance' },
            { kind: 'rx', name: 'Ursodiol', dose: '13\u201315 mg/kg/day PO', rationale: 'If PBC or cholestatic liver disease', dispense: '90 caps', duration: '30 days' },
            { kind: 'monitor', name: 'Lifestyle modification', dose: 'Weight loss 7\u201310% if MASLD', rationale: 'Can reverse fibrosis in MASLD \u2014 strongest evidence for F1\u2013F3' },
          ];
        }
        return { score: fib4, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 18. BMI
    // ════════════════════════════════════════════════════════════════
    {
      id: 'bmi',
      name: 'BMI Calculator',
      category: 'Endocrine / Metabolic',
      desc: 'Body mass index \u2014 guides obesity pharmacotherapy',
      fields: [
        { id: 'weight', label: 'Weight (kg)', type: 'number', min: 20, max: 400, patientAuto: s => s.weight || '' },
        { id: 'height', label: 'Height (cm)', type: 'number', min: 100, max: 250, placeholder: '170' },
      ],
      calculate(v) {
        const wt = Number(v.weight) || 0;
        const ht = Number(v.height) || 0;
        if (!wt || !ht) return { score: null, label: 'Incomplete', interpretation: 'Enter weight and height.', risk: 'none', actions: [] };
        const bmi = +(wt / ((ht / 100) ** 2)).toFixed(1);
        let label, interpretation, risk, actions = [];
        if (bmi < 18.5) {
          label = 'Underweight'; risk = 'caution';
          interpretation = `BMI ${bmi}. Underweight.`;
          actions = [
            { kind: 'test', name: 'Nutritional assessment', dose: 'Albumin, prealbumin, B12, folate, iron studies', rationale: 'Assess for nutritional deficiency or malabsorption' },
            { kind: 'referral', name: 'Dietitian referral', dose: 'Nutritional counseling', rationale: 'Structured nutritional support' },
          ];
        } else if (bmi < 25) {
          label = 'Normal weight'; risk = 'low';
          interpretation = `BMI ${bmi}. Normal range.`;
          actions = [{ kind: 'monitor', name: 'Maintain healthy lifestyle', dose: 'Annual BMI check', rationale: 'No intervention needed' }];
        } else if (bmi < 30) {
          label = 'Overweight'; risk = 'low';
          interpretation = `BMI ${bmi}. Overweight. Lifestyle modifications recommended.`;
          actions = [
            { kind: 'monitor', name: 'Lifestyle intervention', dose: 'Diet + 150 min/week exercise', rationale: 'First-line for overweight' },
          ];
        } else if (bmi < 35) {
          label = 'Obese class I'; risk = 'caution';
          interpretation = `BMI ${bmi}. Obesity class I. Pharmacotherapy indicated if comorbidities.`;
          actions = [
            { kind: 'rx', name: 'Semaglutide', dose: '0.25 mg SC weekly, titrate to 2.4 mg over 16 weeks', rationale: 'GLP-1 RA \u2014 STEP trials: 15\u201317% weight loss', condition: 'obesity', dispense: '4 pens', duration: '30 days' },
            { kind: 'rx', name: 'Liraglutide', dose: '0.6 mg SC daily, titrate to 3.0 mg over 4 weeks', rationale: 'GLP-1 RA \u2014 SCALE: ~8% weight loss', dispense: '5 pens', duration: '30 days' },
            { kind: 'rx', name: 'Orlistat', dose: '120 mg PO TID with meals', rationale: 'Lipase inhibitor \u2014 modest ~3% weight loss', dispense: '90 caps', duration: '30 days' },
            { kind: 'monitor', name: 'Lifestyle intervention', dose: 'Diet + exercise concurrent with medication', rationale: 'Pharmacotherapy without lifestyle changes has diminished benefit' },
          ];
        } else if (bmi < 40) {
          label = 'Obese class II'; risk = 'high';
          interpretation = `BMI ${bmi}. Obesity class II. Pharmacotherapy recommended. Consider bariatric surgery if comorbidities.`;
          actions = [
            { kind: 'rx', name: 'Semaglutide', dose: '0.25 mg SC weekly, titrate to 2.4 mg', rationale: 'Most effective weight loss medication \u2014 ~15\u201317%', condition: 'obesity', dispense: '4 pens', duration: '30 days' },
            { kind: 'rx', name: 'Tirzepatide', dose: '2.5 mg SC weekly, titrate to 10\u201315 mg', rationale: 'Dual GIP/GLP-1 \u2014 SURMOUNT: ~20% weight loss', dispense: '4 pens', duration: '30 days' },
            { kind: 'referral', name: 'Bariatric surgery referral', dose: 'If BMI \u226535 + comorbidity', rationale: 'Most effective long-term intervention' },
          ];
        } else {
          label = 'Obese class III (morbid)'; risk = 'high';
          interpretation = `BMI ${bmi}. Morbid obesity. Bariatric surgery strongly recommended.`;
          actions = [
            { kind: 'rx', name: 'Semaglutide', dose: '2.4 mg SC weekly (after titration)', rationale: 'Bridge to surgery or standalone', condition: 'obesity', dispense: '4 pens', duration: '30 days' },
            { kind: 'rx', name: 'Tirzepatide', dose: '10\u201315 mg SC weekly (after titration)', rationale: 'Most potent weight loss \u2014 ~22%', dispense: '4 pens', duration: '30 days' },
            { kind: 'referral', name: 'Bariatric surgery referral', dose: 'Strongly recommended', rationale: 'BMI \u226540 is independent indication' },
          ];
        }
        return { score: bmi, unit: 'kg/m\u00b2', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 19. HOMA-IR
    // ════════════════════════════════════════════════════════════════
    {
      id: 'homa-ir',
      name: 'HOMA-IR',
      category: 'Endocrine / Metabolic',
      desc: 'Insulin resistance \u2014 guides metformin initiation',
      fields: [
        { id: 'insulin', label: 'Fasting insulin (\u00b5U/mL)', type: 'number', min: 0.5, max: 200, step: 0.1, placeholder: '10' },
        { id: 'glucose', label: 'Fasting glucose (mmol/L)', type: 'number', min: 2, max: 30, step: 0.1, placeholder: '5.0' },
      ],
      calculate(v) {
        const ins = Number(v.insulin) || 0;
        const glu = Number(v.glucose) || 0;
        if (!ins || !glu) return { score: null, label: 'Incomplete', interpretation: 'Enter fasting insulin and glucose.', risk: 'none', actions: [] };
        const homa = +((ins * glu) / 22.5).toFixed(2);
        let label, interpretation, risk, actions = [];
        if (homa < 1.0) {
          label = 'Normal sensitivity'; risk = 'low';
          interpretation = `HOMA-IR = ${homa}. Normal insulin sensitivity.`;
          actions = [{ kind: 'monitor', name: 'No action needed', dose: 'Annual screening if risk factors', rationale: 'Normal insulin sensitivity' }];
        } else if (homa < 2.0) {
          label = 'Early insulin resistance'; risk = 'low';
          interpretation = `HOMA-IR = ${homa}. Early insulin resistance.`;
          actions = [{ kind: 'monitor', name: 'Lifestyle intervention', dose: 'Weight loss 5\u20137%, 150 min/week exercise', rationale: 'Can reverse early insulin resistance (DPP trial)' }];
        } else if (homa < 2.5) {
          label = 'Insulin resistance'; risk = 'caution';
          interpretation = `HOMA-IR = ${homa}. Insulin resistance present. Consider metformin if prediabetes.`;
          actions = [
            { kind: 'rx', name: 'Metformin', dose: '500 mg PO daily, titrate to 1000 mg BID', rationale: 'First-line for insulin resistance / prediabetes (DPP: 31% DM risk reduction)', condition: 'type-2-diabetes', dispense: '60 tabs', duration: '30 days', refills: 5 },
            { kind: 'monitor', name: 'Lifestyle intervention', dose: 'Weight loss 5\u20137%', rationale: 'Combined with metformin for best results' },
          ];
        } else {
          label = 'Significant insulin resistance'; risk = 'high';
          interpretation = `HOMA-IR = ${homa}. Significant insulin resistance. Metformin recommended.`;
          actions = [
            { kind: 'rx', name: 'Metformin', dose: '500 mg PO BID, titrate to 1000 mg BID', rationale: 'First-line \u2014 improves sensitivity, reduces hepatic glucose output', condition: 'type-2-diabetes', dispense: '60 tabs', duration: '30 days', refills: 5 },
            { kind: 'test', name: 'Screen for MASLD', dose: 'FIB-4, then FibroScan if indeterminate', rationale: 'Insulin resistance strongly associated with fatty liver disease' },
          ];
        }
        return { score: homa, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 20. Steroid Conversion
    // ════════════════════════════════════════════════════════════════
    {
      id: 'steroid',
      name: 'Steroid Conversion',
      category: 'Endocrine / Metabolic',
      desc: 'Glucocorticoid dose equivalence calculator',
      fields: [
        { id: 'drug', label: 'Current steroid', type: 'select', options: [
          { value: 'hydrocortisone', label: 'Hydrocortisone' },
          { value: 'prednisone', label: 'Prednisone / Prednisolone' },
          { value: 'methylprednisolone', label: 'Methylprednisolone' },
          { value: 'dexamethasone', label: 'Dexamethasone' },
          { value: 'triamcinolone', label: 'Triamcinolone' },
          { value: 'betamethasone', label: 'Betamethasone' },
        ]},
        { id: 'dose', label: 'Current dose (mg)', type: 'number', min: 0.1, max: 2000, step: 0.1, placeholder: '40' },
      ],
      calculate(v) {
        const dose = Number(v.dose) || 0;
        const drug = v.drug;
        if (!dose || !drug) return { score: null, label: 'Incomplete', interpretation: 'Select steroid and enter dose.', risk: 'none', actions: [] };
        const eq = { hydrocortisone: 4, prednisone: 1, methylprednisolone: 0.8, dexamethasone: 0.15, triamcinolone: 0.8, betamethasone: 0.12 };
        const names = { hydrocortisone: 'Hydrocortisone', prednisone: 'Prednisone', methylprednisolone: 'Methylprednisolone', dexamethasone: 'Dexamethasone', triamcinolone: 'Triamcinolone', betamethasone: 'Betamethasone' };
        const predEquiv = dose / eq[drug];
        const actions = Object.entries(eq)
          .filter(([k]) => k !== drug)
          .map(([k, ratio]) => ({
            kind: 'rx', name: names[k], dose: (predEquiv * ratio).toFixed(2) + ' mg', rationale: `Equivalent to ${dose} mg ${names[drug]}`,
          }));
        let risk = 'low';
        let interpretation = `${dose} mg ${names[drug]} = ${predEquiv.toFixed(1)} mg prednisone equivalent.`;
        if (predEquiv >= 20) {
          risk = 'caution';
          interpretation += ' High-dose steroid \u2014 consider GI prophylaxis, monitor glucose, plan taper.';
          actions.push(
            { kind: 'rx', name: 'Pantoprazole', dose: '40 mg PO daily', rationale: 'GI prophylaxis for high-dose steroid (>20 mg pred equiv)', dispense: '30 tabs', duration: '30 days' },
            { kind: 'rx', name: 'Calcium + Vit D', dose: '500 mg Ca + 1000 IU D3 daily', rationale: 'Bone protection if steroid >3 months', dispense: '30 tabs', duration: '30 days' },
          );
        }
        if (predEquiv >= 7.5) {
          interpretation += ' Adrenal suppression possible if >2\u20133 weeks \u2014 taper, do not stop abruptly.';
        }
        const label = `= ${predEquiv.toFixed(1)} mg prednisone equivalent`;
        return { score: predEquiv.toFixed(1), unit: 'mg pred-equiv', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 21. MME
    // ════════════════════════════════════════════════════════════════
    {
      id: 'mme',
      name: 'MME Calculator',
      category: 'Pain / Opioid',
      desc: 'Morphine milligram equivalents \u2014 opioid risk assessment',
      fields: [
        { id: 'opioid', label: 'Opioid', type: 'select', options: [
          { value: 'codeine', label: 'Codeine' },
          { value: 'tramadol', label: 'Tramadol' },
          { value: 'morphine-po', label: 'Morphine (oral)' },
          { value: 'morphine-iv', label: 'Morphine (IV/SC)' },
          { value: 'oxycodone', label: 'Oxycodone' },
          { value: 'hydromorphone-po', label: 'Hydromorphone (oral)' },
          { value: 'hydromorphone-iv', label: 'Hydromorphone (IV/SC)' },
          { value: 'fentanyl-patch', label: 'Fentanyl patch (\u00b5g/hr)' },
          { value: 'methadone', label: 'Methadone (see note)' },
        ]},
        { id: 'dose', label: 'Total daily dose (mg, or \u00b5g/hr for fentanyl)', type: 'number', min: 0.1, max: 5000, step: 0.1, placeholder: '30' },
      ],
      calculate(v) {
        const dose = Number(v.dose) || 0;
        const opioid = v.opioid;
        if (!dose || !opioid) return { score: null, label: 'Incomplete', interpretation: 'Select opioid and enter daily dose.', risk: 'none', actions: [] };
        const factors = { 'codeine': 0.15, 'tramadol': 0.1, 'morphine-po': 1, 'morphine-iv': 3, 'oxycodone': 1.5, 'hydromorphone-po': 4, 'hydromorphone-iv': 20, 'fentanyl-patch': 2.4, 'methadone': 4.7 };
        const mme = Math.round(dose * (factors[opioid] || 1));
        let label, interpretation, risk, actions = [];
        interpretation = opioid === 'methadone'
          ? `\u26a0\ufe0f Methadone conversion is highly variable. Estimate: ${mme} MME/day. Consult specialist.`
          : `Daily MME = ${mme} mg.`;
        if (mme < 50) {
          label = 'Lower risk (<50 MME/day)'; risk = 'low';
          interpretation += ' Below 50 MME/day threshold.';
          actions = [{ kind: 'monitor', name: 'Standard opioid monitoring', dose: 'PMP check, pain reassessment q3 months', rationale: 'Routine monitoring for any opioid therapy' }];
        } else if (mme < 90) {
          label = 'Moderate risk (50\u201389 MME/day)'; risk = 'caution';
          interpretation += ' At 50+ MME/day, overdose risk doubles.';
          actions = [
            { kind: 'rx', name: 'Naloxone kit', dose: 'Prescribe take-home naloxone', rationale: 'CDC recommends for all patients \u226550 MME/day', dispense: '2 doses', duration: 'PRN' },
            { kind: 'monitor', name: 'Taper plan', dose: 'Reduce 10% every 1\u20134 weeks', rationale: 'Consider gradual reduction toward <50 MME/day' },
          ];
        } else {
          label = 'High risk (\u226590 MME/day)'; risk = 'high';
          interpretation += ' At \u226590 MME/day, overdose risk 10\u00d7 higher.';
          actions = [
            { kind: 'rx', name: 'Naloxone kit', dose: 'Prescribe take-home naloxone (mandatory)', rationale: 'Life-saving \u2014 required at \u226590 MME/day', dispense: '2 doses', duration: 'PRN' },
            { kind: 'referral', name: 'Pain specialist referral', dose: 'Multidisciplinary', rationale: 'Required for \u226590 MME to explore multimodal alternatives' },
            { kind: 'rx', name: 'Gabapentin', dose: '300\u20131200 mg TID', rationale: 'Opioid-sparing adjuvant for neuropathic pain', dispense: '90 caps', duration: '30 days' },
            { kind: 'rx', name: 'Duloxetine', dose: '60 mg PO daily', rationale: 'SNRI \u2014 opioid-sparing for chronic pain + mood', dispense: '30 caps', duration: '30 days' },
            { kind: 'monitor', name: 'Taper plan', dose: 'Reduce 10% every 2\u20134 weeks toward <50 MME', rationale: 'Gradual reduction with multimodal pain support' },
          ];
        }
        return { score: mme, unit: 'MME/day', label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 22. IPSS
    // ════════════════════════════════════════════════════════════════
    {
      id: 'ipss',
      name: 'IPSS',
      category: 'Urology',
      desc: 'Prostate symptom score \u2014 guides BPH pharmacotherapy',
      scaleHeader: ['0 \u2014 Not at all', '1 \u2014 <1 in 5', '2 \u2014 <Half', '3 \u2014 ~Half', '4 \u2014 >Half', '5 \u2014 Almost always'],
      fields: [
        { id: 'q1', label: 'Incomplete emptying: sensation of not emptying bladder', type: 'scale', max: 5 },
        { id: 'q2', label: 'Frequency: urinate again <2 hours after finishing', type: 'scale', max: 5 },
        { id: 'q3', label: 'Intermittency: stop and start several times', type: 'scale', max: 5 },
        { id: 'q4', label: 'Urgency: difficult to postpone urination', type: 'scale', max: 5 },
        { id: 'q5', label: 'Weak stream', type: 'scale', max: 5 },
        { id: 'q6', label: 'Straining: have to push or strain to begin', type: 'scale', max: 5 },
        { id: 'q7', label: 'Nocturia: times getting up at night to urinate', type: 'scale', max: 5 },
      ],
      calculate(v) {
        const score = Object.values(v).reduce((s, x) => s + (Number(x) || 0), 0);
        let label, interpretation, risk, actions = [];
        if (score <= 7) {
          label = 'Mild symptoms'; risk = 'low';
          interpretation = `IPSS ${score}/35. Mild. Watchful waiting \u2014 reassess annually.`;
          actions = [{ kind: 'monitor', name: 'Watchful waiting', dose: 'Annual IPSS reassessment', rationale: 'Mild symptoms may not require treatment' }];
        } else if (score <= 19) {
          label = 'Moderate symptoms'; risk = 'caution';
          interpretation = `IPSS ${score}/35. Moderate LUTS. Pharmacotherapy recommended.`;
          actions = [
            { kind: 'rx', name: 'Tamsulosin', dose: '0.4 mg PO daily (30 min after same meal)', rationale: 'Alpha-1 blocker \u2014 first-line, rapid onset', condition: 'luts-bph', dispense: '30 caps', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Silodosin', dose: '8 mg PO daily with a meal', rationale: 'More selective alpha blocker \u2014 less orthostatic hypotension', dispense: '30 caps', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Finasteride', dose: '5 mg PO daily', rationale: '5-ARI \u2014 add if prostate >30g or PSA >1.5 (6\u201312 mo for full effect)', condition: 'luts-bph', dispense: '30 tabs', duration: '30 days', refills: 5 },
          ];
        } else {
          label = 'Severe symptoms'; risk = 'high';
          interpretation = `IPSS ${score}/35. Severe LUTS. Combination therapy recommended.`;
          actions = [
            { kind: 'rx', name: 'Tamsulosin', dose: '0.4 mg PO daily', rationale: 'Alpha blocker for rapid symptom relief', condition: 'luts-bph', dispense: '30 caps', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Dutasteride', dose: '0.5 mg PO daily', rationale: '5-ARI \u2014 combine with alpha blocker (CombAT trial)', condition: 'luts-bph', dispense: '30 caps', duration: '30 days', refills: 5 },
            { kind: 'rx', name: 'Tadalafil', dose: '5 mg PO daily', rationale: 'PDE5i \u2014 approved for BPH-LUTS, especially if concurrent ED', dispense: '30 tabs', duration: '30 days', refills: 5 },
            { kind: 'referral', name: 'Urology referral', dose: 'Surgical options (TURP, minimally invasive)', rationale: 'Consider if medical therapy fails' },
          ];
        }
        return { score, max: 35, label, interpretation, risk, actions };
      },
    },

    // ════════════════════════════════════════════════════════════════
    // 23. PERC Rule
    // ════════════════════════════════════════════════════════════════
    {
      id: 'perc',
      name: 'PERC Rule',
      category: 'Respiratory',
      desc: 'PE exclusion criteria \u2014 if ALL negative, no D-dimer needed',
      fields: [
        { id: 'age50', label: 'Age \u226550', type: 'bool', patientAuto: s => s.age >= 50 },
        { id: 'hr100', label: 'Heart rate \u2265100', type: 'bool' },
        { id: 'o2low', label: 'SpO\u2082 <95% on room air', type: 'bool' },
        { id: 'hemoptysis', label: 'Hemoptysis', type: 'bool' },
        { id: 'estrogen', label: 'Estrogen use (OCP, HRT)', type: 'bool' },
        { id: 'surgery', label: 'Surgery or trauma within 4 weeks', type: 'bool' },
        { id: 'prevDVTPE', label: 'Prior DVT/PE', type: 'bool' },
        { id: 'legSwelling', label: 'Unilateral leg swelling', type: 'bool' },
      ],
      calculate(v) {
        const anyPositive = Object.values(v).some(Boolean);
        let label, interpretation, risk, actions = [];
        if (!anyPositive) {
          label = 'PERC negative \u2014 PE excluded'; risk = 'low';
          interpretation = 'All 8 PERC criteria negative. In low pre-test probability, PE effectively excluded. No D-dimer needed.';
          actions = [{ kind: 'monitor', name: 'PE ruled out', dose: 'No further workup needed', rationale: 'PERC negative in low pre-test probability patient' }];
        } else {
          const count = Object.values(v).filter(Boolean).length;
          label = `PERC positive (${count} criteria)`; risk = 'caution';
          interpretation = `${count} PERC criteria positive. Cannot rule out PE. Proceed with D-dimer or Wells PE.`;
          actions = [
            { kind: 'test', name: 'D-dimer', dose: 'Age-adjusted cutoff (age \u00d710 if >50)', rationale: 'Next step when PERC fails in low-risk patient' },
            { kind: 'monitor', name: 'Calculate Wells PE', dose: 'Formal risk stratification', rationale: 'Guide imaging decision' },
          ];
        }
        return { score: anyPositive ? 1 : 0, label, interpretation, risk, actions };
      },
    },

  ]; // end CALCULATORS

  // ─── PUBLIC API ─────────────────────────────────────────────────────
  function getCalculator(id) { return CALCULATORS.find(c => c.id === id); }
  function getByCategory(cat) { return CALCULATORS.filter(c => c.category === cat); }
  function search(query) {
    if (!query) return CALCULATORS;
    const q = query.toLowerCase();
    return CALCULATORS.filter(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }
  function autoFillFromPatient(calc, patientState) {
    const vals = {};
    if (!patientState) return vals;
    calc.fields.forEach(f => { if (f.patientAuto) { const v = f.patientAuto(patientState); if (v !== undefined && v !== null && v !== '') vals[f.id] = v; } });
    return vals;
  }

  return { CATEGORIES, CALCULATORS, CATALOG_MAP, getCalculator, getByCategory, search, autoFillFromPatient, buildScoreOrder, buildScoreCopyPack, findCatalogMatch };
})();
