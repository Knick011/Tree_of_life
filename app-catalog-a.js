window.TOLCatalog = [
  {
    id: 'nitrofurantoin',
    condition: 'cystitis',
    labels: { en: 'Nitrofurantoin', fr: 'Nitrofurantoine' },
    type: { en: 'Adult first-line urinary draft', fr: 'Premiere ligne urinaire adulte' },
    form: { en: '100 mg capsule', fr: 'Capsule 100 mg' },
    rationale: {
      en: 'A focused adult cystitis option that stays strong when the review is truly uncomplicated and renal function is adequate.',
    },
    pros: {
      en: ['Strong outpatient fit', 'Usually favored on local formularies', 'Clear short-course formatting'],
    },
    cons: {
      en: ['Not comfortable if renal function is low', 'Not a tissue-penetrating fallback for upper-tract concern'],
    },
    evidence: {
      en: ['Adult cystitis pathway mirror', 'Renal safety gate', 'Local formulary weighting'],
    },
    basePreference: { CA: 90, US: 82, UK: 91 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common first-line choice', price: 14.5, codeSystem: 'DIN', code: 'DEMO-CA-NITRO' },
      US: { available: true, preferred: false, formulary: 'Common retail option', price: 18.4, codeSystem: 'RxNorm', code: 'DEMO-US-NITRO' },
      UK: { available: true, preferred: true, formulary: 'Locally preferred', price: 4.8, codeSystem: 'dm+d', code: 'DEMO-UK-NITRO' },
    },
    dose: {
      en: 'Nitrofurantoin 100 mg by mouth twice daily for 5 days.',
    },
    order: {
      medication: 'Nitrofurantoin 100 mg capsule',
      sig: { en: 'Take 1 capsule by mouth twice daily for 5 days.' },
      dispense: '10 capsules',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Intended for uncomplicated lower urinary symptoms only in this mock.' },
    },
    symptomBoosts: { dysuria: 3, frequency: 2, urgency: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.egfr < 45, reason: { en: 'The saved renal threshold fails for this option in the mock.' } },
      { effect: 'blocked', when: (ctx) => ctx.symptoms.includes('flankPain'), reason: { en: 'Flank pain pushes the review away from a simple lower-tract template.' } },
      { effect: 'caution', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Pregnancy review is still required before this remains a comfortable first choice.' } },
    ],
  },
  {
    id: 'fosfomycin',
    condition: 'cystitis',
    labels: { en: 'Fosfomycin', fr: 'Fosfomycine' },
    type: { en: 'Single-dose urinary alternative', fr: 'Alternative urinaire dose unique' },
    form: { en: '3 g sachet', fr: 'Sachet 3 g' },
    rationale: {
      en: 'A useful fallback when the doctor wants a simpler one-time order or wants a different package from the main local favorite.',
    },
    pros: {
      en: ['Single-dose copy format', 'Helpful when adherence is a concern', 'Keeps an alternative visible'],
    },
    cons: {
      en: ['Higher cost in some markets', 'Availability varies', 'Still needs clinician review when the case looks less simple'],
    },
    evidence: {
      en: ['Urinary alternative branch', 'Market availability overlay', 'Packaging convenience'],
    },
    basePreference: { CA: 82, US: 80, UK: 75 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common fallback', price: 18.1, codeSystem: 'DIN', code: 'DEMO-CA-FOSFO' },
      US: { available: true, preferred: true, formulary: 'Often available', price: 27.4, codeSystem: 'RxNorm', code: 'DEMO-US-FOSFO' },
      UK: { available: true, preferred: false, formulary: 'Reserve / review', price: 12.2, codeSystem: 'dm+d', code: 'DEMO-UK-FOSFO' },
    },
    dose: {
      en: 'Fosfomycin 3 g by mouth once.',
    },
    order: {
      medication: 'Fosfomycin 3 g sachet',
      sig: { en: 'Take 1 sachet by mouth once.' },
      dispense: '1 sachet',
      refills: '0',
      duration: 'Single dose',
      pharmacy: { en: 'Single-dose urinary fallback in the mock workflow.' },
    },
    symptomBoosts: { dysuria: 2, frequency: 1, urgency: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.age < 18, reason: { en: 'This fast package asks for age-band review before pediatric use.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('fever'), reason: { en: 'Fever makes the simple urinary path less comfortable and pushes review up.' } },
    ],
  },
  {
    id: 'tmp-smx',
    condition: 'cystitis',
    labels: { en: 'Trimethoprim-sulfamethoxazole', fr: 'Trimethoprime-sulfamethoxazole' },
    type: { en: 'Urinary alternative package', fr: 'Paquet alternatif urinaire' },
    form: { en: 'Double-strength tablet', fr: 'Comprime double concentration' },
    rationale: {
      en: 'This option exists so the doctor can see a recognizable alternative when the first package is not the best fit.',
    },
    pros: {
      en: ['Compact order sentence', 'Recognizable adult outpatient option', 'Useful alternative branch'],
    },
    cons: {
      en: ['Sulfonamide allergy blocks it', 'Interaction review matters', 'Not ideal when pregnancy review is active'],
    },
    evidence: {
      en: ['Alternative urinary branch', 'Allergy exclusion gate', 'Interaction overlay'],
    },
    basePreference: { CA: 70, US: 76, UK: 62 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative only', price: 9.4, codeSystem: 'DIN', code: 'DEMO-CA-TMPSMX' },
      US: { available: true, preferred: true, formulary: 'Common backup option', price: 8.7, codeSystem: 'RxNorm', code: 'DEMO-US-TMPSMX' },
      UK: { available: true, preferred: false, formulary: 'Second-line style review', price: 3.7, codeSystem: 'dm+d', code: 'DEMO-UK-TMPSMX' },
    },
    dose: {
      en: 'One double-strength tablet by mouth twice daily for 3 days.',
    },
    order: {
      medication: 'Trimethoprim-sulfamethoxazole DS tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 3 days.' },
      dispense: '6 tablets',
      refills: '0',
      duration: '3 days',
      pharmacy: { en: 'Alternative urinary branch with allergy and interaction review.' },
    },
    symptomBoosts: { dysuria: 2, urgency: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('sulfonamide'), reason: { en: 'Sulfonamide allergy blocks this package.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('warfarin') || ctx.currentMeds.includes('anticoagulant'), reason: { en: 'Active anticoagulation makes this alternative review-heavy in the mock.' } },
      { effect: 'caution', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Pregnancy review pushes this option out of the comfortable zone.' } },
    ],
  },
  {
    id: 'cephalexin',
    condition: 'cellulitis',
    labels: { en: 'Cephalexin', fr: 'Cephalexine' },
    type: { en: 'Typical oral cellulitis first pass', fr: 'Premiere passe orale cellulite' },
    form: { en: '500 mg capsule', fr: 'Capsule 500 mg' },
    rationale: {
      en: 'A familiar first-pass oral skin-infection package that is easy to paste into a routine outpatient workflow.',
    },
    pros: {
      en: ['Clear outpatient wording', 'Low-cost anchor option', 'Good first draft for uncomplicated non-purulent review'],
    },
    cons: {
      en: ['Beta-lactam allergy needs review', 'Frequent dosing', 'Not a comfort pick if purulence or MRSA concern dominates'],
    },
    evidence: {
      en: ['Cellulitis pathway mirror', 'Local formulary anchor', 'Allergy review gate'],
    },
    basePreference: { CA: 88, US: 84, UK: 70 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Frequent first-line choice', price: 11.6, codeSystem: 'DIN', code: 'DEMO-CA-CEPHALEXIN' },
      US: { available: true, preferred: true, formulary: 'Common retail anchor', price: 10.8, codeSystem: 'RxNorm', code: 'DEMO-US-CEPHALEXIN' },
      UK: { available: true, preferred: false, formulary: 'Visible first-pass alternative', price: 5.4, codeSystem: 'dm+d', code: 'DEMO-UK-CEPHALEXIN' },
    },
    dose: {
      en: 'Cephalexin 500 mg by mouth four times daily for 5 days.',
    },
    order: {
      medication: 'Cephalexin 500 mg capsule',
      sig: { en: 'Take 1 capsule by mouth four times daily for 5 days.' },
      dispense: '20 capsules',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Mock oral cellulitis first-pass package.' },
    },
    symptomBoosts: { redness: 2, warmth: 2, swelling: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Beta-lactam history keeps this visible, but only as a review-heavy branch.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('purulence'), reason: { en: 'Purulence makes a standard non-purulent anchor less comfortable.' } },
    ],
  },
  {
    id: 'clindamycin',
    condition: 'cellulitis',
    labels: { en: 'Clindamycin', fr: 'Clindamycine' },
    type: { en: 'Allergy-friendly cellulitis alternative', fr: 'Alternative cellulite compatible allergie' },
    form: { en: '150 mg capsule', fr: 'Capsule 150 mg' },
    rationale: {
      en: 'This branch stays visible because it is the kind of package a doctor may want when beta-lactam history gets in the way.',
    },
    pros: {
      en: ['Useful allergy alternative', 'Straightforward oral drafting', 'Keeps a non-beta-lactam option visible'],
    },
    cons: {
      en: ['GI tolerance matters', 'Not cost-light everywhere', 'Needs careful use discussion'],
    },
    evidence: {
      en: ['Cellulitis alternative branch', 'Allergy avoidance pattern', 'Cost overlay'],
    },
    basePreference: { CA: 72, US: 80, UK: 68 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative branch', price: 18.7, codeSystem: 'DIN', code: 'DEMO-CA-CLINDA' },
      US: { available: true, preferred: true, formulary: 'Common non-beta-lactam alternative', price: 15.4, codeSystem: 'RxNorm', code: 'DEMO-US-CLINDA' },
      UK: { available: true, preferred: false, formulary: 'Alternative only', price: 7.1, codeSystem: 'dm+d', code: 'DEMO-UK-CLINDA' },
    },
    dose: {
      en: 'Clindamycin 450 mg by mouth three times daily for 5 days.',
    },
    order: {
      medication: 'Clindamycin 150 mg capsule',
      sig: { en: 'Take 3 capsules by mouth three times daily for 5 days.' },
      dispense: '45 capsules',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Alternative cellulitis branch for beta-lactam avoidance in the mock.' },
    },
    symptomBoosts: { redness: 1, warmth: 1, purulence: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.length >= 2, reason: { en: 'The overall medication burden keeps this option in review mode.' } },
    ],
  },
  {
    id: 'doxycycline-sst',
    condition: 'cellulitis',
    labels: { en: 'Doxycycline', fr: 'Doxycycline' },
    type: { en: 'MRSA-leaning oral fallback', fr: 'Alternative orale orientee MRSA' },
    form: { en: '100 mg capsule', fr: 'Capsule 100 mg' },
    rationale: {
      en: 'This card reminds the doctor that a more MRSA-leaning oral branch may be worth comparing when the picture stops looking standard.',
    },
    pros: {
      en: ['Useful fallback branch', 'Simple twice-daily format', 'Keeps escalation logic visible'],
    },
    cons: {
      en: ['Pregnancy blocks it in the mock', 'Sun sensitivity counseling', 'Not always the first comfort choice for routine cellulitis'],
    },
    evidence: {
      en: ['Cellulitis fallback branch', 'Pregnancy gate', 'Alternative-pathway reminder'],
    },
    basePreference: { CA: 68, US: 82, UK: 71 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative branch', price: 10.4, codeSystem: 'DIN', code: 'DEMO-CA-DOXYSST' },
      US: { available: true, preferred: true, formulary: 'Common fallback', price: 8.2, codeSystem: 'RxNorm', code: 'DEMO-US-DOXYSST' },
      UK: { available: true, preferred: false, formulary: 'Visible fallback', price: 4.9, codeSystem: 'dm+d', code: 'DEMO-UK-DOXYSST' },
    },
    dose: {
      en: 'Doxycycline 100 mg by mouth twice daily for 5 days.',
    },
    order: {
      medication: 'Doxycycline 100 mg capsule',
      sig: { en: 'Take 1 capsule by mouth twice daily for 5 days.' },
      dispense: '10 capsules',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Fallback skin-infection branch in the mock.' },
    },
    symptomBoosts: { purulence: 3, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes' || ctx.allergies.includes('tetracycline'), reason: { en: 'Pregnancy or tetracycline allergy blocks this fallback package.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 12, reason: { en: 'This mock keeps the branch in review for younger patients.' } },
    ],
  },
];
