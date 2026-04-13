window.TOLCatalog = (window.TOLCatalog || []).concat([
  {
    id: 'clotrimazole-topical',
    condition: 'ringworm',
    labels: { en: 'Clotrimazole topical', fr: 'Clotrimazole topique' },
    type: { en: 'Topical-first ringworm package', fr: 'Paquet topique premiere ligne teigne' },
    form: { en: '1% cream', fr: 'Creme 1 %' },
    rationale: {
      en: 'This is the clean, copy-friendly first-pass package for localized body ringworm when the presentation still looks limited.',
    },
    pros: {
      en: ['Topical-first logic', 'Low systemic burden', 'Very easy copy/paste output'],
    },
    cons: {
      en: ['Slower response than oral escalation', 'Less comfortable for scalp or extensive disease'],
    },
    evidence: {
      en: ['Topical dermatophyte branch', 'Low-risk first-pass logic', 'Escalation reminder'],
    },
    basePreference: { CA: 84, US: 80, UK: 78 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common first-pass', price: 9.2, codeSystem: 'DIN', code: 'DEMO-CA-CLOTRIM' },
      US: { available: true, preferred: true, formulary: 'Common OTC / retail first-pass', price: 11.6, codeSystem: 'RxNorm', code: 'DEMO-US-CLOTRIM' },
      UK: { available: true, preferred: true, formulary: 'Common first-pass', price: 4.5, codeSystem: 'dm+d', code: 'DEMO-UK-CLOTRIM' },
    },
    dose: {
      en: 'Apply a thin layer twice daily for 2 to 4 weeks.',
    },
    order: {
      medication: 'Clotrimazole 1% cream',
      sig: { en: 'Apply a thin layer to the affected area twice daily for 2 to 4 weeks.' },
      dispense: '1 tube',
      refills: '0',
      duration: '2 to 4 weeks',
      pharmacy: { en: 'Localized body ringworm first-pass package in the mock.' },
    },
    symptomBoosts: { itch: 1, annularRash: 3, scaling: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('scalpScale') || ctx.symptoms.includes('extensiveRash'), reason: { en: 'Scalp or extensive involvement makes a simple topical-only package less comfortable.' } },
    ],
  },
  {
    id: 'terbinafine-topical',
    condition: 'ringworm',
    labels: { en: 'Terbinafine topical', fr: 'Terbinafine topique' },
    type: { en: 'Topical ringworm alternative', fr: 'Alternative topique teigne' },
    form: { en: '1% cream', fr: 'Creme 1 %' },
    rationale: {
      en: 'A good topical alternative that lets the doctor keep another localized branch visible without jumping systemic immediately.',
    },
    pros: {
      en: ['Alternative localized option', 'Still low systemic burden', 'Strong fit for limited disease'],
    },
    cons: {
      en: ['Not a good comfort choice for extensive disease', 'Still needs adherence over time'],
    },
    evidence: {
      en: ['Alternative dermatophyte branch', 'Topical-only pathway', 'Escalation reminder'],
    },
    basePreference: { CA: 82, US: 84, UK: 76 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common localized alternative', price: 10.1, codeSystem: 'DIN', code: 'DEMO-CA-TERBTOP' },
      US: { available: true, preferred: true, formulary: 'Common topical alternative', price: 12.4, codeSystem: 'RxNorm', code: 'DEMO-US-TERBTOP' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 6.2, codeSystem: 'dm+d', code: 'DEMO-UK-TERBTOP' },
    },
    dose: {
      en: 'Apply to the affected area once or twice daily for 1 to 2 weeks.',
    },
    order: {
      medication: 'Terbinafine 1% cream',
      sig: { en: 'Apply to the affected area once or twice daily for 1 to 2 weeks.' },
      dispense: '1 tube',
      refills: '0',
      duration: '1 to 2 weeks',
      pharmacy: { en: 'Localized dermatophyte alternative in the mock.' },
    },
    symptomBoosts: { itch: 1, annularRash: 2, scaling: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('extensiveRash'), reason: { en: 'Extensive lesions make the purely topical branch less comfortable.' } },
    ],
  },
  {
    id: 'terbinafine-oral',
    condition: 'ringworm',
    labels: { en: 'Terbinafine oral', fr: 'Terbinafine orale' },
    type: { en: 'Oral escalation package', fr: 'Paquet d escalation orale' },
    form: { en: '250 mg tablet', fr: 'Comprime 250 mg' },
    rationale: {
      en: 'The oral branch exists to show a doctor-friendly escalation path when the rash looks extensive or scalp involvement is reported.',
    },
    pros: {
      en: ['Good escalation logic for extensive disease', 'Simple once-daily order', 'Clear explanation for why it surfaces'],
    },
    cons: {
      en: ['Hepatic review matters', 'Systemic therapy is a bigger step', 'Should not surface as casual first choice'],
    },
    evidence: {
      en: ['Escalation dermatophyte branch', 'Liver review gate', 'Severity-based surfacing'],
    },
    basePreference: { CA: 64, US: 70, UK: 68 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Escalation branch only', price: 24.8, codeSystem: 'DIN', code: 'DEMO-CA-TERBORAL' },
      US: { available: true, preferred: false, formulary: 'Escalation branch only', price: 21.7, codeSystem: 'RxNorm', code: 'DEMO-US-TERBORAL' },
      UK: { available: true, preferred: false, formulary: 'Escalation branch only', price: 9.7, codeSystem: 'dm+d', code: 'DEMO-UK-TERBORAL' },
    },
    dose: {
      en: 'Terbinafine 250 mg by mouth once daily for 14 days in this mock package.',
    },
    order: {
      medication: 'Terbinafine 250 mg tablet',
      sig: { en: 'Take 1 tablet by mouth once daily for 14 days.' },
      dispense: '14 tablets',
      refills: '0',
      duration: '14 days',
      pharmacy: { en: 'Escalation package for more extensive dermatophyte disease in the mock.' },
    },
    symptomBoosts: { extensiveRash: 4, scalpScale: 4 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Pregnancy blocks this oral escalation package in the mock.' } },
      { effect: 'caution', when: (ctx) => ctx.hepaticRisk !== 'normal', reason: { en: 'Liver review moves this package into caution mode.' } },
    ],
  },
  {
    id: 'amoxicillin',
    condition: 'otitis-media',
    labels: { en: 'Amoxicillin', fr: 'Amoxicilline' },
    type: { en: 'Typical otitis first pass', fr: 'Premiere passe otite' },
    form: { en: '875 mg tablet', fr: 'Comprime 875 mg' },
    rationale: {
      en: 'A familiar ear-infection starting point that keeps the draft easy to paste for routine ambulatory review.',
    },
    pros: {
      en: ['Clear first-pass wording', 'Straightforward outpatient copy format', 'Low-cost anchor in many markets'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Not designed as the fallback when the case gets more complicated'],
    },
    evidence: {
      en: ['Otitis pathway mirror', 'Allergy exclusion gate', 'Routine outpatient package'],
    },
    basePreference: { CA: 86, US: 88, UK: 80 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Frequent first-pass', price: 8.9, codeSystem: 'DIN', code: 'DEMO-CA-AMOX' },
      US: { available: true, preferred: true, formulary: 'Common anchor package', price: 9.6, codeSystem: 'RxNorm', code: 'DEMO-US-AMOX' },
      UK: { available: true, preferred: true, formulary: 'Common first-pass', price: 3.8, codeSystem: 'dm+d', code: 'DEMO-UK-AMOX' },
    },
    dose: {
      en: 'Amoxicillin 875 mg by mouth twice daily for 5 days.',
    },
    order: {
      medication: 'Amoxicillin 875 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 5 days.' },
      dispense: '10 tablets',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Routine first-pass otitis package in the mock.' },
    },
    symptomBoosts: { earPain: 2, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin / beta-lactam allergy blocks this package.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 18, reason: { en: 'This adult-style package asks for age-band review outside the adult lane.' } },
    ],
  },
  {
    id: 'azithromycin-otitis',
    condition: 'otitis-media',
    labels: { en: 'Azithromycin', fr: 'Azithromycine' },
    type: { en: 'Otitis allergy alternative', fr: 'Alternative allergie otite' },
    form: { en: '250 mg tablet', fr: 'Comprime 250 mg' },
    rationale: {
      en: 'A recognizable alternative when beta-lactam history pushes the review into a different lane.',
    },
    pros: {
      en: ['Keeps a non-beta-lactam branch visible', 'Short schedule', 'Easy copy output'],
    },
    cons: {
      en: ['Macrolide allergy blocks it', 'QT-risk medicine review matters', 'Not a strong universal first choice'],
    },
    evidence: {
      en: ['Alternative otitis branch', 'Allergy avoidance pattern', 'Interaction reminder'],
    },
    basePreference: { CA: 68, US: 72, UK: 66 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative only', price: 16.8, codeSystem: 'DIN', code: 'DEMO-CA-AZIOT' },
      US: { available: true, preferred: false, formulary: 'Alternative branch', price: 13.8, codeSystem: 'RxNorm', code: 'DEMO-US-AZIOT' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 6.7, codeSystem: 'dm+d', code: 'DEMO-UK-AZIOT' },
    },
    dose: {
      en: 'Azithromycin 500 mg on day 1, then 250 mg daily on days 2 to 5.',
    },
    order: {
      medication: 'Azithromycin 250 mg tablet',
      sig: { en: 'Take 2 tablets on day 1, then 1 tablet daily on days 2 to 5.' },
      dispense: '6 tablets',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Alternative otitis branch when beta-lactam use is uncomfortable in the mock.' },
    },
    symptomBoosts: { earPain: 1, discharge: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks this package.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'Current QT-risk medicines move this alternative into review mode.' } },
    ],
  },
  {
    id: 'doxycycline-sti',
    condition: 'chlamydia',
    labels: { en: 'Doxycycline', fr: 'Doxycycline' },
    type: { en: 'Adult STI first-line package', fr: 'Paquet premiere ligne IST adulte' },
    form: { en: '100 mg capsule', fr: 'Capsule 100 mg' },
    rationale: {
      en: 'This is the strong first-line adult branch the doctor is likely to want available in a saved template for repeat outpatient STI work.',
    },
    pros: {
      en: ['Good fast-apply candidate', 'Clean twice-daily copy format', 'Strong default branch for adult outpatient workflow'],
    },
    cons: {
      en: ['Pregnancy or tetracycline allergy blocks it', 'Needs adherence over a week'],
    },
    evidence: {
      en: ['STI first-line branch', 'Pregnancy gate', 'Allergy exclusion gate'],
    },
    basePreference: { CA: 86, US: 90, UK: 82 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Strong first-pass choice', price: 11.2, codeSystem: 'DIN', code: 'DEMO-CA-DOXYSTI' },
      US: { available: true, preferred: true, formulary: 'Strong first-line adult branch', price: 8.6, codeSystem: 'RxNorm', code: 'DEMO-US-DOXYSTI' },
      UK: { available: true, preferred: true, formulary: 'Visible first-pass branch', price: 4.4, codeSystem: 'dm+d', code: 'DEMO-UK-DOXYSTI' },
    },
    dose: {
      en: 'Doxycycline 100 mg by mouth twice daily for 7 days.',
    },
    order: {
      medication: 'Doxycycline 100 mg capsule',
      sig: { en: 'Take 1 capsule by mouth twice daily for 7 days.' },
      dispense: '14 capsules',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'Adult STI package in the mock fast-apply flow.' },
    },
    symptomBoosts: { partnerPositive: 2, discharge: 2, dysuria: 1, testPending: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes' || ctx.allergies.includes('tetracycline'), reason: { en: 'Pregnancy or tetracycline allergy blocks this first-line package.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('pelvicPain'), reason: { en: 'Pelvic pain should push the doctor to confirm the broader pathway before treating this as simple outpatient fast apply.' } },
    ],
  },
  {
    id: 'azithromycin-sti',
    condition: 'chlamydia',
    labels: { en: 'Azithromycin', fr: 'Azithromycine' },
    type: { en: 'Single-dose STI alternative', fr: 'Alternative IST dose unique' },
    form: { en: '500 mg tablet', fr: 'Comprime 500 mg' },
    rationale: {
      en: 'A recognizable single-dose alternative that makes the fast-apply library more practical for real outpatient habits.',
    },
    pros: {
      en: ['Single-dose formatting', 'Easy copy/paste for fallback workflow', 'Keeps another branch visible'],
    },
    cons: {
      en: ['Macrolide allergy blocks it', 'QT-risk medicine review matters', 'Not the strongest default branch'],
    },
    evidence: {
      en: ['STI alternative branch', 'Interaction reminder', 'Convenience package'],
    },
    basePreference: { CA: 74, US: 76, UK: 72 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative only', price: 14.2, codeSystem: 'DIN', code: 'DEMO-CA-AZISTI' },
      US: { available: true, preferred: false, formulary: 'Alternative branch', price: 12.9, codeSystem: 'RxNorm', code: 'DEMO-US-AZISTI' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 5.9, codeSystem: 'dm+d', code: 'DEMO-UK-AZISTI' },
    },
    dose: {
      en: 'Azithromycin 1 g by mouth once.',
    },
    order: {
      medication: 'Azithromycin 500 mg tablet',
      sig: { en: 'Take 2 tablets by mouth once.' },
      dispense: '2 tablets',
      refills: '0',
      duration: 'Single dose',
      pharmacy: { en: 'Single-dose STI alternative branch in the mock.' },
    },
    symptomBoosts: { partnerPositive: 1, discharge: 1, testPending: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks this single-dose branch.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'QT-risk medicines make this alternative review-heavy.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     PHARYNGITIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'penicillin-v',
    condition: 'pharyngitis',
    labels: { en: 'Penicillin V' },
    type: { en: 'First-line strep throat package' },
    form: { en: '500 mg tablet' },
    rationale: {
      en: 'The classic narrow-spectrum first choice for confirmed Group A strep pharyngitis, keeping resistance pressure low and cost minimal.',
    },
    pros: {
      en: ['Narrow spectrum preserves microbiome', 'Very low cost', 'Well-established 10-day cure rates'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Four-times-daily dosing can reduce adherence', 'Full 10-day course required'],
    },
    evidence: {
      en: ['Strep pharyngitis first-line pathway', 'Allergy exclusion gate', 'Guideline-concordant narrow-spectrum choice'],
    },
    basePreference: { CA: 92, US: 85, UK: 90 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'First-line strep choice', price: 8.5, codeSystem: 'DIN', code: 'DEMO-CA-PENV' },
      US: { available: true, preferred: true, formulary: 'Common first-line', price: 10.2, codeSystem: 'RxNorm', code: 'DEMO-US-PENV' },
      UK: { available: true, preferred: true, formulary: 'Preferred narrow-spectrum', price: 3.8, codeSystem: 'dm+d', code: 'DEMO-UK-PENV' },
    },
    dose: {
      en: 'Penicillin V 500 mg by mouth two to three times daily for 10 days.',
    },
    order: {
      medication: 'Penicillin V 500 mg tablet',
      sig: { en: 'Take 1 tablet by mouth two to three times daily for 10 days.' },
      dispense: '30 tablets',
      refills: '0',
      duration: '10 days',
      pharmacy: { en: 'First-line strep pharyngitis package in the mock.' },
    },
    symptomBoosts: { soreThroat: 2, tonsilExudate: 3, rapidStrepPos: 4, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin allergy blocks this first-line package.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 3, reason: { en: 'Strep pharyngitis is uncommon under age 3; confirm diagnosis before treating.' } },
    ],
  },
  {
    id: 'amoxicillin-pharyngitis',
    condition: 'pharyngitis',
    labels: { en: 'Amoxicillin' },
    type: { en: 'Alternative first-line strep package' },
    form: { en: '500 mg capsule' },
    rationale: {
      en: 'An equally effective first-line option often preferred for children due to better taste and once- or twice-daily dosing flexibility.',
    },
    pros: {
      en: ['Better palatability for pediatric use', 'Twice-daily dosing improves adherence', 'Equivalent efficacy to penicillin V'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Broader spectrum than penicillin V', 'Maculopapular rash risk if mononucleosis is misdiagnosed'],
    },
    evidence: {
      en: ['Strep pharyngitis alternative first-line', 'Allergy exclusion gate', 'Pediatric palatability advantage'],
    },
    basePreference: { CA: 85, US: 88, UK: 85 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common first-line alternative', price: 9.4, codeSystem: 'DIN', code: 'DEMO-CA-AMOXPHAR' },
      US: { available: true, preferred: true, formulary: 'Frequent pediatric/adult choice', price: 11.0, codeSystem: 'RxNorm', code: 'DEMO-US-AMOXPHAR' },
      UK: { available: true, preferred: true, formulary: 'Common first-line', price: 4.2, codeSystem: 'dm+d', code: 'DEMO-UK-AMOXPHAR' },
    },
    dose: {
      en: 'Amoxicillin 500 mg by mouth twice daily for 10 days.',
    },
    order: {
      medication: 'Amoxicillin 500 mg capsule',
      sig: { en: 'Take 1 capsule by mouth twice daily for 10 days.' },
      dispense: '20 capsules',
      refills: '0',
      duration: '10 days',
      pharmacy: { en: 'Alternative first-line strep pharyngitis package in the mock.' },
    },
    symptomBoosts: { soreThroat: 2, tonsilExudate: 2, rapidStrepPos: 3, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin allergy blocks this package.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 3, reason: { en: 'Strep is rare under age 3; verify diagnosis before prescribing.' } },
    ],
  },
  {
    id: 'azithromycin-pharyngitis',
    condition: 'pharyngitis',
    labels: { en: 'Azithromycin' },
    type: { en: 'Penicillin-allergic strep alternative' },
    form: { en: '250 mg tablet' },
    rationale: {
      en: 'A shorter-course macrolide alternative for patients with confirmed penicillin allergy who cannot use beta-lactam options.',
    },
    pros: {
      en: ['Avoids beta-lactam class entirely', 'Short 5-day course aids adherence', 'Well-tolerated orally'],
    },
    cons: {
      en: ['Macrolide resistance is increasing', 'QT-risk interaction review needed', 'Not first-line when penicillin is tolerated'],
    },
    evidence: {
      en: ['Strep pharyngitis allergy alternative', 'QT interaction overlay', 'Macrolide resistance awareness'],
    },
    basePreference: { CA: 70, US: 75, UK: 68 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Allergy alternative only', price: 14.8, codeSystem: 'DIN', code: 'DEMO-CA-AZIPHAR' },
      US: { available: true, preferred: false, formulary: 'Penicillin-allergic branch', price: 12.5, codeSystem: 'RxNorm', code: 'DEMO-US-AZIPHAR' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 5.6, codeSystem: 'dm+d', code: 'DEMO-UK-AZIPHAR' },
    },
    dose: {
      en: 'Azithromycin 500 mg on day 1, then 250 mg daily on days 2 to 5.',
    },
    order: {
      medication: 'Azithromycin 250 mg tablet',
      sig: { en: 'Take 2 tablets on day 1, then 1 tablet daily on days 2 to 5.' },
      dispense: '6 tablets',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Penicillin-allergic strep throat alternative in the mock.' },
    },
    symptomBoosts: { soreThroat: 1, tonsilExudate: 1, rapidStrepPos: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks this alternative package.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'QT-prolonging medicines require careful review with this macrolide.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     SINUSITIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'amoxicillin-sinus',
    condition: 'sinusitis',
    labels: { en: 'Amoxicillin' },
    type: { en: 'First-line sinus infection package' },
    form: { en: '500 mg capsule' },
    rationale: {
      en: 'Standard first-line therapy for acute bacterial sinusitis when symptoms have persisted beyond the typical viral window.',
    },
    pros: {
      en: ['Guideline-concordant first-line choice', 'Low cost and widely available', 'Well-tolerated with good oral absorption'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Less effective against beta-lactamase producers', 'May need escalation to amoxicillin-clavulanate'],
    },
    evidence: {
      en: ['Acute sinusitis first-line pathway', 'Allergy exclusion gate', 'Duration-based prescribing criteria'],
    },
    basePreference: { CA: 88, US: 90, UK: 87 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'First-line sinus choice', price: 9.8, codeSystem: 'DIN', code: 'DEMO-CA-AMOXSIN' },
      US: { available: true, preferred: true, formulary: 'Guideline first-line', price: 10.4, codeSystem: 'RxNorm', code: 'DEMO-US-AMOXSIN' },
      UK: { available: true, preferred: true, formulary: 'Preferred first-line', price: 4.1, codeSystem: 'dm+d', code: 'DEMO-UK-AMOXSIN' },
    },
    dose: {
      en: 'Amoxicillin 500 mg by mouth three times daily for 7 to 10 days.',
    },
    order: {
      medication: 'Amoxicillin 500 mg capsule',
      sig: { en: 'Take 1 capsule by mouth three times daily for 7 to 10 days.' },
      dispense: '30 capsules',
      refills: '0',
      duration: '7 to 10 days',
      pharmacy: { en: 'First-line acute bacterial sinusitis package in the mock.' },
    },
    symptomBoosts: { facialPain: 2, nasalDischarge: 3, prolongedSymptoms: 3, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin allergy blocks this first-line sinus package.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('doubleWorsening'), reason: { en: 'Double worsening pattern may warrant escalation to amoxicillin-clavulanate.' } },
    ],
  },
  {
    id: 'amoxicillin-clav-sinus',
    condition: 'sinusitis',
    labels: { en: 'Amoxicillin-clavulanate' },
    type: { en: 'Second-line sinus escalation' },
    form: { en: '875/125 mg tablet' },
    rationale: {
      en: 'A broader-spectrum option for sinusitis when first-line amoxicillin is unlikely to cover resistant organisms or initial therapy has failed.',
    },
    pros: {
      en: ['Better coverage of beta-lactamase producers', 'Good escalation from plain amoxicillin', 'Twice-daily dosing aids adherence'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Higher GI side effect burden', 'More expensive than plain amoxicillin'],
    },
    evidence: {
      en: ['Sinusitis second-line pathway', 'Beta-lactamase coverage advantage', 'Allergy exclusion gate'],
    },
    basePreference: { CA: 80, US: 82, UK: 78 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Second-line escalation', price: 16.5, codeSystem: 'DIN', code: 'DEMO-CA-AUGSIN' },
      US: { available: true, preferred: true, formulary: 'Common escalation choice', price: 18.9, codeSystem: 'RxNorm', code: 'DEMO-US-AUGSIN' },
      UK: { available: true, preferred: false, formulary: 'Escalation branch', price: 7.2, codeSystem: 'dm+d', code: 'DEMO-UK-AUGSIN' },
    },
    dose: {
      en: 'Amoxicillin-clavulanate 875/125 mg by mouth twice daily for 7 to 10 days.',
    },
    order: {
      medication: 'Amoxicillin-clavulanate 875/125 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 7 to 10 days.' },
      dispense: '20 tablets',
      refills: '0',
      duration: '7 to 10 days',
      pharmacy: { en: 'Second-line sinusitis escalation package in the mock.' },
    },
    symptomBoosts: { facialPain: 2, nasalDischarge: 2, doubleWorsening: 3, fever: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin allergy blocks this escalation package.' } },
      { effect: 'caution', when: (ctx) => ctx.hepaticRisk !== 'normal', reason: { en: 'Clavulanate has rare hepatotoxicity; review liver status.' } },
    ],
  },
  {
    id: 'doxycycline-sinus',
    condition: 'sinusitis',
    labels: { en: 'Doxycycline' },
    type: { en: 'Penicillin-allergic sinus alternative' },
    form: { en: '100 mg capsule' },
    rationale: {
      en: 'A non-beta-lactam alternative for acute bacterial sinusitis when penicillin allergy prevents use of first-line amoxicillin.',
    },
    pros: {
      en: ['Avoids beta-lactam class entirely', 'Twice-daily dosing is convenient', 'Good sinus tissue penetration'],
    },
    cons: {
      en: ['Pregnancy blocks it', 'Photosensitivity counseling needed', 'Not appropriate for young children'],
    },
    evidence: {
      en: ['Sinusitis allergy alternative', 'Pregnancy gate', 'Age restriction gate'],
    },
    basePreference: { CA: 72, US: 75, UK: 70 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Allergy alternative', price: 11.2, codeSystem: 'DIN', code: 'DEMO-CA-DOXYSIN' },
      US: { available: true, preferred: false, formulary: 'Penicillin-allergic branch', price: 9.8, codeSystem: 'RxNorm', code: 'DEMO-US-DOXYSIN' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 5.1, codeSystem: 'dm+d', code: 'DEMO-UK-DOXYSIN' },
    },
    dose: {
      en: 'Doxycycline 100 mg by mouth twice daily for 7 to 10 days.',
    },
    order: {
      medication: 'Doxycycline 100 mg capsule',
      sig: { en: 'Take 1 capsule by mouth twice daily for 7 to 10 days.' },
      dispense: '20 capsules',
      refills: '0',
      duration: '7 to 10 days',
      pharmacy: { en: 'Penicillin-allergic sinusitis alternative in the mock.' },
    },
    symptomBoosts: { facialPain: 1, nasalDischarge: 2, prolongedSymptoms: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes' || ctx.allergies.includes('tetracycline'), reason: { en: 'Pregnancy or tetracycline allergy blocks this alternative.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 8, reason: { en: 'Doxycycline is generally avoided in children under 8 due to tooth discoloration risk.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     IMPETIGO medications
     ─────────────────────────────────────────────── */
  {
    id: 'mupirocin-topical',
    condition: 'impetigo',
    labels: { en: 'Mupirocin topical' },
    type: { en: 'Topical first-line impetigo package' },
    form: { en: '2% ointment' },
    rationale: {
      en: 'The preferred topical-first approach for localized non-bullous impetigo, avoiding systemic antibiotic exposure when lesions are limited.',
    },
    pros: {
      en: ['Topical-first reduces systemic exposure', 'Effective for localized disease', 'Simple application instructions'],
    },
    cons: {
      en: ['Not sufficient for widespread or bullous impetigo', 'Resistance can develop with overuse'],
    },
    evidence: {
      en: ['Impetigo topical-first pathway', 'Localized disease branch', 'Escalation reminder for widespread disease'],
    },
    basePreference: { CA: 88, US: 85, UK: 90 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Topical first-line', price: 12.4, codeSystem: 'DIN', code: 'DEMO-CA-MUPIR' },
      US: { available: true, preferred: true, formulary: 'Common topical first-line', price: 15.8, codeSystem: 'RxNorm', code: 'DEMO-US-MUPIR' },
      UK: { available: true, preferred: true, formulary: 'Preferred topical first-line', price: 5.2, codeSystem: 'dm+d', code: 'DEMO-UK-MUPIR' },
    },
    dose: {
      en: 'Apply mupirocin 2% ointment to affected areas three times daily for 5 days.',
    },
    order: {
      medication: 'Mupirocin 2% ointment',
      sig: { en: 'Apply a thin layer to the affected area three times daily for 5 days.' },
      dispense: '1 tube (15 g)',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Topical impetigo first-line package in the mock.' },
    },
    symptomBoosts: { honeyCrust: 3, perioral: 2, spreading: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('bullae'), reason: { en: 'Bullous impetigo usually requires oral therapy rather than topical-only treatment.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('spreading'), reason: { en: 'Spreading lesions may need escalation to oral antibiotics.' } },
    ],
  },
  {
    id: 'cephalexin-impetigo',
    condition: 'impetigo',
    labels: { en: 'Cephalexin' },
    type: { en: 'Oral impetigo escalation package' },
    form: { en: '250 mg capsule' },
    rationale: {
      en: 'An oral first-generation cephalosporin for widespread impetigo or cases where topical therapy is impractical or has failed.',
    },
    pros: {
      en: ['Good coverage for strep and staph', 'Well-tolerated oral option', 'Effective for widespread disease'],
    },
    cons: {
      en: ['Cross-reactivity concern with penicillin allergy', 'Four-times-daily dosing reduces adherence', 'Systemic exposure when topical might suffice'],
    },
    evidence: {
      en: ['Impetigo oral escalation pathway', 'Penicillin cross-reactivity review', 'Widespread disease branch'],
    },
    basePreference: { CA: 78, US: 80, UK: 75 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Oral escalation option', price: 11.2, codeSystem: 'DIN', code: 'DEMO-CA-CEPHIMP' },
      US: { available: true, preferred: true, formulary: 'Common oral escalation', price: 10.5, codeSystem: 'RxNorm', code: 'DEMO-US-CEPHIMP' },
      UK: { available: true, preferred: false, formulary: 'Escalation branch', price: 5.8, codeSystem: 'dm+d', code: 'DEMO-UK-CEPHIMP' },
    },
    dose: {
      en: 'Cephalexin 250 mg by mouth four times daily for 7 days. Use 500 mg QID for adults or extensive disease.',
    },
    order: {
      medication: 'Cephalexin 250 mg capsule',
      sig: { en: 'Take 1 capsule by mouth four times daily for 7 days.' },
      dispense: '28 capsules',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'Oral impetigo escalation package in the mock.' },
    },
    symptomBoosts: { bullae: 3, spreading: 3, honeyCrust: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Possible cross-reactivity with penicillin allergy; review history before using cephalosporin.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 2, reason: { en: 'Very young patients need weight-based dosing review.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     CONJUNCTIVITIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'erythromycin-eye',
    condition: 'conjunctivitis',
    labels: { en: 'Erythromycin ophthalmic' },
    type: { en: 'Topical eye antibiotic first-line' },
    form: { en: '0.5% ophthalmic ointment' },
    rationale: {
      en: 'A well-established first-line topical option for bacterial conjunctivitis with broad gram-positive coverage and good safety profile.',
    },
    pros: {
      en: ['Excellent safety profile including neonates', 'Good gram-positive coverage', 'Low systemic absorption'],
    },
    cons: {
      en: ['Ointment can blur vision temporarily', 'Macrolide allergy blocks it', 'Less convenient than drops for some patients'],
    },
    evidence: {
      en: ['Bacterial conjunctivitis first-line pathway', 'Allergy exclusion gate', 'Neonatal safety data'],
    },
    basePreference: { CA: 85, US: 82, UK: 80 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Common first-line eye antibiotic', price: 10.6, codeSystem: 'DIN', code: 'DEMO-CA-ERYEYE' },
      US: { available: true, preferred: true, formulary: 'Frequent first-line choice', price: 14.2, codeSystem: 'RxNorm', code: 'DEMO-US-ERYEYE' },
      UK: { available: true, preferred: true, formulary: 'Common first-pass', price: 4.8, codeSystem: 'dm+d', code: 'DEMO-UK-ERYEYE' },
    },
    dose: {
      en: 'Apply erythromycin 0.5% ophthalmic ointment to the affected eye(s) four times daily for 5 to 7 days.',
    },
    order: {
      medication: 'Erythromycin 0.5% ophthalmic ointment',
      sig: { en: 'Apply a thin ribbon to the affected eye(s) four times daily for 5 to 7 days.' },
      dispense: '1 tube (3.5 g)',
      refills: '0',
      duration: '5 to 7 days',
      pharmacy: { en: 'Bacterial conjunctivitis first-line package in the mock.' },
    },
    symptomBoosts: { purulentDischarge: 3, eyeRedness: 2, crusting: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks this ophthalmic erythromycin package.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('contactLens'), reason: { en: 'Contact lens wearers need pseudomonas coverage consideration; review before using this first-line option.' } },
    ],
  },
  {
    id: 'trimethoprim-polymyxin-eye',
    condition: 'conjunctivitis',
    labels: { en: 'Trimethoprim-polymyxin B ophthalmic' },
    type: { en: 'Ophthalmic drops alternative' },
    form: { en: 'Ophthalmic solution' },
    rationale: {
      en: 'A convenient drop formulation alternative for bacterial conjunctivitis with broad-spectrum coverage including some gram-negatives.',
    },
    pros: {
      en: ['Drop format preferred by many patients over ointment', 'Broad gram-positive and gram-negative coverage', 'No macrolide cross-reactivity'],
    },
    cons: {
      en: ['Sulfonamide-related trimethoprim may concern some clinicians', 'Multiple daily dosing required', 'Less data in neonates'],
    },
    evidence: {
      en: ['Conjunctivitis alternative pathway', 'Broad-spectrum topical coverage', 'Patient preference for drops'],
    },
    basePreference: { CA: 80, US: 85, UK: 78 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative first-line', price: 12.8, codeSystem: 'DIN', code: 'DEMO-CA-TMPOLY' },
      US: { available: true, preferred: true, formulary: 'Common drop alternative', price: 16.4, codeSystem: 'RxNorm', code: 'DEMO-US-TMPOLY' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 6.2, codeSystem: 'dm+d', code: 'DEMO-UK-TMPOLY' },
    },
    dose: {
      en: 'Instill 1 drop into the affected eye(s) every 3 hours while awake for 7 days.',
    },
    order: {
      medication: 'Trimethoprim-polymyxin B ophthalmic solution',
      sig: { en: 'Instill 1 drop into the affected eye(s) every 3 hours while awake for 7 days.' },
      dispense: '1 bottle (10 mL)',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'Alternative conjunctivitis drops package in the mock.' },
    },
    symptomBoosts: { purulentDischarge: 2, eyeRedness: 2, crusting: 1, contactLens: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.allergies.includes('sulfonamide'), reason: { en: 'Trimethoprim is structurally related to sulfonamides; review allergy history carefully.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 2, reason: { en: 'Limited neonatal/infant data; review age-appropriate alternatives.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     UTI-MALE medications
     ─────────────────────────────────────────────── */
  {
    id: 'tmp-smx-male',
    condition: 'uti-male',
    labels: { en: 'TMP-SMX DS' },
    type: { en: 'Male UTI first-line extended course' },
    form: { en: 'Double-strength tablet (160/800 mg)' },
    rationale: {
      en: 'A standard first-line choice for male UTI with extended 7-to-14-day duration to account for potential prostate involvement and complicated anatomy.',
    },
    pros: {
      en: ['Good tissue penetration including prostate', 'Well-established male UTI evidence', 'Low cost'],
    },
    cons: {
      en: ['Sulfonamide allergy blocks it', 'Renal function threshold required', 'Interaction review with warfarin and other medicines'],
    },
    evidence: {
      en: ['Male UTI extended-course pathway', 'Allergy exclusion gate', 'Renal threshold gate'],
    },
    basePreference: { CA: 85, US: 82, UK: 80 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'First-line male UTI', price: 10.2, codeSystem: 'DIN', code: 'DEMO-CA-TMPMAL' },
      US: { available: true, preferred: true, formulary: 'Common first-line', price: 9.4, codeSystem: 'RxNorm', code: 'DEMO-US-TMPMAL' },
      UK: { available: true, preferred: false, formulary: 'Visible first-line', price: 4.5, codeSystem: 'dm+d', code: 'DEMO-UK-TMPMAL' },
    },
    dose: {
      en: 'TMP-SMX DS 160/800 mg by mouth twice daily for 7 to 14 days.',
    },
    order: {
      medication: 'Trimethoprim-sulfamethoxazole DS 160/800 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 7 to 14 days.' },
      dispense: '28 tablets',
      refills: '0',
      duration: '7 to 14 days',
      pharmacy: { en: 'Extended-course male UTI package in the mock.' },
    },
    symptomBoosts: { dysuria: 3, frequency: 2, fever: 1, prostateSymptoms: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('sulfonamide'), reason: { en: 'Sulfonamide allergy blocks this first-line male UTI package.' } },
      { effect: 'blocked', when: (ctx) => ctx.egfr < 30, reason: { en: 'Severe renal impairment blocks TMP-SMX use.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('warfarin'), reason: { en: 'TMP-SMX potentiates warfarin; INR monitoring required.' } },
    ],
  },
  {
    id: 'ciprofloxacin-uti',
    condition: 'uti-male',
    labels: { en: 'Ciprofloxacin' },
    type: { en: 'Fluoroquinolone male UTI alternative' },
    form: { en: '500 mg tablet' },
    rationale: {
      en: 'A fluoroquinolone alternative for male UTI when first-line TMP-SMX is contraindicated, offering excellent urinary and prostate tissue penetration.',
    },
    pros: {
      en: ['Excellent prostate penetration', 'Broad gram-negative coverage', 'Twice-daily oral dosing'],
    },
    cons: {
      en: ['FDA black box warnings for tendon/nerve effects', 'QT-risk interaction potential', 'Reserve for when first-line is not suitable'],
    },
    evidence: {
      en: ['Male UTI alternative pathway', 'Fluoroquinolone stewardship awareness', 'QT interaction overlay'],
    },
    basePreference: { CA: 75, US: 78, UK: 70 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative branch', price: 14.6, codeSystem: 'DIN', code: 'DEMO-CA-CIPUTI' },
      US: { available: true, preferred: false, formulary: 'Reserve alternative', price: 12.8, codeSystem: 'RxNorm', code: 'DEMO-US-CIPUTI' },
      UK: { available: true, preferred: false, formulary: 'Second-line alternative', price: 6.4, codeSystem: 'dm+d', code: 'DEMO-UK-CIPUTI' },
    },
    dose: {
      en: 'Ciprofloxacin 500 mg by mouth twice daily for 7 days.',
    },
    order: {
      medication: 'Ciprofloxacin 500 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 7 days.' },
      dispense: '14 tablets',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'Male UTI fluoroquinolone alternative in the mock.' },
    },
    symptomBoosts: { dysuria: 2, frequency: 1, prostateSymptoms: 3, flankPain: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'QT-prolonging medicines require careful review with fluoroquinolones.' } },
      { effect: 'caution', when: (ctx) => ctx.age > 65, reason: { en: 'Older adults have increased risk of fluoroquinolone-related tendon and CNS effects.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     GONORRHEA medications
     ─────────────────────────────────────────────── */
  {
    id: 'ceftriaxone-gon',
    condition: 'gonorrhea',
    labels: { en: 'Ceftriaxone + Doxycycline' },
    type: { en: 'Dual therapy first-line gonorrhea package' },
    form: { en: '500 mg IM injection + 100 mg capsule' },
    rationale: {
      en: 'Current guideline-recommended dual therapy for uncomplicated gonorrhea: single-dose IM ceftriaxone plus oral doxycycline to cover possible chlamydia co-infection.',
    },
    pros: {
      en: ['Guideline-concordant dual coverage', 'Single IM dose ensures adherence for gonorrhea component', 'Covers chlamydia co-infection'],
    },
    cons: {
      en: ['Requires IM injection in clinic', 'Low cross-reactivity risk with penicillin allergy', 'Doxycycline component blocked in pregnancy'],
    },
    evidence: {
      en: ['Gonorrhea first-line dual therapy', 'CDC/STI guidelines concordance', 'Co-infection coverage rationale'],
    },
    basePreference: { CA: 90, US: 92, UK: 88 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Guideline first-line dual therapy', price: 22.5, codeSystem: 'DIN', code: 'DEMO-CA-CEFTGON' },
      US: { available: true, preferred: true, formulary: 'CDC-recommended first-line', price: 28.4, codeSystem: 'RxNorm', code: 'DEMO-US-CEFTGON' },
      UK: { available: true, preferred: true, formulary: 'BASHH guideline first-line', price: 12.6, codeSystem: 'dm+d', code: 'DEMO-UK-CEFTGON' },
    },
    dose: {
      en: 'Ceftriaxone 500 mg IM once, plus doxycycline 100 mg by mouth twice daily for 7 days.',
    },
    order: {
      medication: 'Ceftriaxone 500 mg IM + Doxycycline 100 mg capsule',
      sig: { en: 'Ceftriaxone 500 mg IM once in clinic. Doxycycline: take 1 capsule by mouth twice daily for 7 days.' },
      dispense: '1 vial ceftriaxone + 14 capsules doxycycline',
      refills: '0',
      duration: '7 days (doxycycline) / single dose (ceftriaxone)',
      pharmacy: { en: 'Dual therapy gonorrhea package in the mock.' },
    },
    symptomBoosts: { discharge: 3, dysuria: 2, partnerPositive: 3, pharyngealExposure: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Low cross-reactivity risk with cephalosporins; review penicillin allergy severity.' } },
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Doxycycline component is contraindicated in pregnancy; use azithromycin alternative.' } },
    ],
  },
  {
    id: 'gentamicin-azithro-gon',
    condition: 'gonorrhea',
    labels: { en: 'Gentamicin + Azithromycin' },
    type: { en: 'Cephalosporin-allergic gonorrhea alternative' },
    form: { en: '240 mg IM injection + 2 g oral' },
    rationale: {
      en: 'An alternative dual therapy for patients with true cephalosporin allergy, using gentamicin IM plus high-dose azithromycin.',
    },
    pros: {
      en: ['Avoids cephalosporin class entirely', 'Single-dose both components', 'Useful for severe allergy history'],
    },
    cons: {
      en: ['Higher GI side effect burden from 2g azithromycin', 'Less robust evidence than ceftriaxone-based therapy', 'QT-risk review needed for azithromycin'],
    },
    evidence: {
      en: ['Gonorrhea cephalosporin-allergic pathway', 'Alternative dual therapy evidence', 'QT interaction overlay'],
    },
    basePreference: { CA: 65, US: 60, UK: 70 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative for cephalosporin allergy', price: 24.8, codeSystem: 'DIN', code: 'DEMO-CA-GENAZI' },
      US: { available: true, preferred: false, formulary: 'Reserve alternative', price: 32.6, codeSystem: 'RxNorm', code: 'DEMO-US-GENAZI' },
      UK: { available: true, preferred: false, formulary: 'BASHH alternative branch', price: 14.2, codeSystem: 'dm+d', code: 'DEMO-UK-GENAZI' },
    },
    dose: {
      en: 'Gentamicin 240 mg IM once, plus azithromycin 2 g by mouth once.',
    },
    order: {
      medication: 'Gentamicin 240 mg IM + Azithromycin 500 mg tablets',
      sig: { en: 'Gentamicin 240 mg IM once in clinic. Azithromycin: take 4 tablets (2 g total) by mouth once.' },
      dispense: '1 vial gentamicin + 4 tablets azithromycin',
      refills: '0',
      duration: 'Single dose',
      pharmacy: { en: 'Alternative gonorrhea package for cephalosporin allergy in the mock.' },
    },
    symptomBoosts: { discharge: 2, partnerPositive: 2, pharyngealExposure: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks the azithromycin component of this dual therapy.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'High-dose azithromycin with QT-prolonging medicines requires careful review.' } },
      { effect: 'caution', when: (ctx) => ctx.egfr < 45, reason: { en: 'Gentamicin requires renal function review; reduced eGFR increases nephrotoxicity risk.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     TRICHOMONIASIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'metronidazole-trich',
    condition: 'trichomoniasis',
    labels: { en: 'Metronidazole' },
    type: { en: 'First-line trichomoniasis package' },
    form: { en: '500 mg tablet' },
    rationale: {
      en: 'The established first-line treatment for trichomoniasis with excellent cure rates, now recommended as a 7-day course for improved efficacy.',
    },
    pros: {
      en: ['Strong first-line evidence', 'Low cost and widely available', 'Oral dosing is convenient'],
    },
    cons: {
      en: ['Alcohol interaction requires strict counseling', 'GI side effects common', 'First-trimester pregnancy concern'],
    },
    evidence: {
      en: ['Trichomoniasis first-line pathway', 'Alcohol interaction counseling', 'Pregnancy trimester gate'],
    },
    basePreference: { CA: 90, US: 88, UK: 90 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'First-line trichomoniasis', price: 8.6, codeSystem: 'DIN', code: 'DEMO-CA-METRICH' },
      US: { available: true, preferred: true, formulary: 'CDC first-line', price: 10.2, codeSystem: 'RxNorm', code: 'DEMO-US-METRICH' },
      UK: { available: true, preferred: true, formulary: 'Standard first-line', price: 3.9, codeSystem: 'dm+d', code: 'DEMO-UK-METRICH' },
    },
    dose: {
      en: 'Metronidazole 500 mg by mouth twice daily for 7 days.',
    },
    order: {
      medication: 'Metronidazole 500 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 7 days.' },
      dispense: '14 tablets',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'First-line trichomoniasis package in the mock.' },
    },
    symptomBoosts: { vaginalDischarge: 3, odor: 2, partnerPositive: 2, dysuria: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('warfarin'), reason: { en: 'Metronidazole potentiates warfarin; INR monitoring required during treatment.' } },
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'First-trimester pregnancy concern; weigh risks before prescribing metronidazole.' } },
    ],
  },
  {
    id: 'tinidazole-trich',
    condition: 'trichomoniasis',
    labels: { en: 'Tinidazole' },
    type: { en: 'Single-dose trichomoniasis alternative' },
    form: { en: '500 mg tablet' },
    rationale: {
      en: 'A single-dose nitroimidazole alternative with potentially better tolerability than metronidazole, useful when adherence is a concern.',
    },
    pros: {
      en: ['Single-dose convenience improves adherence', 'Potentially fewer GI side effects than metronidazole', 'Good cure rates'],
    },
    cons: {
      en: ['Higher cost than metronidazole', 'Same alcohol interaction concern', 'Not available everywhere'],
    },
    evidence: {
      en: ['Trichomoniasis alternative pathway', 'Single-dose adherence advantage', 'Alcohol interaction counseling'],
    },
    basePreference: { CA: 75, US: 78, UK: 72 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative option', price: 18.4, codeSystem: 'DIN', code: 'DEMO-CA-TINID' },
      US: { available: true, preferred: false, formulary: 'Alternative branch', price: 22.6, codeSystem: 'RxNorm', code: 'DEMO-US-TINID' },
      UK: { available: true, preferred: false, formulary: 'Reserve alternative', price: 9.8, codeSystem: 'dm+d', code: 'DEMO-UK-TINID' },
    },
    dose: {
      en: 'Tinidazole 2 g by mouth once.',
    },
    order: {
      medication: 'Tinidazole 500 mg tablet',
      sig: { en: 'Take 4 tablets (2 g total) by mouth once.' },
      dispense: '4 tablets',
      refills: '0',
      duration: 'Single dose',
      pharmacy: { en: 'Single-dose trichomoniasis alternative in the mock.' },
    },
    symptomBoosts: { vaginalDischarge: 2, partnerPositive: 2, odor: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('warfarin'), reason: { en: 'Tinidazole shares the same warfarin potentiation risk as metronidazole.' } },
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Tinidazole is contraindicated in the first trimester of pregnancy.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     BACTERIAL VAGINOSIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'metronidazole-oral',
    condition: 'bv',
    labels: { en: 'Metronidazole oral' },
    type: { en: 'First-line BV oral package' },
    form: { en: '500 mg tablet' },
    rationale: {
      en: 'The standard first-line oral treatment for bacterial vaginosis with strong evidence and low cost.',
    },
    pros: {
      en: ['Strong first-line evidence', 'Low cost and widely available', 'Systemic coverage for recurrent cases'],
    },
    cons: {
      en: ['Strict alcohol avoidance counseling required', 'GI side effects common', 'Warfarin interaction needs review'],
    },
    evidence: {
      en: ['BV first-line oral pathway', 'Alcohol interaction counseling', 'Drug interaction overlay'],
    },
    basePreference: { CA: 90, US: 88, UK: 90 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'First-line BV choice', price: 8.2, codeSystem: 'DIN', code: 'DEMO-CA-METBV' },
      US: { available: true, preferred: true, formulary: 'CDC first-line', price: 9.8, codeSystem: 'RxNorm', code: 'DEMO-US-METBV' },
      UK: { available: true, preferred: true, formulary: 'Standard first-line', price: 3.6, codeSystem: 'dm+d', code: 'DEMO-UK-METBV' },
    },
    dose: {
      en: 'Metronidazole 500 mg by mouth twice daily for 7 days.',
    },
    order: {
      medication: 'Metronidazole 500 mg tablet',
      sig: { en: 'Take 1 tablet by mouth twice daily for 7 days.' },
      dispense: '14 tablets',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'First-line oral BV package in the mock.' },
    },
    symptomBoosts: { vaginalDischarge: 3, fishy: 3, cluePositive: 2, recurrent: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('warfarin'), reason: { en: 'Metronidazole potentiates warfarin; INR monitoring required.' } },
      { effect: 'caution', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Pregnancy review needed; metronidazole is generally considered safe after first trimester but requires clinician judgement.' } },
    ],
  },
  {
    id: 'metronidazole-vaginal',
    condition: 'bv',
    labels: { en: 'Metronidazole vaginal gel' },
    type: { en: 'Topical BV alternative' },
    form: { en: '0.75% vaginal gel' },
    rationale: {
      en: 'A topical alternative for BV that reduces systemic side effects while maintaining good local efficacy.',
    },
    pros: {
      en: ['Lower systemic side effect burden', 'No significant alcohol interaction at topical doses', 'Good local efficacy'],
    },
    cons: {
      en: ['Less convenient than oral dosing for some patients', 'Higher cost than oral metronidazole', 'May be less effective for recurrent cases'],
    },
    evidence: {
      en: ['BV topical alternative pathway', 'Reduced systemic exposure advantage', 'Patient preference consideration'],
    },
    basePreference: { CA: 82, US: 85, UK: 80 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Alternative topical option', price: 16.4, codeSystem: 'DIN', code: 'DEMO-CA-METVAG' },
      US: { available: true, preferred: true, formulary: 'Common topical alternative', price: 19.2, codeSystem: 'RxNorm', code: 'DEMO-US-METVAG' },
      UK: { available: true, preferred: false, formulary: 'Alternative branch', price: 8.4, codeSystem: 'dm+d', code: 'DEMO-UK-METVAG' },
    },
    dose: {
      en: 'Metronidazole 0.75% vaginal gel, one applicatorful intravaginally once daily for 5 days.',
    },
    order: {
      medication: 'Metronidazole 0.75% vaginal gel',
      sig: { en: 'Insert one applicatorful intravaginally once daily at bedtime for 5 days.' },
      dispense: '1 tube with applicator (70 g)',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Topical BV alternative package in the mock.' },
    },
    symptomBoosts: { vaginalDischarge: 2, fishy: 2, cluePositive: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('recurrent'), reason: { en: 'Recurrent BV may respond better to oral systemic therapy than topical alone.' } },
      { effect: 'caution', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Vaginal metronidazole in pregnancy requires clinician review.' } },
    ],
  },
  {
    id: 'clindamycin-vaginal',
    condition: 'bv',
    labels: { en: 'Clindamycin vaginal cream' },
    type: { en: 'BV second-line topical' },
    form: { en: '2% vaginal cream' },
    rationale: {
      en: 'A non-nitroimidazole topical alternative for BV when metronidazole is not tolerated or contraindicated.',
    },
    pros: {
      en: ['No alcohol interaction concern', 'Avoids nitroimidazole class entirely', 'Good topical tolerability'],
    },
    cons: {
      en: ['Can weaken latex condoms', 'Higher cost than metronidazole options', 'May promote clindamycin-resistant organisms'],
    },
    evidence: {
      en: ['BV second-line pathway', 'Nitroimidazole avoidance branch', 'Latex condom counseling'],
    },
    basePreference: { CA: 70, US: 72, UK: 68 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Second-line alternative', price: 20.6, codeSystem: 'DIN', code: 'DEMO-CA-CLINDVAG' },
      US: { available: true, preferred: false, formulary: 'Alternative branch', price: 24.8, codeSystem: 'RxNorm', code: 'DEMO-US-CLINDVAG' },
      UK: { available: true, preferred: false, formulary: 'Reserve alternative', price: 11.2, codeSystem: 'dm+d', code: 'DEMO-UK-CLINDVAG' },
    },
    dose: {
      en: 'Clindamycin 2% vaginal cream, one applicatorful intravaginally at bedtime for 7 days.',
    },
    order: {
      medication: 'Clindamycin 2% vaginal cream',
      sig: { en: 'Insert one applicatorful intravaginally at bedtime for 7 days.' },
      dispense: '1 tube with applicator (40 g)',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'BV second-line topical alternative in the mock.' },
    },
    symptomBoosts: { vaginalDischarge: 2, fishy: 1, cluePositive: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.currentMeds.length >= 2, reason: { en: 'Multiple concurrent medications increase interaction review complexity with clindamycin.' } },
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('recurrent'), reason: { en: 'Recurrent BV may need longer or combination therapy; clindamycin alone may be insufficient.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     VULVOVAGINAL CANDIDIASIS medications
     ─────────────────────────────────────────────── */
  {
    id: 'fluconazole-oral',
    condition: 'vulvovaginal-candidiasis',
    labels: { en: 'Fluconazole oral' },
    type: { en: 'Oral antifungal single-dose package' },
    form: { en: '150 mg capsule' },
    rationale: {
      en: 'A convenient single-dose oral antifungal that is the most commonly prescribed treatment for uncomplicated vulvovaginal candidiasis.',
    },
    pros: {
      en: ['Single-dose convenience', 'High patient preference over topical', 'Excellent cure rates for uncomplicated cases'],
    },
    cons: {
      en: ['Hepatic function review needed', 'Drug interactions with statins and other CYP inhibitors', 'Not appropriate for recurrent cases as single dose'],
    },
    evidence: {
      en: ['Vulvovaginal candidiasis oral pathway', 'Hepatic safety gate', 'Drug interaction overlay'],
    },
    basePreference: { CA: 88, US: 90, UK: 85 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'Preferred oral antifungal', price: 8.4, codeSystem: 'DIN', code: 'DEMO-CA-FLUCON' },
      US: { available: true, preferred: true, formulary: 'Most common Rx choice', price: 12.6, codeSystem: 'RxNorm', code: 'DEMO-US-FLUCON' },
      UK: { available: true, preferred: true, formulary: 'Common first-line', price: 4.2, codeSystem: 'dm+d', code: 'DEMO-UK-FLUCON' },
    },
    dose: {
      en: 'Fluconazole 150 mg by mouth once.',
    },
    order: {
      medication: 'Fluconazole 150 mg capsule',
      sig: { en: 'Take 1 capsule by mouth once.' },
      dispense: '1 capsule',
      refills: '0',
      duration: 'Single dose',
      pharmacy: { en: 'Single-dose oral antifungal package in the mock.' },
    },
    symptomBoosts: { itching: 3, thickDischarge: 2, erythema: 2 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.hepaticRisk !== 'normal', reason: { en: 'Fluconazole is hepatically metabolized; liver function review required.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('statin'), reason: { en: 'Fluconazole inhibits CYP3A4 and increases statin levels; rhabdomyolysis risk.' } },
      { effect: 'blocked', when: (ctx) => ctx.pregnancy === 'yes', reason: { en: 'Oral fluconazole is contraindicated in pregnancy due to teratogenicity risk.' } },
    ],
  },
  {
    id: 'clotrimazole-vaginal',
    condition: 'vulvovaginal-candidiasis',
    labels: { en: 'Clotrimazole vaginal' },
    type: { en: 'Topical antifungal vaginal package' },
    form: { en: '1% cream / 2% cream' },
    rationale: {
      en: 'An OTC-accessible topical antifungal option for uncomplicated vulvovaginal candidiasis, preferred when oral therapy is contraindicated.',
    },
    pros: {
      en: ['Available OTC in many markets', 'Safe in pregnancy', 'No systemic drug interactions'],
    },
    cons: {
      en: ['Longer treatment course than oral fluconazole', 'Local irritation possible', 'Patient may prefer oral convenience'],
    },
    evidence: {
      en: ['Vulvovaginal candidiasis topical pathway', 'Pregnancy-safe branch', 'OTC accessibility advantage'],
    },
    basePreference: { CA: 80, US: 78, UK: 82 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'Common OTC/Rx option', price: 12.8, codeSystem: 'DIN', code: 'DEMO-CA-CLOTVAG' },
      US: { available: true, preferred: false, formulary: 'OTC available', price: 14.6, codeSystem: 'RxNorm', code: 'DEMO-US-CLOTVAG' },
      UK: { available: true, preferred: true, formulary: 'OTC preferred first-pass', price: 5.4, codeSystem: 'dm+d', code: 'DEMO-UK-CLOTVAG' },
    },
    dose: {
      en: 'Clotrimazole 1% vaginal cream, one applicatorful intravaginally at bedtime for 7 days; or 2% cream for 3 days.',
    },
    order: {
      medication: 'Clotrimazole vaginal cream',
      sig: { en: 'Insert one applicatorful intravaginally at bedtime for 7 days (1%) or 3 days (2%).' },
      dispense: '1 tube with applicator',
      refills: '0',
      duration: '3 to 7 days',
      pharmacy: { en: 'Topical vaginal antifungal package in the mock.' },
    },
    symptomBoosts: { itching: 2, thickDischarge: 2, erythema: 1 },
    rules: [
      { effect: 'caution', when: (ctx) => ctx.symptoms.includes('recurrent'), reason: { en: 'Recurrent candidiasis (4+/year) usually requires longer or suppressive oral therapy rather than topical alone.' } },
      { effect: 'caution', when: (ctx) => ctx.age < 12, reason: { en: 'Prepubertal patients need different diagnostic consideration before treating empirically.' } },
    ],
  },

  /* ───────────────────────────────────────────────
     BRONCHITIS (BACTERIAL) medications
     ─────────────────────────────────────────────── */
  {
    id: 'amoxicillin-bronchitis',
    condition: 'bronchitis-bacterial',
    labels: { en: 'Amoxicillin' },
    type: { en: 'First-line for bacterial bronchitis' },
    form: { en: '500 mg capsule' },
    rationale: {
      en: 'First-line oral antibiotic when bacterial bronchitis is suspected beyond the typical viral course.',
    },
    pros: {
      en: ['Narrow spectrum', 'Low cost', 'Well-tolerated'],
    },
    cons: {
      en: ['Penicillin allergy blocks it', 'Most bronchitis is viral — confirm bacterial suspicion'],
    },
    evidence: {
      en: ['CTS outpatient lower respiratory guidelines', 'Narrow-spectrum first approach'],
    },
    basePreference: { CA: 84, US: 80, UK: 86 },
    regionData: {
      CA: { available: true, preferred: true, formulary: 'ODB listed', price: 8.4, codeSystem: 'DIN', code: '00628115' },
      US: { available: true, preferred: true, formulary: 'Tier 1 generic', price: 6.8, codeSystem: 'RxNorm', code: '723' },
      UK: { available: true, preferred: true, formulary: 'NHS first-line', price: 2.4, codeSystem: 'dm+d', code: 'DEMO-UK-AMOXBRON' },
    },
    dose: {
      en: 'Amoxicillin 500 mg by mouth three times daily for 5-7 days.',
    },
    order: {
      medication: 'Amoxicillin 500 mg capsule',
      sig: { en: 'Take 1 capsule by mouth three times daily for 5-7 days.' },
      dispense: '21 capsules',
      refills: '0',
      duration: '7 days',
      pharmacy: { en: 'Antibiotic for bacterial bronchitis. Most bronchitis is viral — confirm indication.' },
    },
    symptomBoosts: { productiveCough: 2, fever: 3, prolongedCough: 2, crackleLungSounds: 2 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('penicillin'), reason: { en: 'Penicillin allergy blocks this package.' } },
    ],
  },
  {
    id: 'azithromycin-bronchitis',
    condition: 'bronchitis-bacterial',
    labels: { en: 'Azithromycin' },
    type: { en: 'Macrolide alternative for bronchitis' },
    form: { en: '250 mg tablet' },
    rationale: {
      en: 'Alternative for penicillin-allergic patients or when atypical pathogen is suspected.',
    },
    pros: {
      en: ['Covers atypical pathogens', 'Short 5-day course', 'Good for penicillin allergy'],
    },
    cons: {
      en: ['QT prolongation risk', 'Macrolide resistance increasing', 'Not first-line when penicillin tolerated'],
    },
    evidence: {
      en: ['CTS alternative for lower respiratory', 'Atypical coverage advantage'],
    },
    basePreference: { CA: 72, US: 76, UK: 70 },
    regionData: {
      CA: { available: true, preferred: false, formulary: 'ODB listed', price: 14.2, codeSystem: 'DIN', code: '02212021' },
      US: { available: true, preferred: false, formulary: 'Tier 1 generic', price: 10.8, codeSystem: 'RxNorm', code: '18631' },
      UK: { available: true, preferred: false, formulary: 'Alternative', price: 4.8, codeSystem: 'dm+d', code: 'DEMO-UK-AZIBRON' },
    },
    dose: {
      en: 'Azithromycin 500 mg on day 1, then 250 mg daily on days 2 to 5.',
    },
    order: {
      medication: 'Azithromycin 250 mg tablet',
      sig: { en: 'Take 2 tablets on day 1, then 1 tablet daily on days 2 to 5.' },
      dispense: '6 tablets',
      refills: '0',
      duration: '5 days',
      pharmacy: { en: 'Macrolide for bronchitis. Alternative for penicillin allergy.' },
    },
    symptomBoosts: { productiveCough: 2, prolongedCough: 2, dyspnea: 1 },
    rules: [
      { effect: 'blocked', when: (ctx) => ctx.allergies.includes('macrolide'), reason: { en: 'Macrolide allergy blocks this package.' } },
      { effect: 'caution', when: (ctx) => ctx.currentMeds.includes('qtRisk'), reason: { en: 'QT-risk medicines make this alternative review-heavy.' } },
    ],
  },
]);
