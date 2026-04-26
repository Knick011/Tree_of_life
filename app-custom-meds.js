// Tree of Life — Clinician-added custom medications
// Stored in localStorage so the doctor can pin their own drugs to specific conditions.
// The shape mirrors the catalog so the existing rules engine (evaluateOption) can score them
// without any branching. Empty rules[] means status is always 'eligible' unless safety toggles
// are configured. basePreference is forced very high so custom drugs pin to the top.

(function (global) {
  const STORAGE_KEY = 'tol_custom_meds_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }

  function persist(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.warn('[TOL] custom meds persist failed', e); }
  }

  function list(condition) {
    if (!condition) return [];
    const data = load();
    return data[condition] || [];
  }

  function buildRulesFromSafety(safety) {
    const rules = [];
    if (!safety) return rules;
    if (safety.penicillinAllergy) {
      rules.push({
        when: (ctx) => Array.isArray(ctx.allergies) && ctx.allergies.includes('penicillin'),
        effect: 'blocked',
        reason: { en: 'Custom drug flagged unsafe with penicillin allergy.' },
      });
    }
    if (safety.sulfaAllergy) {
      rules.push({
        when: (ctx) => Array.isArray(ctx.allergies) && ctx.allergies.includes('sulfa'),
        effect: 'blocked',
        reason: { en: 'Custom drug flagged unsafe with sulfa allergy.' },
      });
    }
    if (safety.pregnancy) {
      rules.push({
        when: (ctx) => ctx.pregnancy === 'yes',
        effect: 'blocked',
        reason: { en: 'Custom drug flagged not safe in pregnancy.' },
      });
    }
    if (typeof safety.egfrFloor === 'number' && safety.egfrFloor > 0) {
      const floor = safety.egfrFloor;
      rules.push({
        when: (ctx) => Number(ctx.egfr) > 0 && Number(ctx.egfr) < floor,
        effect: 'caution',
        reason: { en: `Custom drug flagged for renal review under eGFR ${floor}.` },
      });
    }
    if (typeof safety.ageMin === 'number' && safety.ageMin > 0) {
      const min = safety.ageMin;
      rules.push({
        when: (ctx) => Number(ctx.age) > 0 && Number(ctx.age) < min,
        effect: 'blocked',
        reason: { en: `Custom drug flagged for ages ${min}+ only.` },
      });
    }
    if (typeof safety.ageMax === 'number' && safety.ageMax > 0) {
      const max = safety.ageMax;
      rules.push({
        when: (ctx) => Number(ctx.age) > max,
        effect: 'caution',
        reason: { en: `Custom drug flagged for ages up to ${max}.` },
      });
    }
    return rules;
  }

  // Build a catalog-shaped entry from a draft form payload. Lossless round-trip via _safetyConfig
  // and _sigParts so the editor can reload state on edit.
  function build(draft) {
    const id = draft.id || `custom-${Date.now()}`;
    const lang = 'en';
    const region = { available: true, price: 0, preferred: true, formulary: 'Custom', code: 'CUSTOM' };
    return {
      id,
      _custom: true,
      _safetyConfig: draft.safety || {},
      _sigParts: draft.sigParts || {},
      addedBy: draft.addedBy || '',
      addedAt: draft.addedAt || new Date().toISOString(),
      condition: draft.condition,
      labels: { [lang]: draft.medication },
      type: { [lang]: 'Custom — clinician-authored' },
      form: { [lang]: '' },
      basePreference: { CA: 999, US: 999, UK: 999 },
      regionData: { CA: { ...region }, US: { ...region }, UK: { ...region } },
      rules: buildRulesFromSafety(draft.safety),
      symptomBoosts: {},
      dose: { [lang]: draft.medication },
      rationale: { [lang]: 'Pinned by clinician for this condition.' },
      pros: { [lang]: draft.pros && draft.pros.length ? draft.pros : ['Clinician-added'] },
      cons: { [lang]: draft.cons && draft.cons.length ? draft.cons : ['Auto patient-fit checks limited'] },
      evidence: { [lang]: ['Locally added by clinician'] },
      order: {
        medication: draft.medication,
        sig: { [lang]: draft.sig },
        dispense: draft.dispense,
        refills: Number(draft.refills) || 0,
        duration: draft.duration || '',
        indication: draft.indication || '',
        route: draft.route || '',
        frequency: draft.frequency || '',
        pharmacy: { [lang]: draft.pharmacy || '' },
      },
    };
  }

  function save(condition, entry) {
    if (!condition || !entry?.id) return;
    const data = load();
    const arr = data[condition] || [];
    const idx = arr.findIndex((m) => m.id === entry.id);
    if (idx >= 0) arr[idx] = entry;
    else arr.unshift(entry);
    data[condition] = arr;
    persist(data);
  }

  function remove(condition, id) {
    if (!condition || !id) return;
    const data = load();
    const arr = (data[condition] || []).filter((m) => m.id !== id);
    if (arr.length) data[condition] = arr;
    else delete data[condition];
    persist(data);
  }

  global.TOLCustomMeds = { list, save, remove, build, buildRulesFromSafety };
})(typeof window !== 'undefined' ? window : globalThis);
