(function initTolEmrModels(globalScope) {
  const FIELD_LABELS = {
    medication: 'Medication',
    sig: 'Sig / directions',
    quantity: 'Quantity',
    refills: 'Refills',
    duration: 'Duration',
    daysSupply: 'Days supply',
    unitType: 'Unit type',
    route: 'Route',
    frequency: 'Frequency',
    reasonForRx: 'Reason for Rx',
    indication: 'Indication',
    pharmacyNote: 'Notes to pharmacy',
    serviceLocation: 'Service location',
    supervisingProvider: 'Supervising provider',
    effectiveDate: 'Effective date',
    allowSubstitution: 'Allow substitution',
  };

  const MODELS = {
    oscar: {
      label: 'OSCAR / Juno',
      region: 'Canada',
      confidence: 'high',
      sourceType: 'official docs + local HTML',
      notes:
        'Public OSCAR Rx documentation and local HTML confirm drug search, instructions, quantity, repeats, route, frequency, duration, special instructions, and comment fields.',
      requiredLogicalFields: ['medication', 'sig', 'quantity', 'refills'],
      recommendedLogicalFields: ['duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://oscarmanual.org/oscar_emr_12/clinical-functions/prescription/writing-prescriptions-rx3/',
      ],
    },
    pssuite: {
      label: 'PS Suite',
      region: 'Canada',
      confidence: 'medium',
      sourceType: 'official product material',
      notes:
        'TELUS publicly confirms integrated electronic prescribing, but field-level prescribing UI documentation is not public. Use the Canadian ambulatory structured model until live page captures are available.',
      requiredLogicalFields: ['medication', 'sig', 'quantity', 'refills'],
      recommendedLogicalFields: ['duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.telus.com/en/health/health-professionals/clinics/ps-suite',
      ],
    },
    accuro: {
      label: 'Accuro',
      region: 'Canada',
      confidence: 'medium',
      sourceType: 'official knowledge base',
      notes:
        'Accuro public guidance confirms medication search, route, dosage, quantity, refill quantity, and pharmacy-contact fields from the prescription workflow.',
      requiredLogicalFields: ['medication', 'quantity'],
      recommendedLogicalFields: ['sig', 'route', 'refills', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'route', 'sig', 'quantity', 'refills', 'duration', 'indication', 'pharmacyNote'],
      sources: [
        'https://userguide.accuroemr.com/5089.htm',
      ],
    },
    medaccess: {
      label: 'Med Access',
      region: 'Canada',
      confidence: 'low',
      sourceType: 'official product material',
      notes:
        'TELUS confirms integrated electronic prescribing, but public field-level prescribing documentation is not available.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.telus.com/en/health/health-professionals/clinics/med-access',
      ],
    },
    chr: {
      label: 'CHR',
      region: 'Canada',
      confidence: 'low',
      sourceType: 'official product material',
      notes:
        'TELUS confirms full EMR functionality including prescriptions, but public field-level prescribing UI guidance is not available.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.telus.com/en/health/health-professionals/clinics/collaborative-health-record',
      ],
    },
    medesync: {
      label: 'Medesync',
      region: 'Canada',
      confidence: 'low',
      sourceType: 'official product material',
      notes:
        'TELUS public product material confirms efficient drug search, favourites, templates, and prescription models, but not exact prescription-form fields.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.telus.com/en/health/health-professionals/clinics/medesync',
      ],
    },
    epic: {
      label: 'Epic',
      region: 'United States',
      confidence: 'medium',
      sourceType: 'official FHIR / API docs',
      notes:
        'Epic public docs are strongest for unsigned-order creation via FHIR and CDS Hooks. The browser fill model should prioritize medication, sig, quantity, refills, route, and indication.',
      requiredLogicalFields: ['medication', 'sig'],
      recommendedLogicalFields: ['quantity', 'refills', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://open.epic.com/Clinical/FHIR',
        'https://fhir.epic.com/Developer/Create',
      ],
    },
    athena: {
      label: 'Athena',
      region: 'United States',
      confidence: 'medium',
      sourceType: 'official FHIR docs',
      notes:
        'Public athenahealth MedicationRequest documentation is API-oriented. For UI-fill support, treat medication, sig, quantity, and refills as the core set; keep indication and pharmacy note secondary.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'route', 'frequency', 'indication', 'pharmacyNote'],
      sources: [
        'https://docs.mydata.athenahealth.com/fhir-r4/StructureDefinition-athena-medrequest-profile.html',
        'https://docs.mydata.athenahealth.com/fhir-r4/StructureDefinition-athena-medicationrequest-extension-dispenseInstructions.html',
      ],
    },
    eclinicalworks: {
      label: 'eClinicalWorks',
      region: 'United States',
      confidence: 'medium',
      sourceType: 'official product material',
      notes:
        'Public eClinicalWorks material confirms e-prescribing, formulary checking, and EPCS. Exact field-level prescribing docs are not public, so treat it as a structured ambulatory fill target.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.eclinicalworks.com/products-services/pricing/',
        'https://www.eclinicalworks.com/wp-content/uploads/2016/11/ePrescribing-of-Controlled-Substances-Slick.pdf',
      ],
    },
    nextgen: {
      label: 'NextGen',
      region: 'United States',
      confidence: 'high',
      sourceType: 'official help docs',
      notes:
        'NextGen public ePrescribing docs explicitly call out valid SIG, numeric quantity, and unit type as core requirements for electronic submission.',
      requiredLogicalFields: ['medication', 'sig', 'quantity', 'unitType'],
      recommendedLogicalFields: ['refills', 'daysSupply', 'reasonForRx', 'serviceLocation', 'supervisingProvider', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'unitType', 'daysSupply', 'refills', 'reasonForRx', 'serviceLocation', 'supervisingProvider', 'pharmacyNote'],
      sources: [
        'https://docs.nextgen.com/en-US/nextgenc2ae-enterprise-ehr-help-3240205/electronic-prescriptions-357886',
        'https://docs.nextgen.com/nextgen%C2%AE-enterprise-ehr-help-3240205/eprescribing-medications-357966',
      ],
    },
    practicefusion: {
      label: 'Practice Fusion',
      region: 'United States',
      confidence: 'low',
      sourceType: 'official product material',
      notes:
        'Public product pages confirm certified e-prescribing, EPCS, templates, refill workflows, and prior auth, but they do not expose field-level UI specs.',
      requiredLogicalFields: ['medication', 'sig'],
      recommendedLogicalFields: ['quantity', 'refills', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'indication', 'pharmacyNote'],
      sources: [
        'https://www.practicefusion.com/e-prescribing/',
        'https://www.practicefusion.com/epcs/',
      ],
    },
    drchrono: {
      label: 'DrChrono',
      region: 'United States',
      confidence: 'high',
      sourceType: 'official support docs',
      notes:
        'DrChrono public support docs clearly describe medication, quantity, refills, days supply, effective date, service location, reason for Rx, patient instructions, supervising provider, and notes-to-pharmacy usage.',
      requiredLogicalFields: ['medication', 'sig', 'quantity', 'refills'],
      recommendedLogicalFields: ['daysSupply', 'effectiveDate', 'serviceLocation', 'reasonForRx', 'supervisingProvider', 'allowSubstitution', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'daysSupply', 'refills', 'effectiveDate', 'serviceLocation', 'reasonForRx', 'supervisingProvider', 'allowSubstitution', 'pharmacyNote'],
      sources: [
        'https://support.drchrono.com/home/227837547-prescribing-medications-via-drchrono-s-web-app',
        'https://support.drchrono.com/home/204621714-appropriate-and-inappropriate-use-of-the-notes-to-pharmacy-field',
      ],
    },
    emis: {
      label: 'EMIS Web',
      region: 'United Kingdom',
      confidence: 'low',
      sourceType: 'official product material',
      notes:
        'Public EMIS material confirms embedded prescribing and medicines-management integration, but field-level prescribing UI docs are not public.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'indication'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'indication'],
      sources: [
        'https://www.emishealth.com/products/emis-web',
      ],
    },
    systmone: {
      label: 'TPP SystmOne',
      region: 'United Kingdom',
      confidence: 'medium',
      sourceType: 'official product material',
      notes:
        'TPP public prescribing material confirms bulk signing, repeat dispensing, formularies, and decision support. Treat medication, sig, quantity, and repeat issue details as the core fill set.',
      requiredLogicalFields: ['medication', 'sig', 'quantity'],
      recommendedLogicalFields: ['refills', 'duration', 'indication'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'indication'],
      sources: [
        'https://tpp-uk.com/general-practice/prescribing/',
      ],
    },
    vision: {
      label: 'Vision',
      region: 'United Kingdom',
      confidence: 'medium',
      sourceType: 'official help docs',
      notes:
        'Vision public help covers quantity, dosage defaults, duration, issue frequency, pack size, repeat settings, and dm+d/Gemscript-backed prescribing behavior.',
      requiredLogicalFields: ['medication', 'quantity'],
      recommendedLogicalFields: ['sig', 'duration', 'refills'],
      fillOrder: ['medication', 'sig', 'quantity', 'duration', 'refills', 'indication'],
      sources: [
        'https://help.visionhealth.co.uk/VA/windows/content/Help_Topics/Medication/Adding_Medication.htm',
        'https://help.visionhealth.co.uk/Vision_Consultation_Manager_Help_Centre/content/conmgr/29207.htm',
      ],
    },
    generic: {
      label: 'Generic fallback',
      region: 'Mixed',
      confidence: 'low',
      sourceType: 'internal fallback',
      notes:
        'Use when no stronger public model is available. Focus on medication, sig, quantity, and refills first.',
      requiredLogicalFields: ['medication', 'sig'],
      recommendedLogicalFields: ['quantity', 'refills', 'duration', 'indication', 'pharmacyNote'],
      fillOrder: ['medication', 'sig', 'quantity', 'refills', 'duration', 'indication', 'pharmacyNote'],
      sources: [],
    },
  };

  globalScope.TOLEmrModels = {
    FIELD_LABELS,
    MODELS,
    getModel(key) {
      return MODELS[key] || MODELS.generic;
    },
  };
})(globalThis);
