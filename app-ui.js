(() => {
  const app = window.TOL;
  const dom = {};

  const SEX_OPTIONS = [
    { value: 'female', en: 'Female' },
    { value: 'male', en: 'Male' },
  ];

  const PATIENT_PRESETS = [
    { id: 'adult-f', label: 'Adult F', age: 34, weight: 68, sex: 'female', pregnancy: 'no' },
    { id: 'adult-m', label: 'Adult M', age: 36, weight: 82, sex: 'male', pregnancy: 'na' },
    { id: 'older', label: 'Older', age: 74, weight: 69, sex: 'female', pregnancy: 'no' },
    { id: 'child', label: 'Child', age: 0, weight: 0, sex: 'male', pregnancy: 'na', isChild: true },
  ];

  const CHILD_AGE_BUCKETS = [
    { id: 'infant', label: '0 – 11 months', age: 0.5, weight: 7 },
    { id: 'toddler', label: '1 – 5 years', age: 3, weight: 15 },
    { id: 'school', label: '5 – 12 years', age: 8, weight: 30 },
  ];

  const EGFR_PRESETS = [
    { id: 'renal-ok', label: 'Normal', value: 90 },
    { id: 'renal-review', label: 'Review', value: 60 },
    { id: 'renal-low', label: 'Low', value: 35 },
  ];

  function escape(v) { return app.escapeHtml(v); }
  function text(m) { return app.textFor(m, app.state.language); }

  function isReady() {
    const s = app.state;
    if (s.workflowMode === 'lookup') return false;
    if (s.age <= 0 || s.weight <= 0) return false;
    if (s.workflowMode === 'guided' && !s.condition) return false;
    if (s.workflowMode === 'template' && !s.templateId) return false;
    if (!s.region || !s.emrType || !s.policyModel) return false;
    return true;
  }

  function autoProcess() {
    if (!isReady()) {
      app.processedSnapshot = null;
      app.selectedOptionId = null;
      return;
    }
    app.processCurrentContext();
  }

  // ─── LEFT COLUMN: PATIENT ─────────────────────────────────────────

  function renderPatientPanel() {
    const s = app.state;
    let h = '';

    h += `<div class="section-label">Quick presets</div>`;
    h += `<div class="preset-row">`;
    PATIENT_PRESETS.forEach((p) => {
      h += `<button type="button" class="preset-btn ${s.patientPresetId === p.id ? 'active' : ''}" data-patient-preset="${p.id}">${escape(p.label)}</button>`;
    });
    h += `</div>`;

    // Child age bucket picker
    if (s.patientPresetId === 'child') {
      h += `<div class="section-label">Age range</div>`;
      h += `<div class="chip-group">`;
      CHILD_AGE_BUCKETS.forEach((b) => {
        h += `<button type="button" class="chip ${app._childBucket === b.id ? 'active' : ''}" data-child-bucket="${b.id}">${escape(b.label)}</button>`;
      });
      h += `</div>`;
    }

    const ageDisabled = s.patientPresetId === 'child' && app._childBucket;
    h += `<div class="section-label">Demographics</div>`;
    h += `<div class="field-row">`;
    h += `<div class="field"><span>Age${ageDisabled ? ' (set by range)' : ''}</span><input type="number" class="input-sm" min="0" max="120" step="any" value="${s.age}" data-number-field="age" ${ageDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''} /></div>`;
    h += `<div class="field"><span>Weight (kg)</span><input type="number" class="input-sm" min="1" max="300" value="${s.weight}" data-number-field="weight" /></div>`;
    h += `</div>`;

    h += `<div class="section-label">Sex</div>`;
    h += `<div class="chip-group">`;
    SEX_OPTIONS.forEach((o) => {
      h += `<button type="button" class="chip ${s.sex === o.value ? 'active' : ''}" data-set-field="sex" data-value="${o.value}">${escape(text(o))}</button>`;
    });
    h += `</div>`;

    if (s.sex === 'female') {
      h += `<div class="section-label">Pregnancy</div>`;
      h += `<div class="chip-group">`;
      app.config.PREGNANCY_OPTIONS.filter((o) => o.value !== 'na').forEach((o) => {
        h += `<button type="button" class="chip ${s.pregnancy === o.value ? 'active' : ''}" data-set-field="pregnancy" data-value="${o.value}">${escape(text(o))}</button>`;
      });
      h += `</div>`;
    }

    h += `<div class="section-label">eGFR</div>`;
    h += `<div class="preset-row">`;
    EGFR_PRESETS.forEach((p) => {
      h += `<button type="button" class="preset-btn ${Math.abs(s.egfr - p.value) < 1 ? 'active' : ''}" data-egfr-preset="${p.id}">${escape(p.label)}</button>`;
    });
    h += `</div>`;
    h += `<div class="field"><input type="number" class="input-sm" min="0" max="200" value="${s.egfr}" data-number-field="egfr" /></div>`;

    h += `<div class="section-label">Allergies</div>`;
    h += `<div class="chip-group">`;
    app.config.ALLERGY_OPTIONS.forEach((o) => {
      h += `<button type="button" class="chip ${s.allergies.includes(o.value) ? 'active' : ''}" data-toggle-list="allergies" data-value="${o.value}">${escape(text(o))}</button>`;
    });
    h += `</div>`;

    h += `<div class="section-label">Current meds</div>`;
    h += `<div class="chip-group">`;
    app.config.CURRENT_MED_OPTIONS.forEach((o) => {
      h += `<button type="button" class="chip ${s.currentMeds.includes(o.value) ? 'active' : ''}" data-toggle-list="currentMeds" data-value="${o.value}">${escape(text(o))}</button>`;
    });
    h += `</div>`;

    h += `<div class="section-label">Hepatic</div>`;
    h += `<div class="chip-group">`;
    app.config.HEPATIC_OPTIONS.forEach((o) => {
      h += `<button type="button" class="chip ${s.hepaticRisk === o.value ? 'active' : ''}" data-set-field="hepaticRisk" data-value="${o.value}">${escape(text(o))}</button>`;
    });
    h += `</div>`;

    dom.patientPanel.innerHTML = h;
  }

  // ─── CENTER COLUMN: CLINICAL ──────────────────────────────────────

  function renderClinicalPanel() {
    const s = app.state;
    let h = '';

    // Mode toggle
    h += `<div class="mode-toggle">`;
    h += `<button type="button" class="${s.workflowMode === 'guided' ? 'active' : ''}" data-set-field="workflowMode" data-value="guided">Guided</button>`;
    h += `<button type="button" class="${s.workflowMode === 'template' ? 'active' : ''}" data-set-field="workflowMode" data-value="template">Template</button>`;
    h += `<button type="button" class="${s.workflowMode === 'lookup' ? 'active' : ''}" data-set-field="workflowMode" data-value="lookup">Lookup</button>`;
    h += `</div>`;

    if (s.workflowMode === 'guided') {
      h += renderGuidedSection();
    } else if (s.workflowMode === 'template') {
      h += renderTemplateSection();
    } else if (s.workflowMode === 'lookup') {
      h += renderLookupSection();
    }

    if (s.workflowMode !== 'lookup') {
      h += renderSettingsSection();
    }

    // Current path breadcrumb
    if (s.workflowMode === 'guided' && s.condition) {
      const domainLabel = text(app.getDomainMeta(s.domain));
      const subtypeLabel = text(app.getSubtypeMeta(s.subtype));
      const condLabel = text(app.getConditionMeta(s.condition));
      h += `<div class="path-breadcrumb">`;
      h += `<span class="tag-sm tag-teal">${escape(domainLabel)}</span>`;
      h += `<span class="path-sep">&rsaquo;</span>`;
      h += `<span class="tag-sm tag-teal">${escape(subtypeLabel)}</span>`;
      h += `<span class="path-sep">&rsaquo;</span>`;
      h += `<span class="tag-sm tag-teal">${escape(condLabel)}</span>`;
      h += `</div>`;
    }

    dom.clinicalPanel.innerHTML = h;
  }

  function renderGuidedSection() {
    const s = app.state;
    const searchVal = app._searchGuided || '';
    const isSearching = searchVal.length > 0;

    let h = '';

    // Search bar — searches across domains, subtypes, conditions
    h += `<div class="section-label">Search or browse</div>`;
    h += `<input type="search" class="search-box" placeholder="Search any condition, area, or keyword..." data-search-field="guidedSearch" value="${escape(searchVal)}" />`;

    if (isSearching) {
      // Flat search results across everything
      h += renderGuidedSearchResults(searchVal);
    } else {
      // Hierarchical browse: Domain → Subtype → Condition
      h += renderGuidedBrowse();
    }

    // Symptoms (always show if condition is selected)
    const symptoms = app.getSymptomsForCondition(s.condition);
    if (symptoms.length) {
      h += `<div class="section-label" style="margin-top:10px">Symptom clues <span class="label-hint">(optional, refines ranking)</span></div>`;
      h += `<div class="chip-group">`;
      symptoms.forEach((sy) => {
        h += `<button type="button" class="chip ${s.symptoms.includes(sy.value) ? 'active' : ''}" data-toggle-list="symptoms" data-value="${sy.value}">${escape(text(sy))}</button>`;
      });
      h += `</div>`;
    }

    return h;
  }

  function renderGuidedSearchResults(query) {
    const q = query.toLowerCase();
    const results = [];

    // Search conditions
    app.data.CONDITIONS.forEach((c) => {
      const label = text(c);
      const summary = text(c.summary);
      const domainLabel = text(app.getDomainMeta(c.domain));
      const subtypeLabel = text(app.getSubtypeMeta(c.subtype));
      const haystack = `${label} ${summary} ${domainLabel} ${subtypeLabel}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          type: 'condition',
          value: c.value,
          label: label,
          path: `${domainLabel} \u203A ${subtypeLabel}`,
          summary: summary,
        });
      }
    });

    // Search subtypes too
    app.config.SUBTYPES.forEach((st) => {
      const label = text(st);
      if (label.toLowerCase().includes(q) && !results.some((r) => r.type === 'subtype' && r.value === st.value)) {
        const domainLabel = text(app.getDomainMeta(st.domain));
        const conditions = app.getConditionOptions(st.domain, st.value);
        results.push({
          type: 'subtype',
          value: st.value,
          domain: st.domain,
          label: label,
          path: domainLabel,
          summary: `${conditions.length} condition${conditions.length !== 1 ? 's' : ''}`,
        });
      }
    });

    let h = `<div class="option-list" style="margin-top:6px">`;
    if (results.length) {
      results.forEach((r) => {
        if (r.type === 'condition') {
          h += `<div class="option-item ${app.state.condition === r.value ? 'selected' : ''}" data-set-field="condition" data-value="${r.value}">
            <div>
              <strong>${escape(r.label)}</strong>
              <span>${escape(r.path)}</span>
            </div>
          </div>`;
        } else {
          // Clicking a subtype sets the domain+subtype and shows its conditions
          h += `<div class="option-item" data-set-guided-subtype="${r.value}" data-guided-domain="${r.domain}">
            <div>
              <strong>${escape(r.label)}</strong>
              <span>${escape(r.path)} &middot; ${escape(r.summary)}</span>
            </div>
            <span class="tag-sm">Area</span>
          </div>`;
        }
      });
    } else {
      h += `<div class="option-item"><span>No matches for "${escape(query)}"</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  function renderGuidedBrowse() {
    const s = app.state;
    let h = '';

    // Step 1: Clinical area (domain)
    h += `<div class="section-label" style="margin-top:8px">1. Clinical area</div>`;
    h += `<div class="chip-group">`;
    app.config.DOMAINS.forEach((d) => {
      h += `<button type="button" class="chip chip-lg ${s.domain === d.value ? 'active' : ''}" data-set-field="domain" data-value="${d.value}">${escape(text(d))}</button>`;
    });
    h += `</div>`;

    if (!s.domain) return h;

    // Step 2: Where / subtype (filtered by selected domain)
    const subtypes = app.getSubtypeOptions(s.domain);
    if (subtypes.length) {
      h += `<div class="section-label" style="margin-top:8px">2. Location / type</div>`;
      h += `<div class="chip-group">`;
      subtypes.forEach((st) => {
        h += `<button type="button" class="chip chip-lg ${s.subtype === st.value ? 'active' : ''}" data-set-field="subtype" data-value="${st.value}">${escape(text(st))}</button>`;
      });
      h += `</div>`;
    }

    if (!s.subtype) return h;

    // Step 3: Specific condition (filtered by domain + subtype)
    const conditions = app.getConditionOptions(s.domain, s.subtype);
    if (conditions.length) {
      h += `<div class="section-label" style="margin-top:8px">3. Condition</div>`;
      h += `<div class="option-list">`;
      conditions.forEach((c) => {
        const summary = text(c.summary);
        h += `<div class="option-item ${s.condition === c.value ? 'selected' : ''}" data-set-field="condition" data-value="${c.value}">
          <div>
            <strong>${escape(text(c))}</strong>
            <span>${escape(summary)}</span>
          </div>
        </div>`;
      });
      h += `</div>`;
    }

    return h;
  }

  function renderTemplateSection() {
    const s = app.state;
    const searchVal = app._searchTemplate || '';
    const filtered = app.templates.filter((t) => {
      if (!searchVal) return true;
      const q = searchVal.toLowerCase();
      return t.name.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)
        || text(app.getConditionMeta(t.condition)).toLowerCase().includes(q);
    });

    let h = '';
    h += `<div class="section-label">Doctor templates</div>`;
    h += `<input type="search" class="search-box" placeholder="Search templates..." data-search-field="templateId" value="${escape(searchVal)}" />`;
    h += `<div class="option-list" style="margin-top:6px">`;
    filtered.forEach((t) => {
      const condLabel = text(app.getConditionMeta(t.condition));
      h += `<div class="option-item ${s.templateId === t.id ? 'selected' : ''}" data-set-field="templateId" data-value="${t.id}">
        <div>
          <strong>${escape(t.name)}</strong>
          <span>${escape(condLabel)} &middot; ${t.ageMin}-${t.ageMax}y &middot; ${t.weightMin}-${t.weightMax}kg</span>
        </div>
      </div>`;
    });
    if (!filtered.length) h += `<div class="option-item"><span>No matches</span></div>`;
    h += `</div>`;

    // Show selected template details
    const tpl = app.getTemplateById(s.templateId);
    if (tpl) {
      h += `<div class="tpl-detail" style="margin-top:8px">`;
      h += `<div class="section-label">Active template</div>`;
      h += `<div class="tpl-detail-card">`;
      h += `<strong>${escape(tpl.name)}</strong>`;
      h += `<div class="tpl-tags">`;
      h += `<span class="tag-sm tag-teal">${escape(text(app.getConditionMeta(tpl.condition)))}</span>`;
      h += `<span class="tag-sm">${tpl.ageMin}-${tpl.ageMax}y</span>`;
      h += `<span class="tag-sm">${tpl.weightMin}-${tpl.weightMax}kg</span>`;
      h += `<span class="tag-sm">${escape(text(app.getRegionMeta(tpl.region)))}</span>`;
      h += `</div>`;
      if (tpl.notes) h += `<p class="tpl-notes">${escape(tpl.notes)}</p>`;
      h += `</div></div>`;
    }

    return h;
  }

  function renderLookupSection() {
    const searchVal = app._searchLookup || '';
    const region = app.state.region || 'CA';
    let h = '';

    h += `<div class="section-label">Formulary browser</div>`;
    h += `<input type="search" class="search-box" placeholder="Search any medication or condition..." data-search-field="lookupSearch" value="${escape(searchVal)}" />`;

    // Group all medications by condition
    const conditionGroups = {};
    app.data.CONDITIONS.forEach((c) => {
      const meds = app.catalog.filter((m) => m.condition === c.value);
      if (meds.length) conditionGroups[c.value] = { meta: c, meds };
    });

    const q = searchVal.toLowerCase();

    h += `<div style="margin-top:8px">`;
    Object.values(conditionGroups).forEach((group) => {
      const condLabel = text(group.meta);
      const domainLabel = text(app.getDomainMeta(group.meta.domain));
      const subtypeLabel = text(app.getSubtypeMeta(group.meta.subtype));

      // Filter meds by search
      const matchedMeds = group.meds.filter((m) => {
        if (!q) return true;
        const label = text(m.labels);
        const condText = condLabel;
        return `${label} ${condText} ${domainLabel} ${subtypeLabel}`.toLowerCase().includes(q);
      });

      if (!matchedMeds.length) return;

      h += `<div class="lookup-group">`;
      h += `<div class="lookup-group-head">`;
      h += `<strong>${escape(condLabel)}</strong>`;
      h += `<span class="tag-sm tag-teal">${escape(domainLabel)}</span>`;
      h += `<span class="tag-sm">${matchedMeds.length} med${matchedMeds.length !== 1 ? 's' : ''}</span>`;
      h += `</div>`;

      matchedMeds.forEach((m) => {
        const regionData = m.regionData[region];
        const price = regionData?.available ? app.formatCurrency(regionData.price, region) : 'n/a';
        const status = !regionData?.available ? 'blocked' : regionData.preferred ? 'eligible' : 'caution';

        h += `<div class="lookup-med-row" data-lookup-med="${m.id}" data-lookup-condition="${group.meta.value}">`;
        h += `<div><strong>${escape(text(m.labels))}</strong><span style="color:var(--muted);font-size:11px;display:block">${escape(text(m.dose))}</span></div>`;
        h += `<div class="lookup-meta">`;
        h += `<span class="tag-sm">${escape(price)}</span>`;
        h += `<span class="status-badge status-${status}">${escape(status)}</span>`;
        h += `</div>`;
        h += `</div>`;
      });

      h += `</div>`;
    });

    if (q && !Object.values(conditionGroups).some((g) => g.meds.some((m) => `${text(m.labels)} ${text(g.meta)}`.toLowerCase().includes(q)))) {
      h += `<div class="option-item"><span>No matches for "${escape(searchVal)}"</span></div>`;
    }

    h += `</div>`;

    // Detail panel for selected lookup med
    if (app._lookupSelectedMed) {
      const med = app.getOptionMeta(app._lookupSelectedMed);
      if (med) {
        const regionData = med.regionData[region];
        h += `<div class="lookup-detail">`;
        h += `<strong style="font-size:14px">${escape(text(med.labels))}</strong>`;
        h += `<div style="color:var(--muted);font-size:12px;margin-top:2px">${escape(text(med.type))}</div>`;
        h += `<div style="color:var(--muted);font-size:12px;margin-top:2px">${escape(text(med.dose))}</div>`;
        h += `<div class="lookup-detail-grid">`;
        h += `<div><strong style="font-size:10px;color:var(--muted);text-transform:uppercase">PROS</strong><ul style="margin:2px 0 0;padding-left:12px;font-size:11px;color:var(--muted)">${(med.pros.en || []).slice(0, 3).map((p) => `<li>${escape(p)}</li>`).join('')}</ul></div>`;
        h += `<div><strong style="font-size:10px;color:var(--muted);text-transform:uppercase">CONS</strong><ul style="margin:2px 0 0;padding-left:12px;font-size:11px;color:var(--muted)">${(med.cons.en || []).slice(0, 3).map((c) => `<li>${escape(c)}</li>`).join('')}</ul></div>`;
        h += `</div>`;
        // Copy pack for this med
        h += `<div style="margin-top:6px">`;
        h += `<div class="rx-block-head"><strong>Rx preview</strong></div>`;
        h += `<div class="rx-block">${escape(`${med.order.medication}\n${text(med.order.sig)}\nDisp: ${med.order.dispense}\nDuration: ${med.order.duration}`)}</div>`;
        h += `</div>`;
        // Market prices
        h += `<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">`;
        app.config.REGIONS.forEach((r) => {
          const rd = med.regionData[r.value];
          if (rd?.available) {
            h += `<span class="tag-sm ${r.value === region ? 'tag-teal' : ''}">${escape(text(r))}: ${escape(app.formatCurrency(rd.price, r.value))}</span>`;
          }
        });
        h += `</div>`;
        h += `</div>`;
      }
    }

    return h;
  }

  function renderSettingsSection() {
    const s = app.state;
    let h = '';

    h += `<div class="settings-divider"></div>`;
    h += `<div class="section-label">Output settings</div>`;
    h += `<div class="field-row">`;
    h += `<div class="field"><span>Region</span><select data-select-field="region">`;
    app.config.REGIONS.forEach((r) => {
      h += `<option value="${r.value}" ${s.region === r.value ? 'selected' : ''}>${escape(text(r))}</option>`;
    });
    h += `</select></div>`;
    h += `<div class="field"><span>EMR format</span><select data-select-field="emrType">`;
    app.config.EMR_TYPES.forEach((e) => {
      h += `<option value="${e.value}" ${s.emrType === e.value ? 'selected' : ''}>${escape(text(e))}</option>`;
    });
    h += `</select></div>`;
    h += `</div>`;

    // Sub-region dropdown
    const subRegions = app.config.SUBREGIONS[s.region] || [];
    if (subRegions.length) {
      h += `<div class="field-row">`;
      h += `<div class="field"><span>Province / State</span><select data-select-field="subRegion">`;
      subRegions.forEach((sr) => {
        h += `<option value="${sr.value}" ${s.subRegion === sr.value ? 'selected' : ''}>${escape(text(sr))}</option>`;
      });
      h += `</select></div>`;
      h += `</div>`;
    }

    h += `<div class="section-label">Policy model</div>`;
    h += `<div class="chip-group">`;
    app.config.POLICY_MODELS.forEach((p) => {
      h += `<button type="button" class="chip ${s.policyModel === p.value ? 'active' : ''}" data-set-field="policyModel" data-value="${p.value}">${escape(text(p))}</button>`;
    });
    h += `</div>`;

    return h;
  }

  // ─── RIGHT COLUMN: OUTPUT ─────────────────────────────────────────

  function renderOutputPanel() {
    if (!app.processedSnapshot) {
      const s = app.state;
      const missing = [];
      if (s.age <= 0) missing.push('Age');
      if (s.weight <= 0) missing.push('Weight');
      if (s.workflowMode === 'guided' && !s.condition) missing.push('Condition');
      if (s.workflowMode === 'template' && !s.templateId) missing.push('Template');
      dom.outputPanel.innerHTML = `<div class="output-empty">
        <div class="section-label">Prescription draft</div>
        <p style="color:var(--muted);font-size:12px;margin:8px 0 0">Complete the form to generate output:</p>
        <ul style="color:var(--muted);font-size:12px;margin:6px 0 0;padding-left:16px">${missing.map((m) => `<li>${escape(m)}</li>`).join('')}</ul>
      </div>`;
      return;
    }

    const ctx = app.processedSnapshot;
    const templateFit = app.getTemplateFit(ctx);
    const options = app.evaluateOptions(ctx);
    const checks = app.globalChecks(options, ctx, templateFit);
    const selected = selectBestOption(options, ctx);

    let h = '';

    // Patient signals strip
    const bits = [
      `${ctx.age}y`, `${ctx.weight}kg`, `eGFR ${ctx.egfr}`,
      text(SEX_OPTIONS.find((o) => o.value === ctx.sex)),
      ctx.workflowMode === 'guided' ? app.currentConditionLabel(ctx) : ctx.templateSnapshot?.name || '-',
    ];
    h += `<div class="review-strip" style="margin-right:44px">${bits.map((b) => `<span class="tag-sm">${escape(b)}</span>`).join('')}</div>`;

    // Template fit warning
    if (templateFit && templateFit.status !== 'eligible' && templateFit.status !== 'info') {
      const lvl = templateFit.status === 'blocked' ? 'danger' : 'caution';
      h += `<div class="check-item level-${templateFit.status}"><div><strong>${escape(templateFit.title)}</strong><p>${escape(templateFit.body)}</p></div></div>`;
    }

    // Build ranked list (all options sorted by score, selected first)
    const RANK_COLORS = ['rank-green', 'rank-amber', 'rank-red'];
    const ranked = selected
      ? [selected, ...options.filter((o) => o.id !== app.selectedOptionId)]
      : options;

    // Primary selection
    if (selected) {
      const copyPack = app.buildCopyPack(selected, ctx);
      h += `<div class="section-label" style="margin-top:6px">Recommended</div>`;
      h += `<div class="primary-card ${RANK_COLORS[0]}">`;
      h += `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px">`;
      h += `<div><strong style="font-size:14px">${escape(selected.label)}</strong><div style="color:var(--muted);font-size:12px">${escape(selected.dosePreview)}</div></div>`;
      h += `<div style="display:flex;align-items:center;gap:4px"><span class="score-badge score-${selected.status}">${selected.score} · ${escape(selected.status)}</span></div>`;
      h += `</div>`;
      h += `<div style="display:flex;gap:4px;margin-bottom:2px"><span class="tag-sm">${escape(selected.price)}</span><span class="tag-sm">${escape(selected.regionData.formulary)}</span></div>`;
      h += `</div>`;

      // Alternatives — directly below primary card
      if (ranked.length > 1) {
        h += `<div class="section-label" style="margin-top:4px">Alternatives</div>`;
        ranked.slice(1).forEach((o, i) => {
          const rankColor = RANK_COLORS[Math.min(i + 1, 2)];
          h += `<div class="alt-row ${rankColor}" data-option="${o.id}"><div><strong>${escape(o.label)}</strong><span>${escape(o.dosePreview)}</span></div><div style="display:flex;align-items:center;gap:4px"><span class="score-badge score-${o.status}">${o.score} · ${escape(o.status)}</span></div></div>`;
        });
      }

      // Rx block
      h += `<div class="rx-block-head"><strong>Rx</strong><button type="button" class="copy-btn" data-copy-block="rx">Copy</button></div>`;
      h += `<div class="rx-block" id="rxText">${escape(copyPack.rx)}</div>`;

      // Pediatric dose calculation note
      if (ctx.age < 13) {
        const med = app.getOptionMeta(selected.id);
        const doseText = text(med.dose);
        const sigText = text(med.order.sig);
        // Extract mg/kg if present in dose or sig text
        const mgKgMatch = (doseText + ' ' + sigText).match(/(\d+(?:\.\d+)?)\s*mg\s*\/\s*kg/i);
        const mgMatch = (doseText + ' ' + sigText).match(/(\d+(?:\.\d+)?)\s*mg/i);
        const ageLabel = ctx.age < 1 ? Math.round(ctx.age * 12) + ' months' : ctx.age + ' years';

        h += `<div class="peds-calc">`;
        h += `<div class="peds-calc-head">Dose calculation (pediatric)</div>`;
        h += `<div class="peds-calc-body">`;
        h += `<div><strong>Patient:</strong> ${escape(ageLabel)}, ${ctx.weight} kg</div>`;

        if (mgKgMatch) {
          const perKg = parseFloat(mgKgMatch[1]);
          const totalDose = Math.round(perKg * ctx.weight * 10) / 10;
          h += `<div><strong>Formula:</strong> ${perKg} mg/kg &times; ${ctx.weight} kg = <strong>${totalDose} mg</strong></div>`;
          h += `<div><strong>Per dose:</strong> ${totalDose} mg</div>`;
        } else if (mgMatch) {
          const adultDose = parseFloat(mgMatch[1]);
          // Use Clark's formula for pediatric adjustment: child dose = (weight / 70) * adult dose
          const pedsDose = Math.round((ctx.weight / 70) * adultDose * 10) / 10;
          h += `<div><strong>Adult dose:</strong> ${adultDose} mg</div>`;
          h += `<div><strong>Clark's formula:</strong> (${ctx.weight} kg &divide; 70 kg) &times; ${adultDose} mg = <strong>${pedsDose} mg</strong></div>`;
          h += `<div style="color:var(--muted);font-size:11px;margin-top:2px">Clark's rule approximation — verify against pediatric formulary</div>`;
        } else {
          h += `<div><strong>Standard dosing:</strong> ${escape(doseText)}</div>`;
          h += `<div style="color:var(--muted);font-size:11px;margin-top:2px">No mg/kg data — verify pediatric dose with formulary</div>`;
        }

        h += `<div><strong>Regimen:</strong> ${escape(doseText)}</div>`;
        h += `</div></div>`;
      }

      // Chart block
      h += `<div class="chart-block-head"><strong>Chart note</strong><button type="button" class="copy-btn" data-copy-block="chart">Copy</button></div>`;
      h += `<div class="chart-block" id="chartText">${escape(copyPack.chart)}</div>`;

      // Pharmacy block
      h += `<div class="pharmacy-block-head"><strong>Pharmacy</strong><button type="button" class="copy-btn" data-copy-block="pharmacy">Copy</button></div>`;
      h += `<div class="pharmacy-block" id="pharmacyText">${escape(copyPack.pharmacy)}</div>`;

      // Copy all
      h += `<button type="button" class="copy-all-btn" data-copy-block="all">Copy All</button>`;

      // Why this (collapsed)
      h += `<details class="fold-section" style="margin-top:6px">`;
      h += `<summary>Why this</summary>`;
      h += `<div class="fold-content">`;
      h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">`;
      h += `<div><strong style="font-size:11px;color:var(--muted)">PROS</strong><ul style="margin:4px 0 0;padding-left:14px;font-size:12px;color:var(--muted)">${selected.pros.slice(0, 3).map((p) => `<li>${escape(p)}</li>`).join('')}</ul></div>`;
      h += `<div><strong style="font-size:11px;color:var(--muted)">CONS</strong><ul style="margin:4px 0 0;padding-left:14px;font-size:12px;color:var(--muted)">${selected.cons.slice(0, 3).map((c) => `<li>${escape(c)}</li>`).join('')}</ul></div>`;
      h += `</div></div></details>`;
    } else {
      h += `<p style="color:var(--muted);font-size:12px">No eligible options for this configuration.</p>`;
    }

    // Checks
    if (checks.length) {
      h += `<details class="fold-section" open>`;
      h += `<summary>Checks (${checks.length})</summary>`;
      h += `<div class="fold-content">`;
      checks.forEach((c) => {
        h += `<div class="check-item level-${c.level}"><div><strong>${escape(c.title)}</strong><p>${escape(c.body)}</p></div></div>`;
      });
      h += `</div></details>`;
    }

    // Market
    if (selected) {
      h += `<details class="fold-section">`;
      h += `<summary>Market</summary>`;
      h += `<div class="fold-content">`;
      app.config.REGIONS.forEach((region) => {
        const market = app.getOptionMeta(selected.id).regionData[region.value];
        const badge = !market.available ? 'Blocked' : market.preferred ? 'Preferred' : 'Available';
        const badgeClass = !market.available ? 'tag-danger' : market.preferred ? 'tag-success' : '';
        h += `<div class="alt-row ${region.value === ctx.region ? 'selected' : ''}"><div><strong>${escape(text(region))}</strong><span>${escape(market.code)}</span></div><div style="text-align:right"><span class="tag-sm ${badgeClass}">${escape(badge)}</span><div style="font-size:12px;font-weight:600;margin-top:2px">${escape(market.available ? app.formatCurrency(market.price, region.value) : '-')}</div></div></div>`;
      });
      h += `</div></details>`;
    }

    // Audit
    h += `<details class="fold-section">`;
    h += `<summary>Audit</summary>`;
    h += `<div class="fold-content" style="font-size:12px;color:var(--muted)">`;
    h += `<div>${escape(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }))}</div>`;
    h += `<div>${escape(ctx.workflowMode === 'guided' ? app.buildPathLabel(ctx) : ctx.templateSnapshot?.name || '-')}</div>`;
    h += `<div>${escape(`${options.length} options evaluated`)}</div>`;
    h += `<div>${escape(`${text(app.getRegionMeta(ctx.region))} · ${text(app.getEmrMeta(ctx.emrType))}`)}</div>`;
    const prefKeys = Object.keys(app._refinePrefs || {}).filter((k) => app._refinePrefs[k]);
    if (prefKeys.length) {
      const prefLabels = {
        triedCurrent: 'Tried current, didn\'t work',
        noPills: 'Can\'t swallow pills / prefers non-oral',
        wantStronger: 'Wants something stronger',
        wantCheaper: 'Cost is a concern',
        wantShorter: 'Wants shorter course',
        sideEffects: 'Had side effects with similar meds',
      };
      h += `<div style="margin-top:4px;border-top:1px solid var(--line);padding-top:4px"><strong>Patient feedback:</strong></div>`;
      prefKeys.forEach((k) => {
        h += `<div>${escape(prefLabels[k] || k)}</div>`;
      });
    }
    h += `</div></details>`;

    // Sponsored alternatives placeholder
    h += `<div class="sponsored-section">`;
    h += `<div class="sponsored-label">Sponsored alternatives</div>`;
    h += `<p class="sponsored-disclaimer">These options are presented by pharmaceutical partners. Tree of Life does not endorse or rank sponsored content.</p>`;
    h += `<div class="sponsored-placeholder">No sponsored content available. This section is reserved for future pharmaceutical partner integrations.</div>`;
    h += `</div>`;

    dom.outputPanel.innerHTML = h;
  }

  function applyRefinePrefs(options, currentSelected, prefs) {
    if (!prefs || !Object.keys(prefs).length) {
      return options.filter((o) => o.status !== 'blocked').map((o) => ({ ...o, _refinedScore: o.score }));
    }

    let pool = options.filter((o) => o.status !== 'blocked');

    // "Tried this one, didn't work" — exclude the current primary
    if (prefs.triedCurrent && currentSelected) {
      pool = pool.filter((o) => o.id !== currentSelected.id);
    }

    // Score adjustments
    pool = pool.map((o) => {
      let adj = o.score;
      const formLower = (o.form || '').toLowerCase();
      const typeLower = (o.type || '').toLowerCase();
      const dosePreviewLower = (o.dosePreview || '').toLowerCase();

      // "Can't swallow pills" — penalize oral tablets/capsules, boost topical/liquid/injection
      if (prefs.noPills) {
        const isOral = /tablet|capsule|oral/.test(formLower) && !/topical|ophthalmic|ointment|cream/.test(formLower);
        if (isOral) adj -= 30;
        else adj += 10;
      }

      // "Wants stronger" — boost escalation, broader-spectrum, second-line
      if (prefs.wantStronger) {
        const isEscalation = /escalation|second-line|broader|dual|alternative/.test(typeLower);
        if (isEscalation) adj += 15;
        else adj -= 5;
      }

      // "Cost concern" — penalize higher-priced
      if (prefs.wantCheaper) {
        const price = o.regionData?.price || 0;
        if (price >= 20) adj -= 15;
        else if (price >= 12) adj -= 5;
        else adj += 5;
      }

      // "Shorter course" — boost single-dose and short schedules
      if (prefs.wantShorter) {
        const isSingleDose = /single dose|once\.?$/.test(dosePreviewLower);
        const isShort = /\b[1-3] day|\b3 day/.test(dosePreviewLower);
        if (isSingleDose) adj += 15;
        else if (isShort) adj += 8;
        else adj -= 5;
      }

      // "Side effects with similar" — penalize same-class alternatives, boost different classes
      if (prefs.sideEffects) {
        adj -= 5;
      }

      return { ...o, _refinedScore: Math.max(0, Math.round(adj)) };
    });

    pool.sort((a, b) => b._refinedScore - a._refinedScore);
    return pool;
  }

  function renderRefineModal() {
    const el = dom.refineModal;
    if (!app._refineOpen || !app.processedSnapshot) {
      el.hidden = true;
      return;
    }
    el.hidden = false;

    const ctx = app.processedSnapshot;
    const options = app.evaluateOptions(ctx);
    const selected = options.find((o) => o.id === app.selectedOptionId) || options[0];
    const prefs = app._refinePrefs;
    const submitted = app._refineSubmitted;

    let h = `<div class="refine-modal-inner">`;
    h += `<div class="refine-modal-head"><h2>Refine prescription</h2><button type="button" class="tour-close" data-refine-close>&times;</button></div>`;

    if (!submitted) {
      // Checklist phase
      h += `<p style="color:var(--muted);font-size:12px;margin:0 0 10px">What did the patient tell you?</p>`;
      const signals = [
        { key: 'triedCurrent', label: 'Tried this one before, didn\'t work' },
        { key: 'noPills', label: 'Can\'t swallow pills / prefers non-oral' },
        { key: 'wantStronger', label: 'Wants something stronger' },
        { key: 'wantCheaper', label: 'Cost is a concern' },
        { key: 'wantShorter', label: 'Wants shorter course / fewer doses' },
        { key: 'sideEffects', label: 'Had side effects with similar meds' },
      ];
      signals.forEach((sig) => {
        h += `<label class="refine-signal-row ${prefs[sig.key] ? 'active' : ''}">`;
        h += `<input type="checkbox" class="refine-check" data-refine-pref="${sig.key}" ${prefs[sig.key] ? 'checked' : ''} />`;
        h += `<div class="refine-info"><strong>${escape(sig.label)}</strong></div>`;
        h += `</label>`;
      });
      h += `<button type="button" class="ghost-button" style="width:100%;margin-top:12px" data-refine-submit>Show updated options</button>`;
    } else {
      // Results phase
      const refined = applyRefinePrefs(options, selected, prefs);
      const activePrefs = Object.keys(prefs).filter((k) => prefs[k]);
      if (activePrefs.length) {
        const prefLabels = { triedCurrent:'Tried current', noPills:'No pills', wantStronger:'Stronger', wantCheaper:'Cheaper', wantShorter:'Shorter course', sideEffects:'Side effects' };
        h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${activePrefs.map((k) => `<span class="tag-sm tag-teal">${escape(prefLabels[k]||k)}</span>`).join('')}</div>`;
      }
      if (refined.length) {
        const RANK_COLORS_R = ['rank-green', 'rank-amber', 'rank-red'];
        refined.forEach((o, i) => {
          const isBest = i === 0;
          const rc = RANK_COLORS_R[Math.min(i, 2)];
          h += `<div class="refine-result-row ${rc} ${isBest ? 'refine-result-best' : ''}" data-refine-pick="${o.id}">`;
          h += `<div><strong>${escape(o.label)}</strong><span style="display:block;color:var(--muted);font-size:11px">${escape(o.dosePreview)}</span>`;
          h += `<div style="display:flex;gap:4px;margin-top:3px"><span class="tag-sm">${escape(o.price)}</span><span class="score-badge score-${o.status}">${o._refinedScore} · ${escape(o.status)}</span></div>`;
          h += `</div>`;
          if (isBest) h += `<span class="tag-sm tag-teal" style="flex-shrink:0">Best fit</span>`;
          h += `</div>`;
        });
      } else {
        h += `<p style="color:var(--muted);font-size:13px">No options remaining after applying preferences.</p>`;
      }
      h += `<div style="display:flex;gap:6px;margin-top:12px">`;
      h += `<button type="button" class="ghost-button ghost-button-secondary" style="flex:1;background:var(--surface-alt);color:var(--ink);border:1px solid var(--line)" data-refine-back>Back to checklist</button>`;
      h += `<button type="button" class="ghost-button" style="flex:1" data-refine-close>Done</button>`;
      h += `</div>`;
    }

    h += `</div>`;
    el.innerHTML = h;
  }

  function selectBestOption(options, ctx) {
    const prefs = app._refinePrefs || {};
    const hasPrefs = Object.keys(prefs).length > 0;

    if (hasPrefs) {
      // Use refined ranking to pick best option
      const currentSel = options.find((o) => o.id === app.selectedOptionId) || options[0];
      const refined = applyRefinePrefs(options, currentSel, prefs);
      if (refined.length) {
        app.selectedOptionId = refined[0].id;
        return options.find((o) => o.id === app.selectedOptionId) || options[0] || null;
      }
    }

    const preferredId = ctx.templateSnapshot?.defaultMedication;
    const isUsable = (o) => o.status !== 'blocked';
    if (!app.selectedOptionId || !options.some((o) => o.id === app.selectedOptionId && isUsable(o))) {
      app.selectedOptionId =
        options.find((o) => o.id === preferredId && isUsable(o))?.id ||
        options.find((o) => isUsable(o))?.id ||
        options[0]?.id || null;
    }
    return options.find((o) => o.id === app.selectedOptionId) || options[0] || null;
  }

  // ─── ANIMATED DEMO ─────────────────────────────────────────────────

  function demoSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function startAnimatedDemo() {
    // Reset to clean state
    Object.assign(app.state, structuredClone(app.config.state));
    app._searchGuided = '';
    app._searchTemplate = '';
    app._searchLookup = '';
    app._lookupSelectedMed = '';
    app._refineOpen = false;
    app._refinePrefs = {};
    app.processedSnapshot = null;
    app.selectedOptionId = null;
    app._demoRunning = true;
    render();

    const spotlight = document.getElementById('demoSpotlight');
    const cursorEl = document.getElementById('demoCursor');
    const labelEl = document.getElementById('demoLabel');

    // Start cursor at center of screen
    cursorEl.style.transition = 'none';
    spotlight.style.transition = 'none';
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    cursorEl.style.left = cx + 'px';
    cursorEl.style.top = cy + 'px';
    spotlight.style.left = (cx - 20) + 'px';
    spotlight.style.top = (cy - 20) + 'px';
    spotlight.style.width = '40px';
    spotlight.style.height = '40px';
    void cursorEl.offsetHeight;
    cursorEl.style.transition = '';
    spotlight.style.transition = '';

    spotlight.hidden = false;
    cursorEl.hidden = false;
    labelEl.hidden = false;

    const steps = [
      { sel: '[data-patient-preset="adult-f"]', text: 'Step 1 — Select patient preset' },
      { sel: '[data-set-field="domain"][data-value="infection"]', text: 'Step 2 — Choose clinical area' },
      { sel: '[data-set-field="subtype"][data-value="urinary"]', text: 'Step 3 — Narrow to subtype' },
      { sel: '[data-set-field="condition"][data-value="cystitis"]', text: 'Step 4 — Pick the condition' },
      { sel: '.primary-card', text: 'Step 5 — Top medication ranked', noClick: true, wait: 2500 },
      { sel: '[data-copy-block="all"]', text: 'Step 6 — Copy for EMR paste', wait: 2000 },
    ];

    await demoSleep(500);

    for (let i = 0; i < steps.length; i++) {
      if (!app._demoRunning) break;
      const step = steps[i];
      const el = document.querySelector(step.sel);
      if (!el) continue;

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await demoSleep(250);

      const rect = el.getBoundingClientRect();
      const pad = 8;

      spotlight.style.left = (rect.left - pad) + 'px';
      spotlight.style.top = (rect.top - pad) + 'px';
      spotlight.style.width = (rect.width + pad * 2) + 'px';
      spotlight.style.height = (rect.height + pad * 2) + 'px';

      cursorEl.style.left = (rect.left + rect.width * 0.3) + 'px';
      cursorEl.style.top = (rect.top + rect.height * 0.5) + 'px';

      labelEl.textContent = step.text;
      const lx = rect.right + 16;
      const ly = rect.top + rect.height / 2 - 14;
      labelEl.style.left = Math.min(lx, window.innerWidth - 280) + 'px';
      labelEl.style.top = Math.max(ly, 8) + 'px';

      await demoSleep(600);
      if (!app._demoRunning) break;

      if (!step.noClick) {
        cursorEl.classList.add('demo-clicking');
        await demoSleep(150);
        el.click();
        cursorEl.classList.remove('demo-clicking');
      }

      await demoSleep(step.wait || 1200);
    }

    spotlight.hidden = true;
    cursorEl.hidden = true;
    labelEl.hidden = true;
    app._demoRunning = false;
  }

  // ─── RENDER ALL ───────────────────────────────────────────────────

  function render() {
    const focused = document.activeElement;
    const focusField = focused?.dataset?.searchField || focused?.dataset?.numberField || null;
    const cursorPos = focused?.selectionStart ?? null;

    ensureState();
    autoProcess();
    renderPatientPanel();
    renderClinicalPanel();
    renderOutputPanel();
    // Show refine button only when output is live
    dom.refineBtn.classList.toggle('visible', !!app.processedSnapshot);
    renderRefineModal();

    if (focusField) {
      const el = document.querySelector(`[data-search-field="${focusField}"]`) ||
                 document.querySelector(`[data-number-field="${focusField}"]`);
      if (el) {
        el.focus();
        if (cursorPos !== null && el.setSelectionRange) {
          try { el.setSelectionRange(cursorPos, cursorPos); } catch {}
        }
      }
    }
  }

  function ensureState() {
    if (!SEX_OPTIONS.some((o) => o.value === app.state.sex)) app.state.sex = 'female';
    if (app.state.sex === 'male') app.state.pregnancy = 'na';
    app.state.patientPresetId ||= '';
    app._searchGuided ||= '';
    app._searchTemplate ||= '';
    app._searchLookup ||= '';
    if (app._childBucket === undefined) app._childBucket = null;
    app._lookupSelectedMed ||= '';
    if (app._refineOpen === undefined) app._refineOpen = false;
    app._refinePrefs ||= {};
    if (app._refineSubmitted === undefined) app._refineSubmitted = false;
    app.ensureGuidedSelections();
    app.ensureTemplateSelection();
  }

  // ─── STATE UPDATES ────────────────────────────────────────────────

  function updateState(field, value) {
    if (field === 'workflowMode') {
      app.state.workflowMode = value;
      if (value === 'template') app.ensureTemplateSelection();
      if (value === 'lookup') { app._lookupSelectedMed = ''; app._searchLookup = ''; }
    } else if (field === 'domain') {
      app.state.domain = value;
      app.ensureGuidedSelections();
    } else if (field === 'subtype') {
      app.state.subtype = value;
      app.ensureGuidedSelections();
    } else if (field === 'condition') {
      app.applyConditionToState(value);
      app._searchGuided = '';
    } else if (field === 'templateId') {
      app.state.templateId = value;
      app.applyTemplateToState(app.getTemplateById(value), { syncMarket: false });
    } else if (field === 'sex') {
      app.state.sex = value;
      app.state.patientPresetId = '';
      if (value === 'male') app.state.pregnancy = 'na';
      if (value === 'female' && app.state.pregnancy === 'na') app.state.pregnancy = 'no';
    } else {
      app.state[field] = value;
      // Reset subRegion when region changes
      if (field === 'region') {
        const subs = app.config.SUBREGIONS[value] || [];
        app.state.subRegion = subs[0]?.value || '';
      }
    }
    render();
  }

  function applyPatientPreset(id) {
    const p = PATIENT_PRESETS.find((x) => x.id === id);
    if (!p) return;
    app.state.patientPresetId = p.id;
    app.state.sex = p.sex;
    app.state.pregnancy = p.pregnancy;
    if (p.isChild) {
      // Show age bucket picker — don't set age/weight yet
      app._childBucket = null;
      app.state.age = 0;
      app.state.weight = 0;
    } else {
      app._childBucket = null;
      app.state.age = p.age;
      app.state.weight = p.weight;
    }
    render();
  }

  function applyChildBucket(bucketId) {
    const b = CHILD_AGE_BUCKETS.find((x) => x.id === bucketId);
    if (!b) return;
    app._childBucket = b.id;
    app.state.age = b.age;
    app.state.weight = b.weight;
    render();
  }

  function applyEgfrPreset(id) {
    const p = EGFR_PRESETS.find((x) => x.id === id);
    if (!p) return;
    app.state.egfr = p.value;
    render();
  }

  async function copyBlock(kind) {
    let content = '';
    if (kind === 'rx') content = document.getElementById('rxText')?.textContent || '';
    else if (kind === 'chart') content = document.getElementById('chartText')?.textContent || '';
    else if (kind === 'pharmacy') content = document.getElementById('pharmacyText')?.textContent || '';
    else if (kind === 'all') {
      content = [
        document.getElementById('rxText')?.textContent || '',
        document.getElementById('chartText')?.textContent || '',
        document.getElementById('pharmacyText')?.textContent || '',
      ].join('\n\n---\n\n');
    }
    try {
      await navigator.clipboard.writeText(content);
      const btn = dom.outputPanel.querySelector(`[data-copy-block="${kind}"]`);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = orig; }, 1000);
      }
    } catch { /* fallback: user can select text */ }
  }

  function loadScenario(id) {
    const scenario = app.data.SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    Object.assign(app.state, structuredClone(scenario.state));
    app.state.patientPresetId = '';
    app._searchGuided = '';
    app._searchTemplate = '';
    app._searchLookup = '';
    app._lookupSelectedMed = '';
    app._refineOpen = false;
    app._refinePrefs = {};
    app._childBucket = null;
    render();
  }

  // ─── TOUR ─────────────────────────────────────────────────────────

  function closeTour() {
    app.tourState.open = false;
    dom.tourOverlay.hidden = true;
    dom.tourCard.hidden = true;
  }

  function renderTourStep() {
    if (!app.tourState.open) return;
    const steps = [
      { title: 'Dashboard layout', body: 'Patient on the left, condition in the center, output on the right. Everything visible at once.', tryText: 'Click Demo to load a sample case instantly.' },
      { title: 'Fast patient input', body: 'Preset buttons fill demographics in one click. Edit any field to override.', tryText: 'Try clicking Adult F then change the age.' },
      { title: 'Condition search', body: 'Type to search conditions directly. No drill-down needed. Or switch to Template mode for saved presets.', tryText: 'Type "cystitis" in the condition search box.' },
      { title: 'Live output', body: 'The right panel updates automatically as you fill fields. Copy Rx, Chart, or Pharmacy with one click.', tryText: 'Click Copy All to grab everything at once.' },
    ];
    const step = steps[app.tourState.index];
    if (!step) return closeTour();
    dom.tourOverlay.hidden = false;
    dom.tourCard.hidden = false;
    dom.tourStepBadge.textContent = `Step ${app.tourState.index + 1} / ${steps.length}`;
    dom.tourTitle.textContent = step.title;
    dom.tourBody.textContent = step.body;
    dom.tourTry.textContent = step.tryText;
    dom.tourBackBtn.disabled = app.tourState.index === 0;
    dom.tourNextBtn.textContent = app.tourState.index === steps.length - 1 ? 'Finish' : 'Next';
  }

  // ─── EVENT BINDING ────────────────────────────────────────────────

  function bindColumn(el) {
    el.addEventListener('click', (e) => {
      const preset = e.target.closest('[data-patient-preset]');
      if (preset) return applyPatientPreset(preset.dataset.patientPreset);

      const childBucket = e.target.closest('[data-child-bucket]');
      if (childBucket) return applyChildBucket(childBucket.dataset.childBucket);

      const egfr = e.target.closest('[data-egfr-preset]');
      if (egfr) return applyEgfrPreset(egfr.dataset.egfrPreset);

      const setBtn = e.target.closest('[data-set-field]');
      if (setBtn) return updateState(setBtn.dataset.setField, setBtn.dataset.value);

      const toggleBtn = e.target.closest('[data-toggle-list]');
      if (toggleBtn) {
        const field = toggleBtn.dataset.toggleList;
        const list = app.state[field];
        app.state[field] = list.includes(toggleBtn.dataset.value)
          ? list.filter((v) => v !== toggleBtn.dataset.value)
          : [...list, toggleBtn.dataset.value];
        return render();
      }

      const copyBtn = e.target.closest('[data-copy-block]');
      if (copyBtn) return copyBlock(copyBtn.dataset.copyBlock);

      const optionBtn = e.target.closest('[data-option]');
      if (optionBtn) {
        app.selectedOptionId = optionBtn.dataset.option;
        return render();
      }

      const lookupMed = e.target.closest('[data-lookup-med]');
      if (lookupMed) {
        app._lookupSelectedMed = app._lookupSelectedMed === lookupMed.dataset.lookupMed ? '' : lookupMed.dataset.lookupMed;
        return render();
      }

      const guidedSub = e.target.closest('[data-set-guided-subtype]');
      if (guidedSub) {
        app.state.domain = guidedSub.dataset.guidedDomain;
        app.state.subtype = guidedSub.dataset.setGuidedSubtype;
        app._searchGuided = '';
        app.ensureGuidedSelections();
        return render();
      }
    });

    el.addEventListener('input', (e) => {
      const searchField = e.target.dataset.searchField;
      if (searchField === 'guidedSearch') {
        app._searchGuided = e.target.value;
        return render();
      }
      if (searchField === 'templateId') {
        app._searchTemplate = e.target.value;
        return render();
      }
      if (searchField === 'lookupSearch') {
        app._searchLookup = e.target.value;
        app._lookupSelectedMed = '';
        return render();
      }
      const numField = e.target.dataset.numberField;
      if (numField) {
        let val = Number(e.target.value || 0);
        if (numField === 'age') {
          // Enforce preset age limits
          if (app.state.patientPresetId === 'adult-f' || app.state.patientPresetId === 'adult-m') {
            val = Math.max(val, 13);
          } else if (app.state.patientPresetId === 'older') {
            val = Math.max(val, 60);
          } else if (app.state.patientPresetId === 'child') {
            val = Math.min(val, 12);
          }
        }
        app.state[numField] = val;
        if (numField === 'age' || numField === 'weight') app.state.patientPresetId = app.state.patientPresetId || '';
        return render();
      }
      const selectField = e.target.dataset?.selectField;
      if (selectField) {
        app.state[selectField] = e.target.value;
        return render();
      }
    });

    el.addEventListener('change', (e) => {
      const selectField = e.target.dataset?.selectField;
      if (selectField) {
        app.state[selectField] = e.target.value;
        return render();
      }
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────────

  function init() {
    dom.patientPanel = document.getElementById('patientPanel');
    dom.clinicalPanel = document.getElementById('clinicalPanel');
    dom.outputPanel = document.getElementById('outputPanel');
    dom.loadScenarioBtn = document.getElementById('loadScenarioBtn');
    dom.startTourBtn = document.getElementById('startTourBtn');
    dom.tourOverlay = document.getElementById('tourOverlay');
    dom.tourCard = document.getElementById('tourCard');
    dom.tourStepBadge = document.getElementById('tourStepBadge');
    dom.tourTitle = document.getElementById('tourTitle');
    dom.tourBody = document.getElementById('tourBody');
    dom.tourTry = document.getElementById('tourTry');
    dom.tourBackBtn = document.getElementById('tourBackBtn');
    dom.tourNextBtn = document.getElementById('tourNextBtn');
    dom.tourCloseBtn = document.getElementById('tourCloseBtn');

    dom.refineBtn = document.getElementById('refineBtn');
    dom.refineModal = document.getElementById('refineModal');

    bindColumn(dom.patientPanel);
    bindColumn(dom.clinicalPanel);
    bindColumn(dom.outputPanel);

    // Fixed refine button
    dom.refineBtn.addEventListener('click', () => {
      app._refineOpen = true;
      app._refineSubmitted = false;
      app._refinePrefs = {};
      renderRefineModal();
    });

    // Refine modal events
    dom.refineModal.addEventListener('click', (e) => {
      const close = e.target.closest('[data-refine-close]');
      if (close) { app._refineOpen = false; renderRefineModal(); render(); return; }

      const submit = e.target.closest('[data-refine-submit]');
      if (submit) {
        app._refineSubmitted = true;
        // Auto-select best refined option and update output
        const sCtx = app.processedSnapshot;
        if (sCtx) {
          const sOpts = app.evaluateOptions(sCtx);
          const sSel = sOpts.find(o => o.id === app.selectedOptionId) || sOpts[0];
          const refined = applyRefinePrefs(sOpts, sSel, app._refinePrefs);
          app.selectedOptionId = refined[0]?.id || null;
        }
        render();
        return;
      }

      const back = e.target.closest('[data-refine-back]');
      if (back) { app._refineSubmitted = false; renderRefineModal(); return; }

      const pref = e.target.closest('[data-refine-pref]');
      if (pref) {
        const key = pref.dataset.refinePref;
        app._refinePrefs[key] = !app._refinePrefs[key];
        if (!app._refinePrefs[key]) delete app._refinePrefs[key];
        renderRefineModal();
        return;
      }

      const pick = e.target.closest('[data-refine-pick]');
      if (pick) {
        app.selectedOptionId = pick.dataset.refinePick;
        app._refineOpen = false;
        renderRefineModal();
        render();
        return;
      }
    });

    dom.newCaseBtn = document.getElementById('newCaseBtn');
    dom.newCaseBtn.addEventListener('click', () => {
      Object.assign(app.state, structuredClone(app.config.state));
      app._searchGuided = '';
      app._searchTemplate = '';
      app._searchLookup = '';
      app._lookupSelectedMed = '';
      app._refineOpen = false;
      app._refinePrefs = {};
      app._childBucket = null;
      app.processedSnapshot = null;
      app.selectedOptionId = null;
      render();
    });

    dom.loadScenarioBtn.addEventListener('click', () => {
      if (app._demoRunning) { app._demoRunning = false; return; }
      startAnimatedDemo();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && app._demoRunning) {
        app._demoRunning = false;
        document.getElementById('demoSpotlight').hidden = true;
        document.getElementById('demoCursor').hidden = true;
        document.getElementById('demoLabel').hidden = true;
      }
    });

    dom.startTourBtn.addEventListener('click', () => {
      app.tourState.open = true;
      app.tourState.index = 0;
      renderTourStep();
    });

    dom.tourBackBtn.addEventListener('click', () => {
      if (app.tourState.index > 0) { app.tourState.index -= 1; renderTourStep(); }
    });

    dom.tourNextBtn.addEventListener('click', () => {
      app.tourState.index += 1;
      renderTourStep();
    });

    dom.tourCloseBtn.addEventListener('click', () => closeTour());
    dom.tourOverlay.addEventListener('click', () => closeTour());

    render();
  }

  window.TOLUI = { init, render };
  document.addEventListener('DOMContentLoaded', init);
})();
