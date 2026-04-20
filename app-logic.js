(() => {
  const config = window.TOLConfig;
  const data = window.TOLData;
  const catalog = window.TOLCatalog || [];

  const app = {
    config,
    data,
    catalog,
    state: structuredClone(config.state),
    templates: structuredClone(data.DEFAULT_TEMPLATES),
    dom: {},
    selectedOptionId: null,
    scenarioIndex: 0,
    processedSnapshot: null,
    isProcessing: false,
    processingToken: 0,
    templateDraft: null,
    copyFeedbackKey: '',
    tourState: { open: false, index: 0 },
    TOUR_STORAGE_KEY: 'atlas-prescribe-tour-seen-v2',
  };

  app.textFor = (map, lang) => {
    if (typeof map === 'string') {
      return map;
    }
    return map?.[lang] || map?.en || '';
  };

  app.t = (key) => app.config.UI_TEXT[app.state.language]?.[key] || app.config.UI_TEXT.en[key] || key;

  app.escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  app.getRegionMeta = (value) => app.config.REGIONS.find((item) => item.value === value);
  app.getEmrMeta = (value) => app.config.EMR_TYPES.find((item) => item.value === value);
  app.getWorkflowMeta = (value) => app.config.WORKFLOW_MODES.find((item) => item.value === value);
  app.getDomainMeta = (value) => app.config.DOMAINS.find((item) => item.value === value);
  app.getSubtypeMeta = (value) => app.config.SUBTYPES.find((item) => item.value === value);
  app.getConditionMeta = (value) => app.data.CONDITIONS.find((item) => item.value === value);
  app.getTemplateById = (id, source = app.templates) => source.find((item) => item.id === id) || null;
  app.getOptionMeta = (id) => app.catalog.find((item) => item.id === id) || null;
  app.getSubtypeOptions = (domainValue) => app.config.SUBTYPES.filter((item) => item.domain === domainValue);
  app.getConditionOptions = (domainValue, subtypeValue) =>
    app.data.CONDITIONS.filter((item) => item.domain === domainValue && item.subtype === subtypeValue);
  app.getSymptomsForCondition = (conditionValue) => app.data.CONDITION_SYMPTOMS[conditionValue] || [];
  app.getMedicationOptionsForCondition = (conditionValue) => app.catalog.filter((item) => item.condition === conditionValue);

  // ─── Paediatric dose engine (BNFc age-banded) ────────────────────
  app.computePedsDose = (option, ctx) => {
    const pd = option && option.pedsData;
    if (!pd) return null;

    const ageMonths = ctx.age < 1 ? Math.round(ctx.age * 12) : Math.round(ctx.age * 12);
    const weight = ctx.weight || 0;

    // Find matching age band
    const band = (pd.ageBands || []).find(b => ageMonths >= b.minMonths && ageMonths < b.maxMonths);

    let perDose = null;
    if (band && band.fixedDose) {
      perDose = band.fixedDose;
    } else if (pd.mgPerKg && weight > 0) {
      perDose = Math.round(pd.mgPerKg * weight * 10) / 10;
      if (pd.maxDose) perDose = Math.min(perDose, pd.maxDose);
    }

    return {
      perDose: perDose,
      unit: (band && band.unit) || pd.unit || 'mg',
      frequency: pd.frequency || '',
      maxDailyDoses: pd.maxDailyDoses || 0,
      dailyTotal: perDose && pd.maxDailyDoses ? Math.round(perDose * pd.maxDailyDoses * 10) / 10 : null,
      duration: pd.duration || '',
      form: (band && band.form) || (option.form && option.form.en) || '',
      line: pd.line || 0,
      isEmergency: pd.isEmergency || false,
      isStat: pd.isStat || false,
      referralRequired: pd.referralRequired || false,
      sideEffects: pd.sideEffects || [],
      contraindications: pd.contraindications || [],
      ageMonths: ageMonths,
      weight: weight,
      bandLabel: app.formatAgeBandLabel(band),
    };
  };

  app.formatCurrency = (amount, regionValue) => {
    const meta = app.getRegionMeta(regionValue);
    if (!meta || amount === undefined || amount === null || amount === 0) {
      return 'n/a';
    }
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  app.labelList = (items, values, lang) =>
    values
      .map((value) => {
        const found = items.find((item) => item.value === value);
        return found ? app.textFor(found, lang) : value;
      })
      .join(', ');

  app.currentWorkflowLabel = (ctx) => app.textFor(app.getWorkflowMeta(ctx.workflowMode), ctx.language);
  app.currentConditionLabel = (ctx) => app.textFor(app.getConditionMeta(ctx.condition), ctx.language);
  app.currentTemplateLabel = (ctx) => ctx.templateSnapshot?.name || app.t('outputTemplateNone');

  app.formatAgeBandLabel = (band) => {
    if (!band) return null;
    const monthLabel = (value) => `${value} month${value === 1 ? '' : 's'}`;
    const yearLabel = (value) => `${value} year${value === 1 ? '' : 's'}`;

    if (band.minMonths === 0 && band.maxMonths === 1) return 'Under 1 month';
    if (band.minMonths === 0 && band.maxMonths === 12) return 'Under 1 year';
    if (band.maxMonths <= 12) return `${monthLabel(band.minMonths)} to ${monthLabel(band.maxMonths)}`;

    const minYears = band.minMonths / 12;
    const maxYears = band.maxMonths / 12;
    if (Number.isInteger(minYears) && Number.isInteger(maxYears)) {
      return `${yearLabel(minYears)} to ${yearLabel(maxYears)}`;
    }
    if (band.minMonths < 12 && Number.isInteger(maxYears)) {
      return `${monthLabel(band.minMonths)} to ${yearLabel(maxYears)}`;
    }
    return `${band.minMonths}-${band.maxMonths} months`;
  };

  app.buildPathLabel = (ctx) =>
    [app.getDomainMeta(ctx.domain), app.getSubtypeMeta(ctx.subtype), app.getConditionMeta(ctx.condition)]
      .filter(Boolean)
      .map((item) => app.textFor(item, ctx.language))
      .join(' > ');

  app.ensureGuidedSelections = () => {
    if (app.state.domain && !app.config.DOMAINS.some((item) => item.value === app.state.domain)) {
      app.state.domain = '';
    }
    if (!app.state.domain) {
      app.state.subtype = '';
      app.state.condition = '';
      app.state.symptoms = [];
      return;
    }
    const subtypeOptions = app.getSubtypeOptions(app.state.domain);
    if (app.state.subtype && !subtypeOptions.some((item) => item.value === app.state.subtype)) {
      app.state.subtype = subtypeOptions[0]?.value || '';
    }
    if (!app.state.subtype) {
      app.state.condition = '';
      app.state.symptoms = [];
      return;
    }
    const conditionOptions = app.getConditionOptions(app.state.domain, app.state.subtype);
    if (app.state.condition && !conditionOptions.some((item) => item.value === app.state.condition)) {
      app.state.condition = '';
    }
    const allowedSymptoms = app.getSymptomsForCondition(app.state.condition).map((item) => item.value);
    app.state.symptoms = app.state.symptoms.filter((item) => allowedSymptoms.includes(item));
  };

  app.applyConditionToState = (conditionValue) => {
    const meta = app.getConditionMeta(conditionValue);
    if (!meta) {
      return;
    }
    app.state.domain = meta.domain;
    app.state.subtype = meta.subtype;
    app.state.condition = meta.value;
    app.ensureGuidedSelections();
  };

  app.ensureTemplateSelection = () => {
    if (!app.templates.length) {
      return;
    }
    if (!app.getTemplateById(app.state.templateId)) {
      app.state.templateId = app.templates[0].id;
    }
  };

  app.applyTemplateToState = (template, { syncMarket = true } = {}) => {
    if (!template) {
      return;
    }
    app.state.templateId = template.id;
    app.applyConditionToState(template.condition);
    if (syncMarket) {
      app.state.region = template.region;
      app.state.policyModel = template.policyModel;
      app.state.emrType = template.emrType;
    }
  };

  app.ensureTemplateDraft = () => {
    app.ensureTemplateSelection();
    const active = app.getTemplateById(app.state.templateId);
    if (!app.templateDraft || app.templateDraft.id !== active?.id) {
      app.templateDraft = structuredClone(active);
    }
  };

  app.createTemplateFromCurrentCase = () => {
    const meds = app.getMedicationOptionsForCondition(app.state.condition);
    return {
      id: `tpl-custom-${Date.now()}`,
      name: `${app.currentConditionLabel(app.state)} custom draft`,
      condition: app.state.condition,
      defaultMedication: meds[0]?.id || '',
      ageMin: Math.max(0, app.state.age - 5),
      ageMax: app.state.age + 15,
      weightMin: Math.max(1, app.state.weight - 15),
      weightMax: app.state.weight + 20,
      emrType: app.state.emrType,
      region: app.state.region,
      policyModel: app.state.policyModel,
      notes: 'Custom clinician-authored draft copied from the current mock case.',
    };
  };

  app.markPendingReview = () => {
    app.processingToken += 1;
    app.isProcessing = false;
    app.processedSnapshot = null;
    app.selectedOptionId = null;
    app.copyFeedbackKey = '';
  };

  app.processCurrentContext = () => {
    const template =
      app.state.workflowMode === 'template'
        ? structuredClone(app.getTemplateById(app.state.templateId) || app.templateDraft || null)
        : null;
    app.processedSnapshot = structuredClone({ ...app.state, templateSnapshot: template });
    app.selectedOptionId = null;
  };

  app.evaluateOption = (option, ctx) => {
    const template = ctx.templateSnapshot;
    const regionData = option.regionData[ctx.region];
    const hits = [];
    let status = 'eligible';
    let score = option.basePreference[ctx.region] || 60;

    if (!regionData || !regionData.available) {
      status = 'blocked';
      hits.push({ effect: 'blocked', message: 'This package is not mapped as available in the active market.' });
    }

    option.rules.forEach((rule) => {
      if (!rule.when(ctx, template)) {
        return;
      }
      hits.push({ effect: rule.effect, message: app.textFor(rule.reason, ctx.language) });
      if (rule.effect === 'blocked') {
        status = 'blocked';
        score -= 24;
        return;
      }
      if (rule.effect === 'caution' && status !== 'blocked') {
        status = 'caution';
        score -= 8;
      }
    });

    ctx.symptoms.forEach((symptom) => {
      if (!option.symptomBoosts?.[symptom]) {
        return;
      }
      score += option.symptomBoosts[symptom];
      hits.push({ effect: 'boost', message: 'The selected clues make this branch more plausible in the mock.' });
    });

    if (template?.defaultMedication === option.id) {
      score += 10;
      hits.push({ effect: 'boost', message: 'The saved template explicitly favors this package.' });
    }

    if (regionData.preferred && ctx.policyModel === 'local') {
      score += 7;
      hits.push({ effect: 'boost', message: 'The local model boosts this preferred package.' });
    }

    if (ctx.policyModel === 'value' && regionData.price >= 20) {
      score -= 6;
      if (status === 'eligible') {
        status = 'caution';
      }
      hits.push({ effect: 'caution', message: 'The cost-aware mode increases review for this higher-price package.' });
    }

    const primaryReason =
      hits.find((item) => item.effect === 'blocked')?.message ||
      hits.find((item) => item.effect === 'caution')?.message ||
      app.textFor(option.rationale, ctx.language);

    return {
      id: option.id,
      label: app.textFor(option.labels, ctx.language),
      type: app.textFor(option.type, ctx.language),
      form: app.textFor(option.form, ctx.language),
      rationale: app.textFor(option.rationale, ctx.language),
      pros: option.pros[ctx.language] || option.pros.en,
      cons: option.cons[ctx.language] || option.cons.en,
      evidence: option.evidence[ctx.language] || option.evidence.en,
      regionData,
      dosePreview: app.textFor(option.dose, ctx.language),
      order: option.order,
      hits,
      primaryReason,
      price: app.formatCurrency(regionData.price, ctx.region),
      status,
      score: Math.max(0, Math.round(score)),
    };
  };

  app.evaluateOptions = (ctx) =>
    app.catalog
      .filter((item) => item.condition === ctx.condition)
      .map((item) => app.evaluateOption(item, ctx))
      .sort((a, b) => {
        const priority = { eligible: 0, caution: 1, blocked: 2 };
        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return b.score - a.score;
      });

  app.getTemplateFit = (ctx) => {
    const template = ctx.templateSnapshot;
    if (!template) {
      return {
        status: 'info',
        title: app.t('templateFitNone'),
        body: 'This review is using the guided path only.',
        details: [app.buildPathLabel(ctx)],
      };
    }

    const issues = [];
    let status = 'eligible';

    if (ctx.age < template.ageMin || ctx.age > template.ageMax) {
      status = 'blocked';
      issues.push(`Age ${ctx.age}y falls outside the saved ${template.ageMin}-${template.ageMax}y band.`);
    }
    if (ctx.weight < template.weightMin || ctx.weight > template.weightMax) {
      status = 'blocked';
      issues.push(`Weight ${ctx.weight}kg falls outside the saved ${template.weightMin}-${template.weightMax}kg band.`);
    }
    if (ctx.region !== template.region && status !== 'blocked') {
      status = 'caution';
      issues.push(`Template was authored for ${app.getRegionMeta(template.region).en}, but the active market is ${app.getRegionMeta(ctx.region).en}.`);
    }
    if (ctx.condition !== template.condition && status !== 'blocked') {
      status = 'caution';
      issues.push(`Template target condition is ${app.textFor(app.getConditionMeta(template.condition), ctx.language)}, not ${app.currentConditionLabel(ctx)}.`);
    }

    if (!issues.length) {
      return {
        status: 'eligible',
        title: app.t('templateFitPass'),
        body: 'The current patient and market snapshot stays inside the saved template guardrails.',
        details: [`${template.ageMin}-${template.ageMax}y`, `${template.weightMin}-${template.weightMax}kg`, template.name],
      };
    }

    return {
      status,
      title: status === 'blocked' ? app.t('templateFitBlock') : app.t('templateFitWarn'),
      body: issues[0],
      details: issues,
    };
  };

  app.globalChecks = (options, ctx, templateFit) => {
    const checks = [];
    if (templateFit && templateFit.status !== 'eligible' && templateFit.status !== 'info') {
      checks.push({
        level: templateFit.status === 'blocked' ? 'blocked' : 'caution',
        title: templateFit.title,
        body: templateFit.body,
      });
    }
    if (ctx.pregnancy === 'yes') {
      checks.push({ level: 'caution', title: 'Pregnancy review active', body: 'The mock keeps options visible, but the clinician still has to confirm the treatment lane.' });
    }
    if (ctx.egfr < 45) {
      checks.push({ level: 'caution', title: 'Renal threshold review', body: 'Reduced kidney function is shifting or blocking some packages.' });
    }
    if (ctx.condition === 'cystitis' && (ctx.symptoms.includes('flankPain') || ctx.symptoms.includes('fever'))) {
      checks.push({ level: 'caution', title: 'This may no longer look uncomplicated', body: 'Flank pain or fever should make a simple lower-tract fast apply less comfortable.' });
    }
    if (ctx.condition === 'ringworm' && (ctx.symptoms.includes('scalpScale') || ctx.symptoms.includes('extensiveRash'))) {
      checks.push({ level: 'info', title: 'Escalation branch is in play', body: 'Scalp or extensive disease is why oral antifungal packages are surfacing higher.' });
    }
    if (ctx.condition === 'chlamydia' && ctx.symptoms.includes('pelvicPain')) {
      checks.push({ level: 'caution', title: 'Broader STI review may be needed', body: 'Pelvic pain is a reminder not to over-treat this like a simple one-click pathway.' });
    }
    if (ctx.currentMeds.length >= 2) {
      checks.push({ level: 'info', title: 'Medication burden noted', body: 'The current medicines make interaction messaging more relevant in this review.' });
    }
    // ─── Paediatric red flags (0-5 years) ─────────────────────────
    if (ctx.age > 0 && ctx.age <= 5) {
      if (ctx.age < 0.25 && ctx.symptoms && ctx.symptoms.includes('feverUnder3mo')) {
        checks.push({ level: 'blocked', title: 'RED FLAG: Fever in infant <3 months', body: 'Any fever in an infant under 3 months requires immediate hospital referral. Do not prescribe — refer urgently.' });
      }
      if (ctx.symptoms && ctx.symptoms.includes('nonBlanchingRash')) {
        checks.push({ level: 'blocked', title: 'RED FLAG: Non-blanching rash', body: 'Non-blanching rash in a child requires emergency assessment for meningococcal disease. Administer benzylpenicillin IM if available and refer immediately.' });
      }
      if (ctx.symptoms && ctx.symptoms.includes('reducedConsciousness')) {
        checks.push({ level: 'blocked', title: 'RED FLAG: Reduced consciousness', body: 'Reduced consciousness in a child requires immediate emergency referral.' });
      }
      if (ctx.symptoms && ctx.symptoms.includes('respDistress')) {
        checks.push({ level: 'caution', title: 'Respiratory distress', body: 'Signs of significant respiratory distress (grunting, recession, cyanosis) — assess for severity and consider hospital referral.' });
      }
      if (ctx.symptoms && ctx.symptoms.includes('dehydration')) {
        checks.push({ level: 'caution', title: 'Dehydration warning', body: 'Avoid NSAIDs (ibuprofen) in dehydrated children — increased renal risk. Use paracetamol only until rehydrated.' });
      }
      if (ctx.symptoms && ctx.symptoms.includes('apnoea')) {
        checks.push({ level: 'blocked', title: 'RED FLAG: Apnoeic episodes', body: 'Apnoeic episodes in an infant require urgent hospital admission.' });
      }
    }

    const blockedCount = options.filter((item) => item.status === 'blocked').length;
    if (blockedCount) {
      checks.push({
        level: 'info',
        title: 'Packages removed',
        body: `${blockedCount} package${blockedCount === 1 ? '' : 's'} are blocked by the current patient or market fit.`,
      });
    }
    return checks;
  };

  function inferFrequencyCode(sigText) {
    const sigLower = String(sigText || '').toLowerCase();
    if (/once daily|every day|\bod\b|\bqd\b/.test(sigLower)) return 'OD';
    if (/twice daily|\bbid\b/.test(sigLower)) return 'BID';
    if (/three times daily|\btid\b/.test(sigLower)) return 'TID';
    if (/four times daily|\bqid\b/.test(sigLower)) return 'QID';
    if (/at bedtime|\bqhs\b/.test(sigLower)) return 'QHS';
    const everyHours = sigLower.match(/every (\d+) hours?/);
    if (everyHours) return `Q${everyHours[1]}H`;
    if (/single dose|single stat dose|\bstat\b/.test(sigLower)) return 'ONCE';
    return '';
  }

  function inferRouteCode(sigText, medicationText) {
    const source = `${sigText || ''} ${medicationText || ''}`.toLowerCase();
    if (/\boral\b|by mouth|\bpo\b|suspension|tablet|capsule/.test(source) && !/eye|ear|topical/.test(source)) return 'PO';
    if (/topical|apply|cream|ointment/.test(source)) return 'TOP';
    if (/\bim\b|intramuscular/.test(source)) return 'IM';
    if (/\biv\b|intravenous/.test(source)) return 'IV';
    if (/sublingual|\bsl\b/.test(source)) return 'SL';
    if (/nasal|intranasal|nostril/.test(source)) return 'IN';
    if (/ophthalmic|eye drops|eye ointment|eye\b/.test(source)) return 'OPH';
    if (/otic|ear drops|ear\b/.test(source)) return 'OTIC';
    if (/vaginal/.test(source)) return 'VAG';
    if (/rectal/.test(source)) return 'PR';
    if (/nebul/i.test(source)) return 'NEB';
    if (/buccal|oromucosal/.test(source)) return 'BUCCAL';
    return '';
  }

  function inferDoseAmount(sigText) {
    const sigLower = String(sigText || '').toLowerCase();
    const match =
      sigLower.match(/(\d+(?:\.\d+)?)\s*(micrograms?|mcg|mg|g|mL|ml|units?)(?!\/)/i) ||
      sigLower.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(mL|ml)/i);
    if (!match) return { amount: '', unit: '' };
    if (match[3] && /mL|ml/i.test(match[3])) {
      return { amount: `${match[1]}/${match[2]}`, unit: 'mL' };
    }
    return { amount: match[1], unit: match[2] };
  }

  function normalizeQuantity(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    return {
      raw,
      amount: match ? match[1] : '',
      unit: match ? match[2].trim() : '',
    };
  }

  function normalizeDuration(value) {
    return String(value || '').trim();
  }

  function buildPlatformFieldMap(canonical) {
    const shared = {
      medication: canonical.medicationDisplay,
      sig: canonical.sig,
      quantity: canonical.dispense.raw,
      refills: canonical.refills,
      duration: canonical.duration,
      indication: canonical.indication,
      pharmacyNote: canonical.pharmacyNote,
    };

    return {
      pssuite: {
        fields: {
          medication: shared.medication,
          instructions: shared.sig,
          quantity: shared.quantity,
          repeats: shared.refills,
          duration: shared.duration,
          indication: shared.indication,
          noteToPharmacy: shared.pharmacyNote,
        },
      },
      oscar: {
        fields: {
          drugName: shared.medication,
          instructions: shared.sig,
          quantity: shared.quantity,
          repeats: shared.refills,
          duration: shared.duration,
          specialInstruction: shared.indication,
          noteToPharmacy: shared.pharmacyNote,
        },
      },
      epic: {
        fields: {
          medicationDisplay: shared.medication,
          sig: shared.sig,
          dispenseQuantity: shared.quantity,
          refills: shared.refills,
          duration: shared.duration,
          indication: shared.indication,
          pharmacyNote: shared.pharmacyNote,
        },
      },
      athena: {
        fields: {
          medicationDisplay: shared.medication,
          sig: shared.sig,
          quantity: shared.quantity,
          refills: shared.refills,
          duration: shared.duration,
          patientNote: shared.indication,
          pharmacyNote: shared.pharmacyNote,
        },
      },
    };
  }

  app.buildEmrPayload = (selected, ctx) => {
    const sig = app.textFor(selected.order.sig, ctx.language);
    const quantity = normalizeQuantity(selected.order.dispense);
    const dose = inferDoseAmount(sig);
    const canonical = {
      medicationDisplay: selected.order.medication,
      sig,
      route: inferRouteCode(sig, selected.order.medication),
      frequencyCode: inferFrequencyCode(sig),
      doseAmount: dose.amount,
      doseUnit: dose.unit,
      dispense: quantity,
      duration: normalizeDuration(selected.order.duration),
      refills: String(selected.order.refills ?? ''),
      indication: app.currentConditionLabel(ctx),
      pharmacyNote: app.textFor(selected.order.pharmacy, ctx.language),
      region: ctx.region,
      emrType: ctx.emrType,
      conditionKey: ctx.condition,
      templateId: ctx.templateSnapshot?.id || '',
      selectedOptionId: selected.id,
    };
    const platformMap = buildPlatformFieldMap(canonical);

    return {
      _tol: true,
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      mode: 'copy-fill',
      canonical,
      adapter: {
        type: ctx.emrType,
        fields: platformMap[ctx.emrType]?.fields || platformMap.athena.fields,
      },
      adapters: platformMap,
    };
  };

  app.buildCopyPack = (selected, ctx) => {
    const templateName = ctx.templateSnapshot?.name || app.t('outputTemplateNone');
    const conditionName = app.currentConditionLabel(ctx);
    const sig = app.textFor(selected.order.sig, ctx.language);
    const reasons = selected.hits
      .filter((item) => item.effect !== 'boost')
      .slice(0, 2)
      .map((item) => item.message)
      .join(' | ');
    const chartReason = reasons || selected.rationale;

    let rxText = '';
    if (ctx.emrType === 'pssuite') {
      rxText = `Medication: ${selected.order.medication}\nSig: ${sig}\nDispense: ${selected.order.dispense}\nRefills: ${selected.order.refills}\n${app.t('copyIndication')}: ${conditionName}`;
    } else if (ctx.emrType === 'oscar') {
      rxText = `${selected.order.medication}\n${sig}\nDisp: ${selected.order.dispense}\nRF: ${selected.order.refills}\n${app.t('copyIndication')}: ${conditionName}`;
    } else if (ctx.emrType === 'epic') {
      rxText = `Medication: ${selected.order.medication}\nDose / Sig: ${sig}\nDuration: ${selected.order.duration}\nDispense: ${selected.order.dispense}\nRefills: ${selected.order.refills}\nIndication: ${conditionName}`;
    } else {
      rxText = `${selected.order.medication} | ${sig} | Disp ${selected.order.dispense} | ${selected.order.refills} RF | ${conditionName}`;
    }

    return {
      rx: rxText,
      chart: `Assessment: ${conditionName}\n${app.t('copyTemplate')}: ${templateName}\nWhy this package surfaced: ${chartReason}\nPros: ${selected.pros.slice(0, 2).join('; ')}\nCons: ${selected.cons.slice(0, 2).join('; ')}\n${app.t('copyNoteDemo')}`,
      pharmacy: `${app.t('copyIndication')}: ${conditionName}\nPackage: ${selected.order.medication}\nSig: ${sig}\nNotes: ${app.textFor(selected.order.pharmacy, ctx.language)}\n${app.t('copyNoteDemo')}`,
    };
  };

  app.getTourSteps = () => {
    const isFr = app.state.language === 'fr';
    return [
      { target: 'header', title: isFr ? 'Ce que la maquette montre' : 'What this mock shows', body: isFr ? 'TOL Scribe montre deux chemins: un mode guide pour les cas moins familiers et un mode modele enregistre pour les prescriptions repetitives.' : 'TOL Scribe shows two paths: a guided mode for less familiar cases and a saved-template mode for repeat prescribing.', tryText: isFr ? 'Relancez cette visite a tout moment pendant la demo.' : 'Restart this tour at any time during the demo.' },
      { target: 'essentials', title: isFr ? 'Commencez par le patient' : 'Start with the patient', body: isFr ? 'L age, le poids, la grossesse, le rein et le foie apparaissent en premier pour rappeler que meme un modele rapide ne saute pas le patient.' : 'Age, weight, pregnancy, kidney function, and hepatic review come first so even the fast-apply mode never skips the patient.', tryText: isFr ? 'Changez age ou poids pour voir comment le produit force une nouvelle revue.' : 'Change age or weight and the product will force a new review.' },
      { target: 'marketContext', title: isFr ? 'Choisissez le marche de sortie' : 'Choose the output environment', body: isFr ? 'Le meme paquet doit changer selon le pays, la terminologie et le style de copie EMR.' : 'The same package needs to change by country, terminology, and EMR copy style.', tryText: isFr ? 'Passez de PS Suite a Epic ou Athena pour voir le format de copie changer.' : 'Switch from PS Suite to Epic or Athena to change the copy format.' },
      { target: 'workflow', title: isFr ? 'Choisissez le flux' : 'Choose the workflow', body: isFr ? 'Le vrai produit devrait proposer deux entrees: le mode guide et le mode modele rapide.' : 'The real product should expose two entry points: guided prescribing and saved-template fast apply.', tryText: isFr ? 'Cliquez les deux cartes pour voir le produit changer de mode.' : 'Click both cards to watch the product switch modes.' },
      { target: 'guidedBuilder', title: isFr ? 'Le chemin guide' : 'The guided path', body: isFr ? 'Ici le medecin part d un grand theme puis se precise vers un diagnostic pratique, avec possibilite d ajouter ou ignorer des indices.' : 'Here the doctor starts broad and narrows into a practical condition, with optional symptom clues that can be added or skipped.', tryText: isFr ? 'Essayez infection > infection cutanee > teigne puis ajoutez quelques indices.' : 'Try infection > skin infection > ringworm and then add a few clues.' },
      { target: 'templateBuilder', title: isFr ? 'Le mode modele rapide' : 'The saved-template mode', body: isFr ? 'Ici le medecin choisit ou modifie un modele: condition cible, age, poids, medicament par defaut et sortie EMR.' : 'Here the doctor chooses or edits a template: target condition, age band, weight band, default medication, and EMR output.', tryText: isFr ? 'Modifiez un modele puis enregistrez-le pour montrer la logique de preparation clinique.' : 'Edit a template and save it to show the clinician-authored setup phase.' },
      { target: 'process', title: isFr ? 'Confirmez puis traitez' : 'Confirm, then process', body: isFr ? 'La maquette ne montre rien en direct. Elle exige une confirmation explicite du contexte avant de preparer le brouillon.' : 'The mock reveals nothing live. It requires an explicit confirmation of context before preparing the draft.', tryText: isFr ? 'Passez a l etape suivante pour traiter le contexte automatiquement.' : 'Move to the next step and the tour will process the current snapshot automatically.' },
      { target: 'templateFit', title: isFr ? 'Verifiez l ajustement du modele' : 'Check template fit', body: isFr ? 'Le produit doit toujours expliquer si le patient reste dans les garde-fous du modele.' : 'The product should always explain whether the patient still sits inside the saved template guardrails.', tryText: isFr ? 'Regardez cette carte avant de montrer le traitement lui-meme.' : 'Read this card before showing the medication draft itself.' },
      { target: 'selection', title: isFr ? 'Montrez le paquet principal' : 'Show the primary package', body: isFr ? 'Le brouillon principal combine logique clinique, pour et contre, et textes de copie prets pour le dossier.' : 'The primary draft combines clinical logic, pros and cons, and copy-ready text for the chart.', tryText: isFr ? 'Utilisez les boutons de copie pour montrer le format EMR.' : 'Use the copy buttons to show the EMR-specific formatting.' },
      { target: 'market', title: isFr ? 'Comparez les marches' : 'Compare markets', body: isFr ? 'La meme idee medicamenteuse doit changer de prix, statut et terminologie selon le marche.' : 'The same medication idea changes in price, status, and terminology by market.', tryText: isFr ? 'Changez pays et regardez les cartes du marche.' : 'Switch markets and watch the market cards change.' },
      { target: 'audit', title: isFr ? 'Finissez par l audit' : 'Finish with the audit trail', body: isFr ? 'Le vrai produit devra prouver quel chemin, quel modele et quel paquet ont ete prepares.' : 'A real product will need to prove which workflow, which template, and which package were used.', tryText: isFr ? 'Concluez la demo ici: vitesse avec garde-fous et logique visible.' : 'Close the demo here: speed with guardrails and visible logic.' },
    ];
  };

  window.TOL = app;
})();
