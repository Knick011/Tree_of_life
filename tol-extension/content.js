const ext = globalThis.browser ?? globalThis.chrome;

const UI_IDS = {
  style: '__tol_inline_style',
  root: '__tol_inline_root',
  fab: '__tol_inline_fab',
  panel: '__tol_inline_panel',
  status: '__tol_inline_status',
  draft: '__tol_inline_draft',
  emr: '__tol_inline_emr',
  overlay: '__tol_inline_overlay',
  overlayTitle: '__tol_inline_overlay_title',
  overlayBody: '__tol_inline_overlay_body',
  readBtn: '__tol_inline_read',
  fillBtn: '__tol_inline_fill',
  hideBtn: '__tol_inline_hide',
};

const STORAGE_KEY = 'emrType';
const emrModels = globalThis.TOLEmrModels;

const FIELD_ALIASES = {
  medicationDisplay: 'medication',
  drugName: 'medication',
  instructions: 'sig',
  sig: 'sig',
  quantity: 'quantity',
  dispenseQuantity: 'quantity',
  repeats: 'refills',
  refills: 'refills',
  duration: 'duration',
  indication: 'indication',
  specialInstruction: 'indication',
  patientNote: 'indication',
  noteToPharmacy: 'pharmacyNote',
  pharmacyNote: 'pharmacyNote',
  route: 'route',
  frequency: 'frequency',
  frequencyCode: 'frequency',
  daysSupply: 'daysSupply',
  unitType: 'unitType',
  reasonForRx: 'reasonForRx',
  effectiveDate: 'effectiveDate',
  serviceLocation: 'serviceLocation',
  supervisingProvider: 'supervisingProvider',
  allowSubstitution: 'allowSubstitution',
};

function buildStructuredFields(medicationSelectors, extra = {}) {
  return {
    medication: { selectors: medicationSelectors, strategy: 'search' },
    sig: { selectors: ['textarea[name*="sig" i]', 'textarea[name*="instruction" i]', 'textarea[aria-label*="sig" i]', 'textarea[placeholder*="sig" i]', 'textarea[placeholder*="instruction" i]'], strategy: 'input' },
    quantity: { selectors: ['input[name*="quantity" i]', 'input[name*="qty" i]', 'input[name*="dispense" i]', 'input[aria-label*="quantity" i]', 'input[aria-label*="dispense" i]'], strategy: 'input' },
    refills: { selectors: ['select[name*="refill" i]', 'input[name*="refill" i]', 'input[name*="repeat" i]', 'select[name*="repeat" i]', 'input[aria-label*="refill" i]'], strategy: 'input' },
    duration: { selectors: ['input[name*="duration" i]', 'select[name*="duration" i]', 'input[aria-label*="duration" i]'], strategy: 'input' },
    daysSupply: { selectors: ['input[name*="dayssupply" i]', 'input[name*="days_supply" i]', 'input[name*="day" i][name*="supply" i]', 'input[aria-label*="days supply" i]'], strategy: 'input' },
    unitType: { selectors: ['select[name*="unit" i]', 'input[name*="unit" i]', 'select[aria-label*="unit" i]', 'input[aria-label*="unit" i]'], strategy: 'select' },
    route: { selectors: ['select[name*="route" i]', 'input[name*="route" i]', 'input[aria-label*="route" i]'], strategy: 'select' },
    frequency: { selectors: ['select[name*="frequency" i]', 'select[name*="freq" i]', 'input[name*="frequency" i]', 'input[aria-label*="frequency" i]'], strategy: 'select' },
    indication: { selectors: ['textarea[name*="indication" i]', 'input[name*="indication" i]', 'textarea[name*="note" i]', 'textarea[aria-label*="indication" i]'], strategy: 'append' },
    reasonForRx: { selectors: ['input[name*="reason" i]', 'textarea[name*="reason" i]', 'input[aria-label*="reason" i]', 'textarea[aria-label*="reason" i]', 'input[name*="diagnosis" i]'], strategy: 'input' },
    pharmacyNote: { selectors: ['textarea[name*="pharmacy" i]', 'textarea[name*="comment" i]', 'textarea[name*="note" i]', 'textarea[aria-label*="pharmacy" i]'], strategy: 'append' },
    effectiveDate: { selectors: ['input[name*="effective" i]', 'input[aria-label*="effective date" i]', 'input[type="date"][name*="date" i]'], strategy: 'input' },
    serviceLocation: { selectors: ['select[name*="service" i]', 'input[name*="service" i]', 'select[aria-label*="service location" i]', 'input[aria-label*="service location" i]'], strategy: 'select' },
    supervisingProvider: { selectors: ['select[name*="supervis" i]', 'input[name*="supervis" i]', 'select[aria-label*="supervising provider" i]', 'input[aria-label*="supervising provider" i]'], strategy: 'select' },
    allowSubstitution: { selectors: ['input[name*="substitution" i][type="checkbox"]', 'input[name*="generic" i][type="checkbox"]', 'input[aria-label*="allow substitution" i][type="checkbox"]'], strategy: 'checkbox' },
    ...extra,
  };
}

const EMR_DEFS = {
  oscar: {
    label: 'OSCAR / Juno',
    hosts: [/junoemr\.com$/i, /oscar/i],
    paths: [/\/juno\/oscarRx\//i],
    detectSelectors: ['#searchString', '#rxText', 'input[id^="drugName_"]'],
    fields: buildStructuredFields(['#searchString', 'input[name="searchString"]']),
  },
  pssuite: {
    label: 'PS Suite',
    hosts: [/pssuite/i, /wellhealth/i, /telus/i],
    detectSelectors: ['#txtDrugName', '#txtSig', 'input[placeholder*="medication" i]'],
    fields: buildStructuredFields(['#txtDrugName', '#drugSearch', 'input[placeholder*="medication" i]', 'input[placeholder*="drug" i]']),
  },
  accuro: {
    label: 'Accuro',
    hosts: [/accuro/i, /qhr/i],
    detectSelectors: ['input[placeholder*="drug" i]', 'textarea[name*="instruction" i]'],
    fields: buildStructuredFields(['input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[type="search"]']),
  },
  medaccess: {
    label: 'Med Access',
    hosts: [/medaccess/i, /telus/i],
    detectSelectors: ['input[placeholder*="medication" i]', 'textarea[placeholder*="sig" i]'],
    fields: buildStructuredFields(['input[placeholder*="medication" i]', 'input[placeholder*="drug" i]', 'input[name*="medication" i]']),
  },
  chr: {
    label: 'CHR',
    hosts: [/collaborativehealthrecord/i, /telus/i, /\bchr\b/i],
    detectSelectors: ['input[placeholder*="medication" i]', '[aria-label*="prescription" i]'],
    fields: buildStructuredFields(['input[placeholder*="medication" i]', 'input[aria-label*="medication" i]', 'input[name*="medication" i]']),
  },
  medesync: {
    label: 'Medesync',
    hosts: [/medesync/i, /telus/i],
    detectSelectors: ['input[placeholder*="drug" i]', 'textarea[name*="sig" i]'],
    fields: buildStructuredFields(['input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[name*="drug" i]']),
  },
  epic: {
    label: 'Epic',
    hosts: [/epic/i, /mychart/i],
    detectSelectors: ['input[aria-label*="Medication" i]', 'textarea[aria-label*="Sig" i]', '[data-testid*="medication" i]'],
    fields: buildStructuredFields(
      ['input[aria-label*="Medication" i]', 'input[placeholder*="Medication" i]', '[data-testid*="medication"] input'],
      {
        indication: { selectors: ['textarea[aria-label*="Indication" i]', 'input[aria-label*="Indication" i]'], strategy: 'input' },
        pharmacyNote: { selectors: ['textarea[aria-label*="Pharmacy" i]', 'textarea[aria-label*="Comment" i]'], strategy: 'append' },
      },
    ),
  },
  athena: {
    label: 'Athena',
    hosts: [/athena/i],
    detectSelectors: ['input[placeholder*="medication" i]', 'textarea[placeholder*="sig" i]'],
    fields: buildStructuredFields(['input[placeholder*="medication" i]', 'input[placeholder*="drug" i]', 'input[name*="medication" i]']),
  },
  eclinicalworks: {
    label: 'eClinicalWorks',
    hosts: [/eclinicalworks/i],
    detectSelectors: ['input[id*="drug" i]', 'textarea[id*="sig" i]', 'input[placeholder*="pharmacy" i]'],
    fields: buildStructuredFields(['input[id*="drug" i]', 'input[placeholder*="drug" i]', 'input[name*="drug" i]']),
  },
  nextgen: {
    label: 'NextGen',
    hosts: [/nextgen/i, /nextmd/i],
    detectSelectors: ['input[name*="medication" i]', 'input[aria-label*="medication" i]', 'textarea[name*="sig" i]'],
    fields: buildStructuredFields(['input[name*="medication" i]', 'input[aria-label*="medication" i]', 'input[placeholder*="medication" i]']),
  },
  practicefusion: {
    label: 'Practice Fusion',
    hosts: [/practicefusion/i],
    detectSelectors: ['input[placeholder*="Medication" i]', 'textarea[placeholder*="Sig" i]'],
    fields: buildStructuredFields(['input[placeholder*="Medication" i]', 'input[aria-label*="Medication" i]']),
  },
  drchrono: {
    label: 'DrChrono',
    hosts: [/drchrono/i],
    detectSelectors: ['input[placeholder*="drug" i]', 'textarea[placeholder*="instruction" i]', 'input[name*="service" i]'],
    fields: buildStructuredFields(['input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[name*="drug" i]']),
  },
  emis: {
    label: 'EMIS Web',
    hosts: [/emis/i],
    detectSelectors: ['input[aria-label*="drug" i]', 'textarea[aria-label*="direction" i]', 'input[placeholder*="issue" i]'],
    fields: buildStructuredFields(['input[aria-label*="drug" i]', 'input[placeholder*="drug" i]', 'input[name*="drug" i]']),
  },
  systmone: {
    label: 'TPP SystmOne',
    hosts: [/systmone/i, /tpp/i],
    detectSelectors: ['input[aria-label*="medication" i]', 'textarea[aria-label*="dose" i]', 'input[placeholder*="medication" i]'],
    fields: buildStructuredFields(['input[aria-label*="medication" i]', 'input[placeholder*="medication" i]', 'input[name*="medication" i]']),
  },
  vision: {
    label: 'Vision',
    hosts: [/vision/i, /oneadvanced/i, /inps/i],
    detectSelectors: ['input[placeholder*="drug" i]', 'textarea[placeholder*="direction" i]'],
    fields: buildStructuredFields(['input[placeholder*="drug" i]', 'input[name*="drug" i]', 'input[aria-label*="drug" i]']),
  },
  generic: {
    label: 'Generic',
    hosts: [],
    paths: [],
    detectSelectors: [],
    fields: buildStructuredFields(['input[name*="drug" i]', 'input[name*="med" i]', 'input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[type="search"]']),
  },
};

const inlineState = {
  detected: null,
  preferredEmr: 'auto',
  cachedPayload: null,
  cachedNormalized: null,
  panelOpen: false,
  initialized: false,
  lastMessage: 'Waiting for a TOL draft.',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs = 4000, intervalMs = 120) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = predicate();
    if (result) return result;
    await sleep(intervalMs);
  }
  return null;
}

function findElement(selectors) {
  for (const selector of selectors || []) {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch {
      // Ignore invalid selectors.
    }
  }
  return null;
}

function dispatchFormEvents(element) {
  ['input', 'change', 'blur'].forEach((type) => {
    element.dispatchEvent(new Event(type, { bubbles: true }));
  });
}

function setElementValue(element, value) {
  if (!element) return false;
  const nextValue = String(value ?? '');
  if (element.isContentEditable) {
    element.textContent = nextValue;
    dispatchFormEvents(element);
    return true;
  }

  const proto =
    element.tagName === 'TEXTAREA'
      ? HTMLTextAreaElement.prototype
      : element.tagName === 'SELECT'
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(element, nextValue);
  else element.value = nextValue;
  dispatchFormEvents(element);
  return true;
}

function setSelectValue(element, value) {
  if (!element) return false;
  if (element.tagName !== 'SELECT') return setElementValue(element, value);

  const wanted = String(value || '').toLowerCase().trim();
  if (!wanted) return false;

  for (const option of Array.from(element.options)) {
    const optionValue = String(option.value || '').toLowerCase();
    const optionText = String(option.text || '').toLowerCase();
    if (optionValue === wanted || optionText === wanted) {
      element.value = option.value;
      dispatchFormEvents(element);
      return true;
    }
  }

  for (const option of Array.from(element.options)) {
    const optionValue = String(option.value || '').toLowerCase();
    const optionText = String(option.text || '').toLowerCase();
    if (optionValue.includes(wanted) || optionText.includes(wanted)) {
      element.value = option.value;
      dispatchFormEvents(element);
      return true;
    }
  }

  return false;
}

function appendElementValue(element, value) {
  if (!element || !value) return false;
  const existing = element.value || element.textContent || '';
  const next = existing ? `${existing}\n${value}` : String(value);
  return setElementValue(element, next);
}

function setCheckboxValue(element, value) {
  if (!element) return false;
  const nextValue = value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes';
  element.checked = nextValue;
  dispatchFormEvents(element);
  return true;
}

function typeSearchField(element, value) {
  if (!element || !value) return false;
  element.focus();
  setElementValue(element, value);
  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    element.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', bubbles: true }));
  });
  element.dispatchEvent(new Event('search', { bubbles: true }));
  return true;
}

function fillElement(fieldDef, value) {
  if (value === '' || value === null || value === undefined) return false;
  const element = findElement(fieldDef.selectors);
  if (!element) return false;

  switch (fieldDef.strategy) {
    case 'search':
      return typeSearchField(element, value);
    case 'select':
      return setSelectValue(element, value);
    case 'append':
      return appendElementValue(element, value);
    case 'checkbox':
      return setCheckboxValue(element, value);
    default:
      return setElementValue(element, value);
  }
}

function highlightElement(element) {
  if (!element) return;
  const original = element.style.outline;
  element.style.outline = '2px solid #0d7377';
  element.style.outlineOffset = '2px';
  setTimeout(() => {
    element.style.outline = original;
  }, 1600);
}

function showToast(message, tone = 'ok') {
  const existing = document.getElementById('__tol_extension_toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = '__tol_extension_toast';
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '16px';
  toast.style.right = '16px';
  toast.style.zIndex = '2147483647';
  toast.style.padding = '10px 12px';
  toast.style.borderRadius = '8px';
  toast.style.fontFamily = 'Segoe UI, Arial, sans-serif';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.16)';
  toast.style.background = tone === 'ok' ? '#0d7377' : '#8b3d3d';
  toast.style.color = '#fff';
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function normalizeLooseText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function clickElement(element) {
  if (!element) return false;
  element.focus?.();
  ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((type) => {
    const EventCtor = type === 'pointerdown' && typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
    element.dispatchEvent(new EventCtor(type, { bubbles: true, cancelable: true }));
  });
  return true;
}

function getOscarRowIds() {
  return Array.from(document.querySelectorAll('#rxText [id^="instructions_"]'))
    .map((element) => element.id.replace('instructions_', ''))
    .filter(Boolean);
}

function getLatestOscarRowId() {
  const ids = getOscarRowIds();
  return ids.length ? ids[ids.length - 1] : null;
}

function getOscarRowFields(rowId) {
  if (!rowId) return {};
  return {
    row: document.getElementById(`set_${rowId}`),
    drugName: document.getElementById(`drugName_${rowId}`),
    instructions: document.getElementById(`instructions_${rowId}`),
    specialWrap: document.getElementById(`siAutoComplete_${rowId}`),
    specialInstruction: document.getElementById(`siInput_${rowId}`),
    quantity: document.getElementById(`quantity_${rowId}`),
    repeats: document.getElementById(`repeats_${rowId}`),
    route: document.getElementById(`route_${rowId}`),
    frequency: document.getElementById(`frequency_${rowId}`),
    duration: document.getElementById(`duration_${rowId}`),
    durationUnit: document.getElementById(`durationUnit_${rowId}`),
    longTerm: document.getElementById(`longTerm_${rowId}`),
    prnValue: document.getElementById(`prnVal_${rowId}`),
    comment: document.getElementById(`comment_${rowId}`),
  };
}

function getOscarAutocompleteOptions() {
  return Array.from(document.querySelectorAll('#autocomplete_choices a[title], #autocomplete_choices li a[title]'))
    .filter((element) => element.getClientRects().length > 0);
}

function findBestOscarAutocompleteOption(drugName) {
  const wanted = normalizeLooseText(drugName);
  const options = getOscarAutocompleteOptions();
  if (!options.length) return null;

  let exact = options.find((option) => normalizeLooseText(option.getAttribute('title') || option.textContent) === wanted);
  if (exact) return exact;

  let contains = options.find((option) => normalizeLooseText(option.getAttribute('title') || option.textContent).includes(wanted));
  if (contains) return contains;

  const wantedTokens = wanted.split(' ').filter(Boolean);
  return options.find((option) => {
    const label = normalizeLooseText(option.getAttribute('title') || option.textContent);
    return wantedTokens.every((token) => label.includes(token));
  }) || options[0];
}

function findOscarMatchingRowId(drugName) {
  const wanted = normalizeLooseText(drugName);
  const drugInputs = Array.from(document.querySelectorAll('#rxText input[id^="drugName_"]'));
  const match = drugInputs.find((input) => normalizeLooseText(input.value) === wanted);
  return match ? match.id.replace('drugName_', '') : null;
}

function setOscarSearchValue(value) {
  const searchField = document.getElementById('searchString');
  if (!searchField || !value) return false;
  searchField.focus();
  setElementValue(searchField, value);
  ['keydown', 'keyup'].forEach((type) => {
    searchField.dispatchEvent(new KeyboardEvent(type, { key: 'a', bubbles: true }));
  });
  return true;
}

function buildOscarSearchQueries(drugName) {
  const raw = String(drugName || '').trim();
  const tokens = raw.split(/\s+/).filter(Boolean);
  const queries = [raw, tokens.slice(0, 3).join(' '), tokens.slice(0, 2).join(' '), tokens[0]].filter(Boolean);
  return [...new Set(queries)];
}

function storageGet(key) {
  if (!ext?.storage?.local?.get) return Promise.resolve({});
  try {
    const result = ext.storage.local.get(key);
    if (result && typeof result.then === 'function') return result;
  } catch {
    // Fall through to callback form.
  }
  return new Promise((resolve) => {
    ext.storage.local.get(key, (result) => resolve(result || {}));
  });
}

function getFieldLabel(name) {
  const logical = FIELD_ALIASES[name] || name;
  return emrModels?.FIELD_LABELS?.[logical] || logical;
}

function getAdapterFields(message, emrType) {
  if (message?.normalized?.adapterFields) return message.normalized.adapterFields;
  if (message?.payload?.adapters?.[emrType]?.fields) return message.payload.adapters[emrType].fields;
  if (message?.payload?.adapter?.type === emrType && message?.payload?.adapter?.fields) return message.payload.adapter.fields;

  if (message?.payload?._tol && message?.payload?.medication) {
    return {
      medication: message.payload.medication,
      sig: message.payload.sig,
      quantity: message.payload.quantity,
      frequency: message.payload.frequency,
      duration: message.payload.duration,
      daysSupply: message.payload.daysSupply,
      unitType: message.payload.unitType,
      refills: message.payload.refills,
      route: message.payload.route,
      indication: message.payload.condition,
      reasonForRx: message.payload.condition,
      pharmacyNote: message.payload.noteToPharmacy || message.payload.pharmacyNote,
    };
  }

  return {};
}

function normalizePayload(parsed, chosenEmr = '') {
  if (!parsed || parsed._tol !== true) return null;

  if (parsed.schemaVersion >= 2 && parsed.canonical) {
    const defaultEmr = parsed.adapter?.type || parsed.canonical.emrType || 'generic';
    const emrType = chosenEmr || defaultEmr;
    return {
      defaultEmr,
      emrType,
      medicationLabel:
        parsed.canonical.medicationDisplay ||
        parsed.adapters?.[emrType]?.fields?.medication ||
        parsed.adapters?.[emrType]?.fields?.drugName ||
        '-',
      adapterFields: parsed.adapters?.[emrType]?.fields || parsed.adapter?.fields || {},
      payload: parsed,
    };
  }

  const defaultEmr = chosenEmr || 'generic';
  return {
    defaultEmr,
    emrType: defaultEmr,
    medicationLabel: parsed.medication || '-',
    adapterFields: {
      medication: parsed.medication,
      sig: parsed.sig,
      quantity: parsed.quantity,
      frequency: parsed.frequency,
      duration: parsed.duration,
      refills: parsed.refills,
      route: parsed.route,
      indication: parsed.condition,
    },
    payload: parsed,
  };
}

function detectEmr() {
  const path = location.pathname || '';

  for (const [key, def] of Object.entries(EMR_DEFS)) {
    if (key === 'generic') continue;
    const pathMatch = def.paths?.some((pattern) => pattern.test(path)) || false;
    const selectorMatch = !!findElement(def.detectSelectors);

    if (pathMatch) {
      return { key, label: def.label };
    }

    if (selectorMatch) {
      return { key, label: def.label };
    }
  }

  return { key: 'generic', label: EMR_DEFS.generic.label };
}

function shouldExposeInlineEntry() {
  const detected = inlineState.detected || detectEmr();
  if (detected.key !== 'generic') return true;
  return !!inlineState.panelOpen;
}

function ensureInlineUi() {
  if (inlineState.initialized) return;
  inlineState.initialized = true;

  if (!document.getElementById(UI_IDS.style)) {
    const style = document.createElement('style');
    style.id = UI_IDS.style;
    style.textContent = `
      #${UI_IDS.root} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483646;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      #${UI_IDS.fab} {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border: 0;
        border-radius: 999px;
        background: #0d7377;
        color: #fff;
        box-shadow: 0 18px 50px rgba(13, 115, 119, 0.28);
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
      }
      #${UI_IDS.fab}[hidden] {
        display: none !important;
      }
      #${UI_IDS.panel} {
        width: 320px;
        background: #fff;
        color: #17212b;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
        overflow: hidden;
      }
      #${UI_IDS.panel}[hidden] {
        display: none !important;
      }
      .tol-inline-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        background: #162231;
        color: #fff;
      }
      .tol-inline-head strong {
        display: block;
        font-size: 14px;
      }
      .tol-inline-head span {
        display: block;
        margin-top: 4px;
        color: rgba(255,255,255,0.72);
        font-size: 11px;
      }
      .tol-inline-close {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        color: #fff;
        cursor: pointer;
        font-size: 18px;
      }
      .tol-inline-body {
        padding: 14px 16px 16px;
      }
      .tol-inline-meta {
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #f4f7f8;
        font-size: 12px;
        line-height: 1.5;
      }
      .tol-inline-status {
        margin-bottom: 10px;
        color: #475569;
        font-size: 12px;
        line-height: 1.5;
      }
      .tol-inline-draft {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #d7dfe5;
        background: #fff;
        font-size: 12px;
      }
      .tol-inline-draft strong {
        display: block;
        margin-bottom: 4px;
        color: #17212b;
      }
      .tol-inline-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .tol-inline-actions button,
      .tol-inline-footer button {
        min-height: 36px;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }
      .tol-inline-primary {
        background: #0d7377;
        color: #fff;
      }
      .tol-inline-secondary {
        background: #fff;
        color: #17212b;
        border: 1px solid #d7dfe5 !important;
      }
      .tol-inline-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-top: 12px;
      }
      .tol-inline-footer p {
        margin: 0;
        color: #64748b;
        font-size: 11px;
        line-height: 1.4;
      }
      #${UI_IDS.overlay} {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.28);
        backdrop-filter: blur(2px);
        z-index: 2147483647;
      }
      #${UI_IDS.overlay}[hidden] {
        display: none !important;
      }
      .tol-overlay-card {
        width: min(420px, calc(100vw - 32px));
        padding: 20px 22px;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 28px 90px rgba(15, 23, 42, 0.3);
      }
      .tol-overlay-spinner {
        width: 38px;
        height: 38px;
        margin-bottom: 14px;
        border-radius: 999px;
        border: 3px solid rgba(13, 115, 119, 0.18);
        border-top-color: #0d7377;
        animation: tol-spin 0.8s linear infinite;
      }
      .tol-overlay-card strong {
        display: block;
        font-size: 15px;
        color: #17212b;
      }
      .tol-overlay-card p {
        margin: 8px 0 0;
        color: #475569;
        font-size: 13px;
        line-height: 1.5;
      }
      @keyframes tol-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.documentElement.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = UI_IDS.root;

  const fab = document.createElement('button');
  fab.id = UI_IDS.fab;
  fab.type = 'button';
  fab.textContent = 'TOL Fill';
  fab.addEventListener('click', () => {
    inlineState.panelOpen = true;
    updateInlineUi();
  });

  const panel = document.createElement('section');
  panel.id = UI_IDS.panel;
  panel.hidden = true;

  const head = document.createElement('div');
  head.className = 'tol-inline-head';

  const headText = document.createElement('div');
  const headStrong = document.createElement('strong');
  headStrong.textContent = 'TOL Fill';
  const headSpan = document.createElement('span');
  headSpan.textContent = 'Use the current TOL draft on this page.';
  headText.appendChild(headStrong);
  headText.appendChild(headSpan);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'tol-inline-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    inlineState.panelOpen = false;
    updateInlineUi();
  });

  head.appendChild(headText);
  head.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'tol-inline-body';

  const meta = document.createElement('div');
  meta.id = UI_IDS.emr;
  meta.className = 'tol-inline-meta';

  const status = document.createElement('div');
  status.id = UI_IDS.status;
  status.className = 'tol-inline-status';

  const draft = document.createElement('div');
  draft.id = UI_IDS.draft;
  draft.className = 'tol-inline-draft';

  const actions = document.createElement('div');
  actions.className = 'tol-inline-actions';

  const readBtn = document.createElement('button');
  readBtn.id = UI_IDS.readBtn;
  readBtn.type = 'button';
  readBtn.className = 'tol-inline-secondary';
  readBtn.textContent = 'Read clipboard';
  readBtn.addEventListener('click', async () => {
    await loadClipboardIntoInlineState();
  });

  const fillBtn = document.createElement('button');
  fillBtn.id = UI_IDS.fillBtn;
  fillBtn.type = 'button';
  fillBtn.className = 'tol-inline-primary';
  fillBtn.textContent = 'Fill draft';
  fillBtn.addEventListener('click', async () => {
    if (!inlineState.cachedPayload) {
      await loadClipboardIntoInlineState();
      if (!inlineState.cachedPayload) return;
    }
    await fillPrescription({
      payload: inlineState.cachedPayload,
      normalized: inlineState.cachedNormalized,
      emrType: inlineState.preferredEmr,
    });
  });

  actions.appendChild(readBtn);
  actions.appendChild(fillBtn);

  const footer = document.createElement('div');
  footer.className = 'tol-inline-footer';
  const note = document.createElement('p');
  note.textContent = 'Shortcut: Ctrl+Shift+Y. Final review and signing stay inside the EMR.';
  const hideBtn = document.createElement('button');
  hideBtn.id = UI_IDS.hideBtn;
  hideBtn.type = 'button';
  hideBtn.className = 'tol-inline-secondary';
  hideBtn.textContent = 'Hide';
  hideBtn.addEventListener('click', () => {
    inlineState.panelOpen = false;
    updateInlineUi();
  });
  footer.appendChild(note);
  footer.appendChild(hideBtn);

  body.appendChild(meta);
  body.appendChild(status);
  body.appendChild(draft);
  body.appendChild(actions);
  body.appendChild(footer);
  panel.appendChild(head);
  panel.appendChild(body);

  const overlay = document.createElement('div');
  overlay.id = UI_IDS.overlay;
  overlay.hidden = true;
  const overlayCard = document.createElement('div');
  overlayCard.className = 'tol-overlay-card';
  const spinner = document.createElement('div');
  spinner.className = 'tol-overlay-spinner';
  const overlayTitle = document.createElement('strong');
  overlayTitle.id = UI_IDS.overlayTitle;
  overlayTitle.textContent = 'Preparing draft';
  const overlayBody = document.createElement('p');
  overlayBody.id = UI_IDS.overlayBody;
  overlayBody.textContent = 'TOL is matching the current page and filling the selected prescription fields.';
  overlayCard.appendChild(spinner);
  overlayCard.appendChild(overlayTitle);
  overlayCard.appendChild(overlayBody);
  overlay.appendChild(overlayCard);

  root.appendChild(fab);
  root.appendChild(panel);
  root.appendChild(overlay);
  document.documentElement.appendChild(root);
}

function updateInlineUi() {
  ensureInlineUi();
  const fab = document.getElementById(UI_IDS.fab);
  const panel = document.getElementById(UI_IDS.panel);
  const emr = document.getElementById(UI_IDS.emr);
  const status = document.getElementById(UI_IDS.status);
  const draft = document.getElementById(UI_IDS.draft);

  const detected = inlineState.detected || detectEmr();
  const preferred = inlineState.preferredEmr && inlineState.preferredEmr !== 'auto' ? inlineState.preferredEmr : inlineState.cachedNormalized?.defaultEmr || detected.key;
  const preferredLabel = EMR_DEFS[preferred]?.label || preferred;

  fab.hidden = !shouldExposeInlineEntry() || inlineState.panelOpen;
  panel.hidden = !inlineState.panelOpen;

  emr.textContent = `Detected page: ${detected.label} · Target draft: ${preferredLabel}`;
  status.textContent = inlineState.lastMessage;

  if (inlineState.cachedNormalized) {
    draft.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = inlineState.cachedNormalized.medicationLabel || 'Draft loaded';
    const sub = document.createElement('div');
    sub.textContent = `Payload target: ${EMR_DEFS[inlineState.cachedNormalized.defaultEmr]?.label || inlineState.cachedNormalized.defaultEmr}`;
    draft.appendChild(strong);
    draft.appendChild(sub);
  } else {
    draft.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = 'No draft loaded';
    const sub = document.createElement('div');
    sub.textContent = 'Use Copy for EMR in TOL Scribe, then click Read clipboard here.';
    draft.appendChild(strong);
    draft.appendChild(sub);
  }
}

function setOverlayState(visible, title, body) {
  ensureInlineUi();
  const overlay = document.getElementById(UI_IDS.overlay);
  const overlayTitle = document.getElementById(UI_IDS.overlayTitle);
  const overlayBody = document.getElementById(UI_IDS.overlayBody);
  overlay.hidden = !visible;
  if (title) overlayTitle.textContent = title;
  if (body) overlayBody.textContent = body;
}

function cachePayload(payload, normalized, preferredEmr = '') {
  inlineState.cachedPayload = payload || null;
  inlineState.cachedNormalized = normalized || null;
  if (preferredEmr) inlineState.preferredEmr = preferredEmr;
  updateInlineUi();
}

async function loadClipboardIntoInlineState() {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);
    const normalized = normalizePayload(parsed, inlineState.preferredEmr === 'auto' ? '' : inlineState.preferredEmr);
    if (!normalized) {
      inlineState.lastMessage = 'Clipboard does not contain a valid TOL payload.';
      updateInlineUi();
      showToast('Clipboard does not contain a valid TOL payload.', 'warn');
      return null;
    }
    cachePayload(parsed, normalized, normalized.defaultEmr);
    inlineState.lastMessage = 'Clipboard draft loaded. Review the target and fill when ready.';
    updateInlineUi();
    showToast('TOL loaded the clipboard draft.');
    return normalized;
  } catch {
    inlineState.lastMessage = 'Clipboard could not be parsed. Use Copy for EMR first.';
    updateInlineUi();
    showToast('Clipboard could not be parsed. Use Copy for EMR first.', 'warn');
    return null;
  }
}

async function addOscarDrugRow(drugName, progress) {
  if (!drugName || !document.getElementById('searchString') || !document.getElementById('rxText')) return null;

  for (const query of buildOscarSearchQueries(drugName)) {
    progress?.(`Searching OSCAR for ${query}`);
    const initialIds = new Set(getOscarRowIds());
    setOscarSearchValue(query);

    const option =
      (await waitFor(() => findBestOscarAutocompleteOption(drugName), 2200, 120)) ||
      (await waitFor(() => findBestOscarAutocompleteOption(query), 1200, 120));
    if (!option) continue;

    clickElement(option);

    const newRowId = await waitFor(() => {
      const ids = getOscarRowIds();
      return ids.find((id) => !initialIds.has(id)) || null;
    }, 4500, 120);

    if (newRowId) return newRowId;
    const matchedRowId = findOscarMatchingRowId(drugName) || findOscarMatchingRowId(query);
    if (matchedRowId) return matchedRowId;
  }

  return findOscarMatchingRowId(drugName) || getLatestOscarRowId();
}

function splitDuration(durationValue) {
  const raw = String(durationValue || '').trim();
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|d|w|m)?$/i);
  if (!match) return { amount: raw, unit: '' };
  const amount = match[1];
  const unitRaw = String(match[2] || '').toLowerCase();
  let unit = '';
  if (unitRaw.startsWith('day') || unitRaw === 'd') unit = 'D';
  if (unitRaw.startsWith('week') || unitRaw === 'w') unit = 'W';
  if (unitRaw.startsWith('month') || unitRaw === 'm') unit = 'M';
  return { amount, unit };
}

async function fillOscarRow(rowId, adapterFields, progress) {
  const fields = getOscarRowFields(rowId);
  const filled = [];
  const missing = [];

  if (!fields.row) {
    return { success: false, filled, missing: ['row'], rowId: null };
  }

  if (fields.row) highlightElement(fields.row);

  if (adapterFields.instructions) {
    progress?.('Applying instructions');
    if (fields.instructions) {
      setElementValue(fields.instructions, adapterFields.instructions);
      highlightElement(fields.instructions);
      filled.push('instructions');
      await sleep(180);
    } else {
      missing.push('instructions');
    }
  }

  if (adapterFields.specialInstruction || adapterFields.indication) {
    progress?.('Applying indication');
    const indicationValue = adapterFields.specialInstruction || adapterFields.indication;
    if (fields.specialInstruction) {
      if (fields.specialWrap && fields.specialWrap.style.display === 'none') {
        fields.specialWrap.style.display = 'block';
      }
      fields.specialInstruction.style.color = '#000';
      setElementValue(fields.specialInstruction, indicationValue);
      highlightElement(fields.specialInstruction);
      filled.push('specialInstruction');
    } else {
      missing.push('specialInstruction');
    }
  }

  if (adapterFields.quantity) {
    progress?.('Applying quantity');
    if (fields.quantity) {
      setElementValue(fields.quantity, adapterFields.quantity);
      highlightElement(fields.quantity);
      filled.push('quantity');
    } else {
      missing.push('quantity');
    }
  }

  if (adapterFields.repeats !== undefined && adapterFields.repeats !== null && adapterFields.repeats !== '') {
    progress?.('Applying repeats');
    if (fields.repeats) {
      setElementValue(fields.repeats, adapterFields.repeats);
      highlightElement(fields.repeats);
      filled.push('repeats');
    } else {
      missing.push('repeats');
    }
  }

  if (adapterFields.route) {
    progress?.('Applying route');
    if (fields.route) {
      if (setSelectValue(fields.route, adapterFields.route)) {
        highlightElement(fields.route);
        filled.push('route');
      } else {
        missing.push('route');
      }
    } else {
      missing.push('route');
    }
  }

  if (adapterFields.frequency || adapterFields.frequencyCode) {
    progress?.('Applying frequency');
    const frequencyValue = adapterFields.frequency || adapterFields.frequencyCode;
    if (fields.frequency) {
      if (setSelectValue(fields.frequency, frequencyValue)) {
        highlightElement(fields.frequency);
        filled.push('frequency');
      } else {
        missing.push('frequency');
      }
    } else {
      missing.push('frequency');
    }
  }

  if (adapterFields.duration) {
    progress?.('Applying duration');
    const duration = splitDuration(adapterFields.duration);
    if (fields.duration) {
      setElementValue(fields.duration, duration.amount);
      highlightElement(fields.duration);
      filled.push('duration');
    } else {
      missing.push('duration');
    }
    if (duration.unit && fields.durationUnit) {
      if (setSelectValue(fields.durationUnit, duration.unit)) {
        highlightElement(fields.durationUnit);
      }
    }
  }

  if (adapterFields.noteToPharmacy || adapterFields.pharmacyNote) {
    progress?.('Applying pharmacy note');
    const noteValue = adapterFields.noteToPharmacy || adapterFields.pharmacyNote;
    if (fields.comment) {
      setElementValue(fields.comment, noteValue);
      highlightElement(fields.comment);
      filled.push('noteToPharmacy');
    } else {
      missing.push('noteToPharmacy');
    }
  }

  return { success: filled.length > 0, filled, missing, rowId };
}

async function fillOscarPrescription(message, progress) {
  const adapterFields = getAdapterFields(message, 'oscar');
  const drugName = adapterFields.drugName || adapterFields.medication || adapterFields.medicationDisplay;

  if (!drugName) {
    return {
      success: false,
      filledCount: 0,
      missing: ['drugName'],
      detectedEmr: 'oscar',
      message: 'No OSCAR drug name was provided in the TOL payload.',
    };
  }

  progress?.('Creating OSCAR prescription row');
  let rowId = await addOscarDrugRow(drugName, progress);
  if (!rowId) rowId = findOscarMatchingRowId(drugName);

  if (!rowId) {
    showToast('OSCAR row not found. Select the drug manually, then run Fill Fields again.', 'warn');
    return {
      success: false,
      filledCount: 0,
      missing: Object.keys(adapterFields),
      detectedEmr: 'oscar',
      message: 'No OSCAR pending prescription row was created from the drug search.',
    };
  }

  const result = await fillOscarRow(rowId, adapterFields, progress);
  return {
    success: result.success,
    filledCount: result.filled.length,
    missing: result.missing,
    detectedEmr: 'oscar',
    rowId,
    message: result.success
      ? `Prepared OSCAR pending prescription row ${rowId}.`
      : `OSCAR row ${rowId} was found, but no fields were filled.`,
  };
}

async function fillGenericPrescription(message, requestedEmr, progress) {
  const detected = inlineState.detected || detectEmr();
  const emrDef = EMR_DEFS[requestedEmr] || EMR_DEFS.generic;
  const model = emrModels?.getModel?.(requestedEmr) || emrModels?.MODELS?.[requestedEmr] || emrModels?.MODELS?.generic;
  const adapterFields = getAdapterFields(message, requestedEmr);
  const filled = [];
  const missing = [];
  const entries = Object.entries(adapterFields)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .sort(([aKey], [bKey]) => {
      const aLogical = FIELD_ALIASES[aKey] || aKey;
      const bLogical = FIELD_ALIASES[bKey] || bKey;
      const order = model?.fillOrder || [];
      const aIndex = order.indexOf(aLogical);
      const bIndex = order.indexOf(bLogical);
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return normalizedA - normalizedB;
    });

  const presentLogicalFields = new Set(entries.map(([name]) => FIELD_ALIASES[name] || name));
  const missingRequired = (model?.requiredLogicalFields || []).filter((field) => !presentLogicalFields.has(field));

  for (const [adapterField, value] of entries) {
    const logicalField = FIELD_ALIASES[adapterField] || adapterField;
    const fieldDef = emrDef.fields[logicalField] || EMR_DEFS.generic.fields[logicalField];
    if (!fieldDef) continue;
    const target = findElement(fieldDef.selectors);
    if (!target) {
      missing.push(adapterField);
      continue;
    }

    progress?.(`Filling ${getFieldLabel(adapterField)}`);
    const ok = fillElement(fieldDef, value);
    if (fieldDef.strategy === 'search') {
      await sleep(220);
    }
    if (ok) {
      highlightElement(target);
      filled.push(adapterField);
    } else {
      missing.push(adapterField);
    }
  }

  return {
    success: filled.length > 0 && missingRequired.length === 0,
    filledCount: filled.length,
    missing: [...missingRequired, ...missing],
    detectedEmr: detected.key,
    message:
      missingRequired.length
        ? `The TOL draft is missing required ${emrDef.label} fields: ${missingRequired.join(', ')}.`
        : filled.length > 0
          ? `Filled ${filled.length} fields on ${emrDef.label}.`
          : `No matching ${emrDef.label} fields were found on this page.`,
  };
}

async function fillPrescription(message) {
  const detected = inlineState.detected || detectEmr();
  const requestedEmr =
    message?.emrType && message.emrType !== 'auto'
      ? message.emrType
      : message?.normalized?.defaultEmr || inlineState.preferredEmr || detected.key;
  const effectiveEmr = requestedEmr === 'auto' ? detected.key : requestedEmr;

  if (message?.payload) {
    cachePayload(message.payload, message.normalized || normalizePayload(message.payload, effectiveEmr), effectiveEmr);
  }

  setOverlayState(true, 'Preparing TOL draft', `Matching ${EMR_DEFS[effectiveEmr]?.label || effectiveEmr} on the current page.`);
  inlineState.lastMessage = `Filling ${EMR_DEFS[effectiveEmr]?.label || effectiveEmr}...`;
  updateInlineUi();

  const progress = (stepText) => {
    setOverlayState(true, 'Filling prescription fields', stepText);
    inlineState.lastMessage = stepText;
    updateInlineUi();
  };

  try {
    const result =
      effectiveEmr === 'oscar'
        ? await fillOscarPrescription({ ...message, emrType: effectiveEmr }, progress)
        : await fillGenericPrescription({ ...message, emrType: effectiveEmr }, effectiveEmr, progress);

    if (result.success) {
      inlineState.lastMessage = result.message;
      updateInlineUi();
      setOverlayState(true, 'Draft applied', result.missing?.length ? `Filled ${result.filledCount} fields. Missing: ${result.missing.join(', ')}` : result.message);
      showToast(`TOL filled ${result.filledCount} field${result.filledCount === 1 ? '' : 's'} on ${EMR_DEFS[effectiveEmr]?.label || effectiveEmr}`);
      setTimeout(() => setOverlayState(false), 1100);
      return result;
    }

    inlineState.lastMessage = result.message;
    updateInlineUi();
    setOverlayState(true, 'Fill needs review', result.message);
    showToast(result.message, 'warn');
    setTimeout(() => setOverlayState(false), 1600);
    return result;
  } catch (error) {
    const messageText = error?.message || 'TOL could not fill fields on this page.';
    inlineState.lastMessage = messageText;
    updateInlineUi();
    setOverlayState(true, 'Fill failed', messageText);
    showToast(messageText, 'warn');
    setTimeout(() => setOverlayState(false), 1800);
    return {
      success: false,
      filledCount: 0,
      missing: [],
      detectedEmr: detected.key,
      message: messageText,
    };
  }
}

async function initInlineState() {
  inlineState.detected = detectEmr();
  try {
    const stored = await storageGet(STORAGE_KEY);
    if (stored?.[STORAGE_KEY]) inlineState.preferredEmr = stored[STORAGE_KEY];
  } catch {
    // Ignore storage failures.
  }
  ensureInlineUi();
  updateInlineUi();

  let refreshTimer = null;
  const refreshDetection = () => {
    inlineState.detected = detectEmr();
    updateInlineUi();
  };
  const scheduleRefresh = () => {
    if (refreshTimer) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refreshDetection();
    }, 250);
  };

  const observer = new MutationObserver(() => {
    scheduleRefresh();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  window.addEventListener('popstate', scheduleRefresh);
  window.addEventListener('hashchange', scheduleRefresh);
}

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'detectEmr') {
    inlineState.detected = detectEmr();
    updateInlineUi();
    sendResponse({
      emrType: inlineState.detected.key,
      emrLabel: inlineState.detected.label,
      title: document.title || '',
      url: location.href,
    });
    return;
  }

  if (message.action === 'openInlinePanel') {
    if (message.emrType) inlineState.preferredEmr = message.emrType;
    if (message.payload) {
      cachePayload(message.payload, message.normalized || normalizePayload(message.payload, message.emrType || inlineState.preferredEmr), message.emrType || inlineState.preferredEmr);
      inlineState.lastMessage = 'Draft loaded from the extension popup.';
    }
    inlineState.panelOpen = true;
    updateInlineUi();
    sendResponse({ success: true });
    return;
  }

  if (message.action === 'toggleInlinePanel') {
    inlineState.panelOpen = !inlineState.panelOpen;
    updateInlineUi();
    sendResponse({ success: true, open: inlineState.panelOpen });
    return;
  }

  if (message.action === 'fillRx') {
    Promise.resolve(fillPrescription(message)).then((result) => sendResponse(result));
    return true;
  }
});

void initInlineState();
