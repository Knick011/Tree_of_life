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

  // ─── RECENTLY USED CONDITIONS ─────────────────────────────────────
  const RECENT_KEY = 'tol_recent_conditions';
  const MAX_RECENT = 6;

  function getRecentConditions() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  function addRecentCondition(condValue) {
    if (!condValue) return;
    let recents = getRecentConditions().filter(c => c !== condValue);
    recents.unshift(condValue);
    if (recents.length > MAX_RECENT) recents = recents.slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recents)); } catch {}
  }

  // ─── TOAST NOTIFICATIONS ──────────────────────────────────────────
  let _toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('visible'), 2000);
  }

  // ─── DOMAIN FILTERING BY PATIENT CONTEXT ────────────────────────
  // Returns which domains are irrelevant for the current patient
  function getExcludedDomains() {
    const s = app.state;
    const excluded = new Set();

    // Male patients: exclude women's health & obstetrics
    if (s.sex === 'male') {
      excluded.add('womens-health');
      excluded.add('obstetrics');
    }

    // Children (age < 13 or child preset): exclude certain adult domains
    const isChild = s.patientPresetId === 'child' || (s.age > 0 && s.age < 13);
    if (isChild) {
      excluded.add('womens-health');
      excluded.add('obstetrics');
      excluded.add('urology');         // prostate/ED not relevant
      excluded.add('geriatrics');      // geriatrics not relevant
    }

    // Non-child: exclude pediatrics domain
    if (!isChild && s.age >= 13) {
      excluded.add('pediatrics');
    }

    // Men: exclude gynecology subtype but don't block the whole STI domain
    // Older adults: deprioritize pediatrics (already handled above)

    // Pregnancy = yes: exclude domains with mostly contraindicated content
    // (handled by rules, not exclusion — keep domains visible)

    return excluded;
  }

  // Check if current domain selection conflicts with patient context
  function isDomainConflict() {
    const excluded = getExcludedDomains();
    return app.state.domain && excluded.has(app.state.domain);
  }

  // Get age validation state for current preset
  function getAgeValidation() {
    const s = app.state;
    const preset = s.patientPresetId;
    const age = s.age;

    if (!preset || age <= 0) return null;

    if ((preset === 'adult-f' || preset === 'adult-m') && age < 13) {
      return { error: true, msg: 'Age must be 13+ for adult preset' };
    }
    if (preset === 'older' && age < 60) {
      return { error: true, msg: 'Age must be 60+ for older preset' };
    }
    if (preset === 'child' && age > 12) {
      return { error: true, msg: 'Age must be 12 or under for child preset' };
    }
    return null;
  }

  function isReady() {
    const s = app.state;
    if (s.workflowMode === 'lookup' || s.workflowMode === 'scores') return false;
    if (s.age <= 0 || s.weight <= 0) return false;
    if (s.workflowMode === 'guided' && !s.condition) return false;
    if (s.workflowMode === 'template' && !s.templateId) return false;
    if (!s.region || !s.emrType || !s.policyModel) return false;
    if (getAgeValidation()?.error) return false;
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
    const ageVal = getAgeValidation();

    h += `<div class="section-label">Demographics</div>`;
    h += `<div class="field-row">`;

    // Age field with stepper and validation
    h += `<div class="field">`;
    if (ageDisabled) {
      const bucket = CHILD_AGE_BUCKETS.find(b => b.id === app._childBucket);
      h += `<span>Age <span style="font-weight:400;color:var(--teal)">(${escape(bucket?.label || 'range')})</span></span>`;
      h += `<div class="stepper-input disabled"><span class="stepper-display">${escape(bucket?.label || '-')}</span></div>`;
    } else {
      h += `<span>Age${ageVal ? ` <span class="field-error-hint">${escape(ageVal.msg)}</span>` : ''}</span>`;
      h += `<div class="stepper-input${ageVal?.error ? ' stepper-error' : ''}">`;
      h += `<button type="button" class="stepper-btn" data-stepper="age" data-dir="-1" ${s.age <= 0 ? 'disabled' : ''}>-</button>`;
      h += `<input type="text" inputMode="numeric" pattern="[0-9]*" class="stepper-value" value="${s.age || ''}" placeholder="0" data-number-field="age" />`;
      h += `<button type="button" class="stepper-btn" data-stepper="age" data-dir="1">+</button>`;
      h += `</div>`;
    }
    h += `</div>`;

    // Weight field with stepper
    h += `<div class="field">`;
    h += `<span>Weight (kg)</span>`;
    h += `<div class="stepper-input">`;
    h += `<button type="button" class="stepper-btn" data-stepper="weight" data-dir="-1" ${s.weight <= 0 ? 'disabled' : ''}>-</button>`;
    h += `<input type="text" inputMode="numeric" pattern="[0-9]*" class="stepper-value" value="${s.weight || ''}" placeholder="0" data-number-field="weight" />`;
    h += `<button type="button" class="stepper-btn" data-stepper="weight" data-dir="1">+</button>`;
    h += `</div>`;
    h += `</div>`;

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
    h += `<button type="button" class="${s.workflowMode === 'scores' ? 'active' : ''}" data-set-field="workflowMode" data-value="scores">Scores</button>`;
    h += `</div>`;

    if (s.workflowMode === 'guided') {
      h += renderGuidedSection();
    } else if (s.workflowMode === 'template') {
      h += renderTemplateSection();
    } else if (s.workflowMode === 'lookup') {
      h += renderLookupSection();
    } else if (s.workflowMode === 'scores') {
      h += renderScoresSection();
    }

    if (s.workflowMode !== 'lookup' && s.workflowMode !== 'scores') {
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
    h += `<div class="section-label">Search or browse <span class="kbd-hint"><kbd class="kbd">Ctrl</kbd>+<kbd class="kbd">K</kbd></span></div>`;
    h += `<input type="search" class="search-box" placeholder="Search any condition, area, or keyword..." data-search-field="guidedSearch" value="${escape(searchVal)}" />`;

    // Recently used conditions
    if (!isSearching && !s.condition) {
      const recents = getRecentConditions();
      if (recents.length) {
        h += `<div class="section-label" style="margin-top:6px">Recent</div>`;
        h += `<div class="recent-conditions">`;
        recents.forEach(cv => {
          const meta = app.getConditionMeta(cv);
          if (meta) h += `<button type="button" class="recent-chip" data-set-field="condition" data-value="${cv}">${escape(text(meta))}</button>`;
        });
        h += `</div>`;
      }
    }

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
    const excluded = getExcludedDomains();
    const results = [];

    // Search conditions (filtered by patient context)
    app.data.CONDITIONS.forEach((c) => {
      if (excluded.has(c.domain)) return;
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

    // Search subtypes too (filtered by patient context)
    app.config.SUBTYPES.forEach((st) => {
      if (excluded.has(st.domain)) return;
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
    const excluded = getExcludedDomains();
    let h = '';

    // Step 1: Clinical area (domain) — filtered by patient context
    h += `<div class="section-label" style="margin-top:8px">1. Clinical area</div>`;
    h += `<div class="chip-group">`;
    app.config.DOMAINS.forEach((d) => {
      const isExcluded = excluded.has(d.value);
      if (isExcluded) return; // hide irrelevant domains entirely
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

  // ─── SCORES TAB ──────────────────────────────────────────────────

  function renderScoresSection() {
    const scores = window.TOLScores;
    if (!scores) return '<div class="section-label">Scores module not loaded</div>';

    const searchVal = app._searchScores || '';
    const activeId = app._activeScoreId;
    let h = '';

    // If a calculator is active, show its form
    if (activeId) {
      const calc = scores.getCalculator(activeId);
      if (calc) {
        h += renderScoreCalculator(calc);
        return h;
      }
    }

    // Calculator list
    h += `<div class="section-label">Clinical Decision Support</div>`;
    h += `<input type="search" class="search-box" placeholder="Search calculators..." data-search-field="scoresSearch" value="${escape(searchVal)}" />`;

    const filtered = scores.search(searchVal);

    // Group by category
    const grouped = {};
    filtered.forEach(c => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });

    h += `<div class="scores-list" style="margin-top:8px">`;
    scores.CATEGORIES.forEach(cat => {
      const calcs = grouped[cat];
      if (!calcs || !calcs.length) return;

      h += `<div class="scores-category">`;
      h += `<div class="scores-category-head">${escape(cat)} <span class="tag-sm">${calcs.length}</span></div>`;
      calcs.forEach(c => {
        h += `<div class="score-card" data-open-score="${c.id}">`;
        h += `<div class="score-card-name">${c.name}</div>`;
        h += `<div class="score-card-desc">${escape(c.desc)}</div>`;
        h += `</div>`;
      });
      h += `</div>`;
    });

    if (!filtered.length) {
      h += `<div class="option-item"><span>No calculators match "${escape(searchVal)}"</span></div>`;
    }
    h += `</div>`;
    return h;
  }

  function renderScoreCalculator(calc) {
    const scores = window.TOLScores;
    const vals = app._scoreValues || {};
    let h = '';

    // Back button + title
    h += `<div class="score-header">`;
    h += `<button type="button" class="score-back-btn" data-score-back>`;
    h += `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back`;
    h += `</button>`;
    h += `<span class="tag-sm tag-teal">${escape(calc.category)}</span>`;
    h += `</div>`;
    h += `<div class="score-title">${calc.name}</div>`;
    h += `<div class="score-desc">${escape(calc.desc)}</div>`;

    // Scale header (for PHQ-9, GAD-7, IPSS etc.)
    if (calc.scaleHeader) {
      h += `<div class="score-scale-legend">`;
      calc.scaleHeader.forEach(lbl => {
        h += `<span class="score-scale-label">${escape(lbl)}</span>`;
      });
      h += `</div>`;
    }

    // Fields
    h += `<div class="score-fields">`;
    calc.fields.forEach(f => {
      const val = vals[f.id];

      if (f.type === 'bool') {
        h += `<label class="score-bool-row">`;
        h += `<input type="checkbox" data-score-bool="${f.id}" ${val ? 'checked' : ''} />`;
        h += `<span>${escape(f.label)}</span>`;
        h += `</label>`;
      } else if (f.type === 'select') {
        h += `<div class="score-field-row">`;
        h += `<span class="score-field-label">${escape(f.label)}</span>`;
        h += `<select data-score-select="${f.id}">`;
        h += `<option value="">-- Select --</option>`;
        f.options.forEach(o => {
          h += `<option value="${o.value}" ${String(val) === String(o.value) ? 'selected' : ''}>${escape(o.label)}</option>`;
        });
        h += `</select>`;
        h += `</div>`;
      } else if (f.type === 'number') {
        h += `<div class="score-field-row">`;
        h += `<span class="score-field-label">${escape(f.label)}</span>`;
        h += `<input type="number" class="score-number-input" data-score-number="${f.id}" value="${val !== undefined ? val : ''}" placeholder="${f.placeholder || ''}" min="${f.min || ''}" max="${f.max || ''}" step="${f.step || 1}" />`;
        h += `</div>`;
      } else if (f.type === 'scale') {
        h += `<div class="score-scale-row">`;
        h += `<span class="score-field-label">${escape(f.label)}</span>`;
        h += `<div class="score-scale-btns">`;
        for (let i = 0; i <= f.max; i++) {
          const scaleLabel = f.scaleLabels ? f.scaleLabels[i] : '';
          h += `<button type="button" class="score-scale-btn ${Number(val) === i ? 'active' : ''}" data-score-scale="${f.id}" data-score-scale-val="${i}" title="${escape(scaleLabel || String(i))}">${i}</button>`;
        }
        h += `</div>`;
        h += `</div>`;
      }
    });
    h += `</div>`;

    // Calculate button
    h += `<button type="button" class="score-calculate-btn" data-score-calculate>Calculate</button>`;

    // Results (if calculated)
    if (app._scoreResult) {
      const r = app._scoreResult;
      h += `<div class="score-result score-result-${r.risk || 'none'}">`;
      h += `<div class="score-result-head">`;
      if (r.score !== null && r.score !== undefined) {
        h += `<div class="score-result-number">${r.score}${r.unit ? ' ' + r.unit : ''}${r.max ? ' / ' + r.max : ''}</div>`;
      }
      h += `<div class="score-result-label">${escape(r.label)}</div>`;
      h += `</div>`;
      h += `<div class="score-result-interp">${escape(r.interpretation)}</div>`;

      if (r.meds && r.meds.length) {
        h += `<div class="score-meds">`;
        h += `<div class="score-meds-title">Medication Recommendations</div>`;
        r.meds.forEach(m => {
          h += `<div class="score-med-card">`;
          h += `<div class="score-med-name">${escape(m.name)}</div>`;
          h += `<div class="score-med-dose">${escape(m.dose)}</div>`;
          h += `<div class="score-med-rationale">${escape(m.rationale)}</div>`;
          h += `</div>`;
        });
        h += `</div>`;
      }
      h += `</div>`;
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

    // Condition summary card
    if (ctx.workflowMode === 'guided' && ctx.condition) {
      const condMeta = app.getConditionMeta(ctx.condition);
      if (condMeta) {
        const condLabel = text(condMeta);
        const condSummary = text(condMeta.summary);
        const domainLabel = text(app.getDomainMeta(condMeta.domain));
        h += `<div class="condition-summary-card"><strong>${escape(condLabel)}</strong><p>${escape(domainLabel)} &bull; ${escape(condSummary)}</p></div>`;
      }
    }

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

      // Copy for EMR (structured JSON for browser extension)
      h += `<button type="button" class="copy-emr-btn" data-copy-block="emr">Copy for EMR</button>`;

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

  // ─── HELP SYSTEM ──────────────────────────────────────────────────

  const HELP_FEATURES = [
    {
      id: 'patient-presets',
      title: 'Patient Presets',
      desc: 'One-click patient profiles to set age, weight, and sex instantly.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      setup: () => {},
      steps: [
        { sel: '.preset-row', text: 'Click any preset to fill patient demographics', noClick: true, wait: 2000 },
        { sel: '[data-patient-preset="adult-f"]', text: 'Adult F — sets age 34, weight 68 kg, female', wait: 1500 },
        { sel: '[data-patient-preset="child"]', text: 'Child — opens age range picker for pediatric dosing', wait: 1500 },
        { sel: '[data-patient-preset="older"]', text: 'Older — sets age 74, triggers geriatric checks', wait: 1500 },
      ],
    },
    {
      id: 'guided-prescribing',
      title: 'Guided Prescribing',
      desc: 'Narrow from clinical area to specific condition in 3 steps.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
      },
      steps: [
        { sel: '[data-set-field="workflowMode"][data-value="guided"]', text: 'Guided mode — drill down step by step', wait: 1200 },
        { sel: '[data-set-field="domain"][data-value="infection"]', text: '1. Pick a clinical area (e.g. Infection)', wait: 1500 },
        { sel: '[data-set-field="subtype"][data-value="urinary"]', text: '2. Narrow to a subtype (e.g. Urinary)', wait: 1500 },
        { sel: '[data-set-field="condition"][data-value="cystitis"]', text: '3. Select the specific condition', wait: 1500 },
        { sel: '.primary-card', text: 'The best medication is ranked and shown', noClick: true, wait: 2000 },
      ],
    },
    {
      id: 'condition-search',
      title: 'Condition Search',
      desc: 'Type any keyword to jump directly to a condition without browsing.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
        app.state.workflowMode = 'guided';
        app.state.domain = '';
        app.state.subtype = '';
        app.state.condition = '';
        render();
      },
      steps: [
        { sel: '[data-search-field="guidedSearch"]', text: 'Type a keyword like "hypertension" or "gout"', noClick: true, wait: 2000 },
        { sel: '[data-search-field="guidedSearch"]', text: 'Results appear instantly — click to select', typeText: 'gout', wait: 2500 },
      ],
    },
    {
      id: 'children-dosing',
      title: 'Pediatric Dosing',
      desc: 'Select a child age range and see dose calculations with real math.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z"/><rect x="3" y="10" width="18" height="12" rx="2"/></svg>',
      setup: () => {},
      steps: [
        { sel: '[data-patient-preset="child"]', text: 'Select Child preset', wait: 1200 },
        { sel: '[data-child-bucket="toddler"]', text: 'Pick an age range — sets age and weight', wait: 1500 },
        { sel: '[data-set-field="domain"][data-value="infection"]', text: 'Choose a clinical area', wait: 1200 },
        { sel: '[data-set-field="subtype"][data-value="urinary"]', text: 'Narrow to subtype', wait: 1200 },
        { sel: '[data-set-field="condition"][data-value="cystitis"]', text: 'Select condition', wait: 1200 },
        { sel: '.peds-calc', text: 'Dose calculation shown with Clark\'s formula', noClick: true, wait: 3000 },
      ],
    },
    {
      id: 'refine',
      title: 'Refine Prescription',
      desc: 'Tell the system what the patient said to re-rank medications.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h18M3 12h12M3 20h6"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
        app.state.domain = 'infection';
        app.state.subtype = 'urinary';
        app.applyConditionToState('cystitis');
        render();
      },
      steps: [
        { sel: '#refineBtn', text: 'Click the filter button to open Refine', wait: 1500 },
        { sel: '.refine-modal-inner', text: 'Check what the patient told you — options re-rank', noClick: true, wait: 3000 },
      ],
    },
    {
      id: 'copy-output',
      title: 'Copy & EMR Export',
      desc: 'Copy Rx, chart note, or structured JSON for EMR auto-fill.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
        app.state.domain = 'infection';
        app.state.subtype = 'urinary';
        app.applyConditionToState('cystitis');
        render();
      },
      steps: [
        { sel: '[data-copy-block="rx"]', text: 'Copy just the Rx text', noClick: true, wait: 1800 },
        { sel: '[data-copy-block="chart"]', text: 'Copy the chart note', noClick: true, wait: 1800 },
        { sel: '[data-copy-block="all"]', text: 'Copy All — grabs everything at once', noClick: true, wait: 1800 },
        { sel: '[data-copy-block="emr"]', text: 'Copy for EMR — structured JSON for the browser extension', noClick: true, wait: 2500 },
      ],
    },
    {
      id: 'templates',
      title: 'Saved Templates',
      desc: 'Jump into doctor-authored templates for fast repeat prescribing.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
      },
      steps: [
        { sel: '[data-set-field="workflowMode"][data-value="template"]', text: 'Switch to Template mode', wait: 1500 },
        { sel: '.option-list', text: 'Pick a saved template — guardrails are checked automatically', noClick: true, wait: 2500 },
      ],
    },
    {
      id: 'lookup',
      title: 'Formulary Browser',
      desc: 'Browse all 500+ medications grouped by condition.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
      setup: () => {
        applyPatientPreset('adult-f');
      },
      steps: [
        { sel: '[data-set-field="workflowMode"][data-value="lookup"]', text: 'Switch to Lookup mode', wait: 1500 },
        { sel: '[data-search-field="lookupSearch"]', text: 'Search any medication or condition', noClick: true, wait: 2000 },
        { sel: '.lookup-group', text: 'Medications grouped by condition with pricing', noClick: true, wait: 2500 },
      ],
    },
    {
      id: 'allergies',
      title: 'Allergy & Interaction Checks',
      desc: 'Toggle patient allergies and current meds to block unsafe options.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      setup: () => {},
      steps: [
        { sel: '[data-toggle-list="allergies"]', text: 'Toggle allergies — unsafe drugs are blocked automatically', noClick: true, wait: 2500 },
        { sel: '[data-toggle-list="currentMeds"]', text: 'Set current meds — interaction warnings appear', noClick: true, wait: 2500 },
      ],
    },
    {
      id: 'print',
      title: 'Print Prescription',
      desc: 'Print a clean Rx page with Ctrl+P — only the output prints.',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
      setup: () => {},
      steps: [],
      action: 'print',
    },
  ];

  function renderHelpModal() {
    const el = dom.helpModal;
    if (!app._helpOpen) {
      el.hidden = true;
      return;
    }
    el.hidden = false;

    let h = `<div class="help-modal-inner">`;
    h += `<div class="help-modal-head"><h2>How to use Tree of Life</h2><button type="button" class="tour-close" data-help-close>&times;</button></div>`;
    h += `<p class="help-subtitle">Click any feature below to see a guided walkthrough.</p>`;

    h += `<ul class="help-feature-list">`;
    HELP_FEATURES.forEach(f => {
      h += `<li class="help-feature-item" data-help-feature="${f.id}">`;
      h += `<div class="help-feature-icon">${f.icon}</div>`;
      h += `<div class="help-feature-body"><strong>${escape(f.title)}</strong><span>${escape(f.desc)}</span></div>`;
      h += `<div class="help-feature-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>`;
      h += `</li>`;
    });
    h += `</ul>`;

    // Keyboard shortcuts reference
    h += `<div class="help-shortcuts">`;
    h += `<div class="help-shortcuts-title">Keyboard shortcuts</div>`;
    const shortcuts = [
      ['Focus search', 'Ctrl + K'],
      ['New case', 'Ctrl + N'],
      ['Copy all', 'Ctrl + Shift + C'],
      ['Print Rx', 'Ctrl + P'],
      ['Close modal / stop demo', 'Esc'],
    ];
    shortcuts.forEach(([label, keys]) => {
      h += `<div class="help-shortcut-row"><span>${escape(label)}</span><span>${keys.split(' + ').map(k => `<kbd class="kbd">${k}</kbd>`).join(' + ')}</span></div>`;
    });
    h += `</div>`;

    h += `</div>`;
    el.innerHTML = h;
  }

  async function runFeatureWalkthrough(featureId) {
    const feature = HELP_FEATURES.find(f => f.id === featureId);
    if (!feature) return;

    // Close help modal
    app._helpOpen = false;
    renderHelpModal();

    // Handle special actions
    if (feature.action === 'print') {
      const printDate = document.getElementById('printDate');
      if (printDate) printDate.textContent = new Date().toLocaleDateString('en-CA');
      showToast('Use Ctrl+P to print — only the Rx output is included');
      return;
    }

    if (!feature.steps.length) return;

    // Run setup to get the UI into the right state
    feature.setup();
    await demoSleep(300);

    const spotlight = document.getElementById('demoSpotlight');
    const cursorEl = document.getElementById('demoCursor');
    const labelEl = document.getElementById('demoLabel');

    // Init cursor at center
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
    app._demoRunning = true;

    await demoSleep(400);

    for (let i = 0; i < feature.steps.length; i++) {
      if (!app._demoRunning) break;
      const step = feature.steps[i];

      // Handle type-into-search steps
      if (step.typeText) {
        const input = document.querySelector(step.sel);
        if (input) {
          input.focus();
          const rect = input.getBoundingClientRect();
          const pad = 8;
          spotlight.style.left = (rect.left - pad) + 'px';
          spotlight.style.top = (rect.top - pad) + 'px';
          spotlight.style.width = (rect.width + pad * 2) + 'px';
          spotlight.style.height = (rect.height + pad * 2) + 'px';
          cursorEl.style.left = (rect.left + 20) + 'px';
          cursorEl.style.top = (rect.top + rect.height / 2) + 'px';
          labelEl.textContent = step.text;
          const lx = rect.right + 16;
          const ly = rect.top + rect.height / 2 - 14;
          labelEl.style.left = Math.min(lx, window.innerWidth - 280) + 'px';
          labelEl.style.top = Math.max(ly, 8) + 'px';

          // Type characters one by one
          for (const ch of step.typeText) {
            if (!app._demoRunning) break;
            app._searchGuided = (app._searchGuided || '') + ch;
            render();
            input.focus();
            await demoSleep(120);
          }
        }
        await demoSleep(step.wait || 1500);
        continue;
      }

      const el = document.querySelector(step.sel);
      if (!el) { await demoSleep(300); continue; }

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
    if (app._helpOpen === undefined) app._helpOpen = false;
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
      addRecentCondition(value);
    } else if (field === 'templateId') {
      app.state.templateId = value;
      app.applyTemplateToState(app.getTemplateById(value), { syncMarket: false });
    } else if (field === 'sex') {
      app.state.sex = value;
      app.state.patientPresetId = '';
      if (value === 'male') app.state.pregnancy = 'na';
      if (value === 'female' && app.state.pregnancy === 'na') app.state.pregnancy = 'no';
      // Clear domain if it conflicts with new sex
      if (app.state.domain && getExcludedDomains().has(app.state.domain)) {
        app.state.domain = '';
        app.state.subtype = '';
        app.state.condition = '';
        app.state.symptoms = [];
      }
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
      app._childBucket = null;
      app.state.age = 0;
      app.state.weight = 0;
    } else {
      app._childBucket = null;
      app.state.age = p.age;
      app.state.weight = p.weight;
    }
    // Clear domain if it now conflicts with the new preset
    if (app.state.domain && getExcludedDomains().has(app.state.domain)) {
      app.state.domain = '';
      app.state.subtype = '';
      app.state.condition = '';
      app.state.symptoms = [];
    }
    render();
  }

  function applyChildBucket(bucketId) {
    const b = CHILD_AGE_BUCKETS.find((x) => x.id === bucketId);
    if (!b) return;
    app._childBucket = b.id;
    // Don't fill age into the input — keep it greyed out
    // Store the bucket's representative values for internal calculations
    app._childBucketAge = b.age;
    app._childBucketWeight = b.weight;
    app.state.age = b.age;      // used by engine for scoring/rules
    app.state.weight = b.weight; // used by engine for dosing
    // Clear domain if it now conflicts
    if (app.state.domain && getExcludedDomains().has(app.state.domain)) {
      app.state.domain = '';
      app.state.subtype = '';
      app.state.condition = '';
      app.state.symptoms = [];
    }
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
    if (kind === 'emr') {
      // Structured JSON for browser extension
      const ctx = app.processedSnapshot;
      const options = app.evaluateOptions(ctx);
      const sel = selectBestOption(options, ctx);
      if (sel) {
        const med = app.getOptionMeta(sel.id);
        const emrData = {
          _tol: true,
          medication: med.order.medication,
          sig: text(med.order.sig),
          quantity: med.order.dispense,
          frequency: '',
          duration: med.order.duration,
          refills: med.order.refills,
          route: '',
          dosePreview: sel.dosePreview,
          condition: app.currentConditionLabel(ctx) || '',
        };
        // Extract frequency from sig (e.g., "twice daily" → "BID")
        const sigLower = emrData.sig.toLowerCase();
        if (/once daily|every day|qd/i.test(sigLower)) emrData.frequency = 'OD';
        else if (/twice daily|bid/i.test(sigLower)) emrData.frequency = 'BID';
        else if (/three times|tid/i.test(sigLower)) emrData.frequency = 'TID';
        else if (/four times|qid/i.test(sigLower)) emrData.frequency = 'QID';
        else if (/at bedtime|qhs/i.test(sigLower)) emrData.frequency = 'QHS';
        else if (/every \d+ hours/i.test(sigLower)) {
          const hrs = sigLower.match(/every (\d+) hours/i);
          if (hrs) emrData.frequency = `Q${hrs[1]}H`;
        }
        // Extract route from sig
        if (/\boral|by mouth|po\b/i.test(sigLower)) emrData.route = 'PO';
        else if (/topical|apply/i.test(sigLower)) emrData.route = 'TOP';
        else if (/\bim\b|intramuscular/i.test(sigLower)) emrData.route = 'IM';
        else if (/\biv\b|intravenous/i.test(sigLower)) emrData.route = 'IV';
        else if (/sublingual|\bsl\b/i.test(sigLower)) emrData.route = 'SL';
        else if (/nasal|intranasal|nostril/i.test(sigLower)) emrData.route = 'IN';
        else if (/ophthalmic|eye/i.test(sigLower)) emrData.route = 'OPH';
        else if (/otic|ear/i.test(sigLower)) emrData.route = 'OT';
        else if (/vaginal/i.test(sigLower)) emrData.route = 'VAG';
        else if (/rectal/i.test(sigLower)) emrData.route = 'PR';

        content = JSON.stringify(emrData);
      }
    } else if (kind === 'rx') content = document.getElementById('rxText')?.textContent || '';
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
        btn.textContent = kind === 'emr' ? 'Copied JSON!' : 'Copied';
        setTimeout(() => { btn.textContent = orig; }, 1000);
      }
      const labels = { rx: 'Rx copied', chart: 'Chart note copied', pharmacy: 'Pharmacy note copied', all: 'All sections copied', emr: 'EMR JSON copied' };
      showToast(labels[kind] || 'Copied');
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

  // ─── TOUR (legacy, buttons removed) ────────────────────────────
  function closeTour() {
    if (app.tourState) app.tourState.open = false;
  }
  function renderTourStep() {}

  // ─── EVENT BINDING ────────────────────────────────────────────────

  function bindColumn(el) {
    el.addEventListener('click', (e) => {
      const preset = e.target.closest('[data-patient-preset]');
      if (preset) return applyPatientPreset(preset.dataset.patientPreset);

      const childBucket = e.target.closest('[data-child-bucket]');
      if (childBucket) return applyChildBucket(childBucket.dataset.childBucket);

      const egfr = e.target.closest('[data-egfr-preset]');
      if (egfr) return applyEgfrPreset(egfr.dataset.egfrPreset);

      const stepper = e.target.closest('[data-stepper]');
      if (stepper) {
        const field = stepper.dataset.stepper;
        const dir = Number(stepper.dataset.dir);
        const step = field === 'weight' ? 1 : 1;
        let val = (app.state[field] || 0) + dir * step;
        val = Math.max(0, val);
        if (field === 'age') val = Math.min(val, 120);
        if (field === 'weight') val = Math.min(val, 300);
        app.state[field] = val;
        if (app.state.domain && getExcludedDomains().has(app.state.domain)) {
          app.state.domain = '';
          app.state.subtype = '';
          app.state.condition = '';
          app.state.symptoms = [];
        }
        return render();
      }

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

      // ─── Score events ───
      const openScore = e.target.closest('[data-open-score]');
      if (openScore) {
        const calcId = openScore.dataset.openScore;
        const calc = window.TOLScores?.getCalculator(calcId);
        app._activeScoreId = calcId;
        app._scoreResult = null;
        // Auto-fill from patient context
        app._scoreValues = calc ? window.TOLScores.autoFillFromPatient(calc, app.state) : {};
        return render();
      }

      const scoreBack = e.target.closest('[data-score-back]');
      if (scoreBack) {
        app._activeScoreId = null;
        app._scoreValues = {};
        app._scoreResult = null;
        return render();
      }

      const scoreCalc = e.target.closest('[data-score-calculate]');
      if (scoreCalc) {
        const calc = window.TOLScores?.getCalculator(app._activeScoreId);
        if (calc) {
          app._scoreResult = calc.calculate(app._scoreValues || {}, app.state);
        }
        return render();
      }

      const scoreBool = e.target.closest('[data-score-bool]');
      if (scoreBool) {
        const fid = scoreBool.dataset.scoreBool;
        if (!app._scoreValues) app._scoreValues = {};
        app._scoreValues[fid] = !app._scoreValues[fid];
        app._scoreResult = null;
        return render();
      }

      const scaleBtn = e.target.closest('[data-score-scale]');
      if (scaleBtn) {
        const fid = scaleBtn.dataset.scoreScale;
        const val = Number(scaleBtn.dataset.scoreScaleVal);
        if (!app._scoreValues) app._scoreValues = {};
        app._scoreValues[fid] = val;
        app._scoreResult = null;
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
      if (searchField === 'scoresSearch') {
        app._searchScores = e.target.value;
        return render();
      }

      // Score select/number inputs
      const scoreSelect = e.target.dataset.scoreSelect;
      if (scoreSelect) {
        if (!app._scoreValues) app._scoreValues = {};
        app._scoreValues[scoreSelect] = e.target.value;
        app._scoreResult = null;
        return;
      }
      const scoreNumber = e.target.dataset.scoreNumber;
      if (scoreNumber) {
        if (!app._scoreValues) app._scoreValues = {};
        app._scoreValues[scoreNumber] = e.target.value;
        app._scoreResult = null;
        return;
      }
      const numField = e.target.dataset.numberField;
      if (numField) {
        // Strip non-numeric chars (input is type="text" for cursor support)
        const raw = e.target.value.replace(/[^0-9]/g, '');
        let val = Number(raw || 0);
        app.state[numField] = Math.max(0, val);
        // Check if domain conflicts after age change
        if (numField === 'age' && app.state.domain && getExcludedDomains().has(app.state.domain)) {
          app.state.domain = '';
          app.state.subtype = '';
          app.state.condition = '';
          app.state.symptoms = [];
        }
        // Don't full-render while typing — just update output panels
        autoProcess();
        renderOutputPanel();
        dom.refineBtn.classList.toggle('visible', !!app.processedSnapshot);
        // Update validation styling in-place
        const stepperEl = e.target.closest('.stepper-input');
        const ageV = numField === 'age' ? getAgeValidation() : null;
        if (stepperEl) {
          stepperEl.classList.toggle('stepper-error', !!ageV?.error);
        }
        const hintEl = e.target.closest('.field')?.querySelector('.field-error-hint');
        if (hintEl) hintEl.textContent = ageV?.msg || '';
        return;
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
    dom.refineBtn = document.getElementById('refineBtn');
    dom.refineModal = document.getElementById('refineModal');
    dom.helpBtn = document.getElementById('helpBtn');
    dom.helpModal = document.getElementById('helpModal');

    bindColumn(dom.patientPanel);
    bindColumn(dom.clinicalPanel);
    bindColumn(dom.outputPanel);

    // Help button
    dom.helpBtn.addEventListener('click', () => {
      app._helpOpen = true;
      renderHelpModal();
    });

    // Help modal events
    dom.helpModal.addEventListener('click', (e) => {
      const close = e.target.closest('[data-help-close]');
      if (close) { app._helpOpen = false; renderHelpModal(); return; }

      const feature = e.target.closest('[data-help-feature]');
      if (feature) {
        runFeatureWalkthrough(feature.dataset.helpFeature);
        return;
      }

      // Click backdrop to close
      if (e.target === dom.helpModal) {
        app._helpOpen = false;
        renderHelpModal();
      }
    });

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

    function resetCase() {
      Object.assign(app.state, structuredClone(app.config.state));
      app._searchGuided = '';
      app._searchTemplate = '';
      app._searchLookup = '';
      app._searchScores = '';
      app._lookupSelectedMed = '';
      app._activeScoreId = null;
      app._scoreValues = {};
      app._refineOpen = false;
      app._refinePrefs = {};
      app._childBucket = null;
      app.processedSnapshot = null;
      app.selectedOptionId = null;
      render();
    }

    document.addEventListener('keydown', (e) => {
      // Escape — close demo, refine modal, or tour
      if (e.key === 'Escape') {
        if (app._demoRunning) {
          app._demoRunning = false;
          document.getElementById('demoSpotlight').hidden = true;
          document.getElementById('demoCursor').hidden = true;
          document.getElementById('demoLabel').hidden = true;
          return;
        }
        if (app._helpOpen) {
          app._helpOpen = false;
          renderHelpModal();
          return;
        }
        if (app._refineOpen) {
          app._refineOpen = false;
          renderRefineModal();
          render();
          return;
        }
        if (app.tourState?.open) {
          if (typeof closeTour === 'function') closeTour();
          return;
        }
      }

      // Ctrl+K — focus condition search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchBox = document.querySelector('[data-search-field="guidedSearch"]') ||
                          document.querySelector('[data-search-field="lookupSearch"]') ||
                          document.querySelector('[data-search-field="templateId"]');
        if (searchBox) searchBox.focus();
        return;
      }

      // Ctrl+Shift+C — copy all (when output is live)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        if (app.processedSnapshot) {
          e.preventDefault();
          copyBlock('all');
          return;
        }
      }

      // Ctrl+P — print (set date first)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        const printDate = document.getElementById('printDate');
        if (printDate) printDate.textContent = new Date().toLocaleDateString('en-CA');
      }

      // Ctrl+N — new case
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        resetCase();
        return;
      }
    });

    render();
  }

  window.TOLUI = { init, render };
  document.addEventListener('DOMContentLoaded', init);
})();
