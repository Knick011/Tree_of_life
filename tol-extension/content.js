const ext = globalThis.browser ?? globalThis.chrome;

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
};

const EMR_DEFS = {
  oscar: {
    label: 'OSCAR',
    hosts: [/oscar/i, /juno/i],
    detectSelectors: ['#searchString', 'input[name="searchString"]', 'textarea[name="special"]'],
    fields: {
      medication: { selectors: ['#searchString', 'input[name="searchString"]'], strategy: 'search' },
      sig: { selectors: ['textarea[name="special"]', 'textarea[name*="special"]', 'textarea[name*="instruction"]'], strategy: 'input' },
      quantity: { selectors: ['input[name="quantity"]', 'input[name*="quantity"]'], strategy: 'input' },
      refills: { selectors: ['select[name*="repeat"]', 'input[name*="repeat"]', 'input[name*="refill"]'], strategy: 'input' },
      duration: { selectors: ['input[name*="duration"]', 'select[name*="duration"]', 'input[name="txtDuration"]'], strategy: 'input' },
      route: { selectors: ['select[name="route"]', 'select[name*="route"]'], strategy: 'select' },
      frequency: { selectors: ['select[name="frequencyCode"]', 'select[name*="frequency"]'], strategy: 'select' },
      indication: { selectors: ['textarea[name*="specialInstruction"]', 'textarea[name*="special"]'], strategy: 'append' },
      pharmacyNote: { selectors: ['textarea[name*="pharmacy"]', 'textarea[name*="specialInstruction"]'], strategy: 'append' },
    },
  },
  pssuite: {
    label: 'PS Suite',
    hosts: [/pssuite/i, /wellhealth/i, /telus/i],
    detectSelectors: ['#txtSig', '#txtDrugName', 'input[placeholder*="medication" i]'],
    fields: {
      medication: { selectors: ['#txtDrugName', '#drugSearch', 'input[placeholder*="medication" i]', 'input[placeholder*="drug" i]'], strategy: 'search' },
      sig: { selectors: ['#txtSig', '#txtInstructions', 'textarea[name*="sig" i]', 'textarea[name*="instruction" i]'], strategy: 'input' },
      quantity: { selectors: ['#txtQuantity', '#txtQty', 'input[name*="quantity" i]', 'input[name*="qty" i]'], strategy: 'input' },
      refills: { selectors: ['#txtRefills', 'input[name*="refill" i]', 'input[name*="repeat" i]'], strategy: 'input' },
      duration: { selectors: ['#txtDuration', 'input[name*="duration" i]'], strategy: 'input' },
      route: { selectors: ['#selRoute', 'select[name*="route" i]'], strategy: 'select' },
      frequency: { selectors: ['#selFrequency', 'select[name*="frequency" i]', 'select[name*="freq" i]'], strategy: 'select' },
      indication: { selectors: ['textarea[name*="indication" i]', 'input[name*="indication" i]'], strategy: 'input' },
      pharmacyNote: { selectors: ['textarea[name*="pharmacy" i]', 'textarea[name*="note" i]'], strategy: 'append' },
    },
  },
  accuro: {
    label: 'Accuro',
    hosts: [/accuro/i, /qhr/i],
    detectSelectors: ['input[placeholder*="drug" i]', 'textarea[name*="instruction" i]'],
    fields: {
      medication: { selectors: ['input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[type="search"]'], strategy: 'search' },
      sig: { selectors: ['textarea[name*="instruction" i]', 'textarea[name*="sig" i]'], strategy: 'input' },
      quantity: { selectors: ['input[name*="quantity" i]', 'input[name*="qty" i]'], strategy: 'input' },
      refills: { selectors: ['input[name*="refill" i]', 'input[name*="repeat" i]'], strategy: 'input' },
      duration: { selectors: ['input[name*="duration" i]'], strategy: 'input' },
      route: { selectors: ['select[name*="route" i]'], strategy: 'select' },
      frequency: { selectors: ['select[name*="frequency" i]', 'input[name*="frequency" i]'], strategy: 'select' },
      indication: { selectors: ['textarea[name*="note" i]', 'textarea[name*="instruction" i]'], strategy: 'append' },
      pharmacyNote: { selectors: ['textarea[name*="pharmacy" i]', 'textarea[name*="note" i]'], strategy: 'append' },
    },
  },
  epic: {
    label: 'Epic',
    hosts: [/epic/i],
    detectSelectors: ['input[aria-label*="Medication" i]', 'textarea[aria-label*="Sig" i]', '[data-testid*="medication" i]'],
    fields: {
      medication: { selectors: ['input[aria-label*="Medication" i]', 'input[placeholder*="Medication" i]', '[data-testid*="medication"] input'], strategy: 'search' },
      sig: { selectors: ['textarea[aria-label*="Sig" i]', 'textarea[placeholder*="Sig" i]', 'textarea[name*="sig" i]'], strategy: 'input' },
      quantity: { selectors: ['input[aria-label*="Quantity" i]', 'input[name*="dispense" i]', 'input[name*="quantity" i]'], strategy: 'input' },
      refills: { selectors: ['input[aria-label*="Refill" i]', 'input[name*="refill" i]'], strategy: 'input' },
      duration: { selectors: ['input[aria-label*="Duration" i]', 'input[name*="duration" i]'], strategy: 'input' },
      route: { selectors: ['select[aria-label*="Route" i]', 'input[aria-label*="Route" i]'], strategy: 'select' },
      frequency: { selectors: ['select[aria-label*="Frequency" i]', 'input[aria-label*="Frequency" i]'], strategy: 'select' },
      indication: { selectors: ['textarea[aria-label*="Indication" i]', 'input[aria-label*="Indication" i]'], strategy: 'input' },
      pharmacyNote: { selectors: ['textarea[aria-label*="Pharmacy" i]', 'textarea[aria-label*="Comment" i]'], strategy: 'append' },
    },
  },
  athena: {
    label: 'Athena',
    hosts: [/athena/i],
    detectSelectors: ['input[placeholder*="medication" i]', 'textarea[placeholder*="sig" i]'],
    fields: {
      medication: { selectors: ['input[placeholder*="medication" i]', 'input[placeholder*="drug" i]', 'input[name*="medication" i]'], strategy: 'search' },
      sig: { selectors: ['textarea[placeholder*="sig" i]', 'textarea[name*="sig" i]', 'textarea[name*="instruction" i]'], strategy: 'input' },
      quantity: { selectors: ['input[name*="quantity" i]', 'input[name*="dispense" i]'], strategy: 'input' },
      refills: { selectors: ['input[name*="refill" i]', 'input[name*="repeat" i]'], strategy: 'input' },
      duration: { selectors: ['input[name*="duration" i]'], strategy: 'input' },
      route: { selectors: ['select[name*="route" i]', 'input[name*="route" i]'], strategy: 'select' },
      frequency: { selectors: ['select[name*="frequency" i]', 'input[name*="frequency" i]'], strategy: 'select' },
      indication: { selectors: ['textarea[name*="note" i]', 'textarea[name*="instruction" i]'], strategy: 'append' },
      pharmacyNote: { selectors: ['textarea[name*="pharmacy" i]', 'textarea[name*="comment" i]'], strategy: 'append' },
    },
  },
  generic: {
    label: 'Generic',
    hosts: [],
    detectSelectors: [],
    fields: {
      medication: { selectors: ['input[name*="drug" i]', 'input[name*="med" i]', 'input[placeholder*="drug" i]', 'input[placeholder*="medication" i]', 'input[type="search"]'], strategy: 'search' },
      sig: { selectors: ['textarea[name*="sig" i]', 'textarea[name*="instruction" i]', 'input[name*="sig" i]', 'input[name*="direction" i]'], strategy: 'input' },
      quantity: { selectors: ['input[name*="quantity" i]', 'input[name*="qty" i]', 'input[name*="dispense" i]'], strategy: 'input' },
      refills: { selectors: ['input[name*="refill" i]', 'input[name*="repeat" i]'], strategy: 'input' },
      duration: { selectors: ['input[name*="duration" i]', 'select[name*="duration" i]'], strategy: 'input' },
      route: { selectors: ['select[name*="route" i]', 'input[name*="route" i]'], strategy: 'select' },
      frequency: { selectors: ['select[name*="frequency" i]', 'select[name*="freq" i]', 'input[name*="frequency" i]'], strategy: 'select' },
      indication: { selectors: ['textarea[name*="indication" i]', 'input[name*="indication" i]', 'textarea[name*="note" i]'], strategy: 'append' },
      pharmacyNote: { selectors: ['textarea[name*="pharmacy" i]', 'textarea[name*="note" i]'], strategy: 'append' },
    },
  },
};

function findElement(selectors) {
  for (const selector of selectors || []) {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch {
      // Ignore invalid selectors from heuristics.
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

  const wanted = String(value).toLowerCase();
  for (const option of Array.from(element.options)) {
    if (option.value.toLowerCase() === wanted || option.text.toLowerCase() === wanted) {
      element.value = option.value;
      dispatchFormEvents(element);
      return true;
    }
  }

  for (const option of Array.from(element.options)) {
    if (option.text.toLowerCase().includes(wanted) || option.value.toLowerCase().includes(wanted)) {
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

function typeSearchField(element, value) {
  if (!element || !value) return false;
  element.focus();
  setElementValue(element, value);
  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    element.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', bubbles: true }));
  });
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
    const EventCtor =
      type === 'pointerdown' && typeof PointerEvent === 'function'
        ? PointerEvent
        : MouseEvent;
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
  return (
    options.find((option) => {
      const label = normalizeLooseText(option.getAttribute('title') || option.textContent);
      return wantedTokens.every((token) => label.includes(token));
    }) || options[0]
  );
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
  const queries = [
    raw,
    tokens.slice(0, 3).join(' '),
    tokens.slice(0, 2).join(' '),
    tokens[0],
  ].filter(Boolean);
  return [...new Set(queries)];
}

async function addOscarDrugRow(drugName) {
  if (!drugName || !document.getElementById('searchString') || !document.getElementById('rxText')) return null;

  for (const query of buildOscarSearchQueries(drugName)) {
    const initialIds = new Set(getOscarRowIds());
    setOscarSearchValue(query);

    const option = await waitFor(() => findBestOscarAutocompleteOption(drugName), 2200, 120)
      || await waitFor(() => findBestOscarAutocompleteOption(query), 1200, 120);
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

async function fillOscarRow(rowId, adapterFields) {
  const fields = getOscarRowFields(rowId);
  const filled = [];
  const missing = [];

  if (!fields.row) {
    return { success: false, filled, missing: ['row'], rowId: null };
  }

  if (fields.row) highlightElement(fields.row);

  if (adapterFields.instructions) {
    if (fields.instructions) {
      setElementValue(fields.instructions, adapterFields.instructions);
      highlightElement(fields.instructions);
      filled.push('instructions');
      await sleep(180);
    } else {
      missing.push('instructions');
    }
  }

  if (adapterFields.specialInstruction) {
    if (fields.specialInstruction) {
      if (fields.specialWrap && fields.specialWrap.style.display === 'none') {
        fields.specialWrap.style.display = 'block';
      }
      fields.specialInstruction.style.color = '#000';
      setElementValue(fields.specialInstruction, adapterFields.specialInstruction);
      highlightElement(fields.specialInstruction);
      filled.push('specialInstruction');
    } else {
      missing.push('specialInstruction');
    }
  }

  if (adapterFields.quantity) {
    if (fields.quantity) {
      setElementValue(fields.quantity, adapterFields.quantity);
      highlightElement(fields.quantity);
      filled.push('quantity');
    } else {
      missing.push('quantity');
    }
  }

  if (adapterFields.repeats !== undefined && adapterFields.repeats !== null && adapterFields.repeats !== '') {
    if (fields.repeats) {
      setElementValue(fields.repeats, adapterFields.repeats);
      highlightElement(fields.repeats);
      filled.push('repeats');
    } else {
      missing.push('repeats');
    }
  }

  if (adapterFields.noteToPharmacy) {
    if (fields.comment) {
      setElementValue(fields.comment, adapterFields.noteToPharmacy);
      highlightElement(fields.comment);
      filled.push('noteToPharmacy');
    } else {
      missing.push('noteToPharmacy');
    }
  }

  if (adapterFields.longTerm) {
    if (fields.longTerm) {
      fields.longTerm.checked = true;
      dispatchFormEvents(fields.longTerm);
      highlightElement(fields.longTerm);
      filled.push('longTerm');
    } else {
      missing.push('longTerm');
    }
  }

  return { success: filled.length > 0, filled, missing, rowId };
}

async function fillOscarPrescription(message) {
  const adapterFields = getAdapterFields(message, 'oscar');
  const drugName =
    adapterFields.drugName ||
    adapterFields.medication ||
    adapterFields.medicationDisplay;

  if (!drugName) {
    return {
      success: false,
      filledCount: 0,
      missing: ['drugName'],
      detectedEmr: 'oscar',
      message: 'No OSCAR drug name was provided in the TOL payload.',
    };
  }

  let rowId = await addOscarDrugRow(drugName);
  if (!rowId) {
    rowId = findOscarMatchingRowId(drugName);
  }

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

  const result = await fillOscarRow(rowId, adapterFields);
  if (result.filled.length) {
    showToast(`TOL prepared OSCAR row ${rowId} with ${result.filled.length} field${result.filled.length === 1 ? '' : 's'}`);
  } else {
    showToast('TOL found the OSCAR row but could not populate the expected fields', 'warn');
  }

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

function detectEmr() {
  const host = location.hostname;
  const path = location.pathname || '';

  if (/junoemr\.com$/i.test(host) && /\/juno\/oscarRx\//i.test(path)) {
    return { key: 'oscar', label: EMR_DEFS.oscar.label };
  }

  for (const [key, def] of Object.entries(EMR_DEFS)) {
    if (key === 'generic') continue;
    if (def.hosts.some((pattern) => pattern.test(host))) {
      return { key, label: def.label };
    }
    if (findElement(def.detectSelectors)) {
      return { key, label: def.label };
    }
  }

  return { key: 'generic', label: EMR_DEFS.generic.label };
}

function getAdapterFields(message, emrType) {
  if (message.normalized?.adapterFields) return message.normalized.adapterFields;
  if (message.payload?.adapters?.[emrType]?.fields) return message.payload.adapters[emrType].fields;
  if (message.payload?.adapter?.type === emrType && message.payload?.adapter?.fields) return message.payload.adapter.fields;

  if (message.payload?._tol && message.payload?.medication) {
    return {
      medication: message.payload.medication,
      sig: message.payload.sig,
      quantity: message.payload.quantity,
      frequency: message.payload.frequency,
      duration: message.payload.duration,
      refills: message.payload.refills,
      route: message.payload.route,
      indication: message.payload.condition,
    };
  }

  return {};
}

async function fillPrescription(message) {
  const detected = detectEmr();
  const requestedEmr = message.emrType && message.emrType !== 'auto' ? message.emrType : detected.key;
  const emrDef = EMR_DEFS[requestedEmr] || EMR_DEFS.generic;

  if (requestedEmr === 'oscar') {
    return fillOscarPrescription(message);
  }

  const adapterFields = getAdapterFields(message, requestedEmr);
  const filled = [];
  const missing = [];

  for (const [adapterField, value] of Object.entries(adapterFields)) {
    const logicalField = FIELD_ALIASES[adapterField] || adapterField;
    const fieldDef = emrDef.fields[logicalField] || EMR_DEFS.generic.fields[logicalField];
    if (!fieldDef || value === '' || value === null || value === undefined) continue;
    const target = findElement(fieldDef.selectors);
    if (!target) {
      missing.push(adapterField);
      continue;
    }
    const ok = fillElement(fieldDef, value);
    if (ok) {
      highlightElement(target);
      filled.push(adapterField);
    } else {
      missing.push(adapterField);
    }
  }

  if (filled.length) {
    showToast(`TOL filled ${filled.length} field${filled.length === 1 ? '' : 's'} on ${emrDef.label}`);
  } else {
    showToast(`TOL could not find matching ${emrDef.label} fields on this page`, 'warn');
  }

  return {
    success: filled.length > 0,
    filledCount: filled.length,
    missing,
    detectedEmr: detected.key,
    message:
      filled.length > 0
        ? `Filled ${filled.length} fields on ${emrDef.label}.`
        : `No matching ${emrDef.label} fields were found on this page.`,
  };
}

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'detectEmr') {
    const detected = detectEmr();
    sendResponse({
      emrType: detected.key,
      emrLabel: detected.label,
      title: document.title || '',
      url: location.href,
    });
    return;
  }

  if (message.action === 'fillRx') {
    Promise.resolve(fillPrescription(message))
      .then((result) => sendResponse(result))
      .catch((error) => {
        sendResponse({
          success: false,
          filledCount: 0,
          missing: [],
          detectedEmr: detectEmr().key,
          message: error?.message || 'TOL could not fill fields on this page.',
        });
      });
    return true;
  }
});
