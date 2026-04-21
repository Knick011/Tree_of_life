const ext = globalThis.browser ?? globalThis.chrome;

const state = {
  rawPayload: null,
  normalized: null,
  detectedEmr: '',
};

const statusBox = document.getElementById('statusBox');
const pageHint = document.getElementById('pageHint');
const fieldList = document.getElementById('fieldList');
const fillBtn = document.getElementById('fillBtn');
const readBtn = document.getElementById('readBtn');
const loadBtn = document.getElementById('loadBtn');
const emrSelect = document.getElementById('emrSelect');
const payloadInput = document.getElementById('payloadInput');

const LABELS = {
  medication: 'Medication',
  medicationDisplay: 'Medication',
  drugName: 'Medication',
  instructions: 'Instructions',
  sig: 'Sig',
  quantity: 'Quantity',
  dispenseQuantity: 'Dispense quantity',
  repeats: 'Repeats',
  refills: 'Refills',
  duration: 'Duration',
  indication: 'Indication',
  specialInstruction: 'Indication',
  patientNote: 'Patient note',
  noteToPharmacy: 'Pharmacy note',
  pharmacyNote: 'Pharmacy note',
  route: 'Route',
  frequency: 'Frequency',
  frequencyCode: 'Frequency',
};

function getSelectedEmr() {
  if (emrSelect.value !== 'auto') return emrSelect.value;
  if (state.normalized?.defaultEmr) return state.normalized.defaultEmr;
  if (state.detectedEmr) return state.detectedEmr;
  return 'generic';
}

function storageGet(key) {
  if (!ext?.storage?.local?.get) return Promise.resolve({});
  try {
    const result = ext.storage.local.get(key);
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch {
    // Fall through to callback form.
  }
  return new Promise((resolve) => {
    ext.storage.local.get(key, (result) => resolve(result || {}));
  });
}

function storageSet(data) {
  if (!ext?.storage?.local?.set) return Promise.resolve();
  try {
    const result = ext.storage.local.set(data);
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch {
    // Fall through to callback form.
  }
  return new Promise((resolve) => {
    ext.storage.local.set(data, () => resolve());
  });
}

function queryActiveTab() {
  if (!ext?.tabs?.query) return Promise.resolve([]);
  try {
    const result = ext.tabs.query({ active: true, currentWindow: true });
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch {
    // Fall through to callback form.
  }
  return new Promise((resolve) => {
    ext.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs || []));
  });
}

function sendMessage(tabId, message) {
  if (!ext?.tabs?.sendMessage) return Promise.reject(new Error('tabs.sendMessage unavailable'));
  try {
    const result = ext.tabs.sendMessage(tabId, message);
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch {
    // Fall through to callback form.
  }
  return new Promise((resolve, reject) => {
    ext.tabs.sendMessage(tabId, message, (response) => {
      const runtimeError = ext.runtime?.lastError;
      if (runtimeError) {
        reject(runtimeError);
        return;
      }
      resolve(response);
    });
  });
}

function setStatus(kind, html) {
  statusBox.className = `status-box status-${kind}`;
  statusBox.innerHTML = html;
}

function showEmpty(message) {
  state.rawPayload = null;
  state.normalized = null;
  fieldList.hidden = true;
  fillBtn.disabled = true;
  setStatus('empty', message);
}

function prettifyFieldName(name) {
  return LABELS[name] || name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (ch) => ch.toUpperCase());
}

function normalizePayload(parsed, chosenEmr = '') {
  if (!parsed || parsed._tol !== true) return null;

  if (parsed.schemaVersion >= 2 && parsed.canonical) {
    const defaultEmr = parsed.adapter?.type || parsed.canonical.emrType || 'generic';
    const emrType = chosenEmr || defaultEmr;
    const adapterFields = parsed.adapters?.[emrType]?.fields || parsed.adapter?.fields || {};
    return {
      type: 'v2',
      defaultEmr,
      emrType,
      adapterFields,
      canonical: parsed.canonical,
      medicationLabel: parsed.canonical.medicationDisplay || adapterFields.medication || adapterFields.medicationDisplay || '-',
    };
  }

  const defaultEmr = chosenEmr || 'generic';
  return {
    type: 'legacy',
    defaultEmr,
    emrType: defaultEmr,
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
    canonical: {
      medicationDisplay: parsed.medication,
      sig: parsed.sig,
      route: parsed.route,
      frequencyCode: parsed.frequency,
      dispense: { raw: parsed.quantity || '' },
      duration: parsed.duration,
      refills: parsed.refills,
      indication: parsed.condition,
      emrType: defaultEmr,
    },
    medicationLabel: parsed.medication || '-',
  };
}

function renderFieldPreview(normalized) {
  const fields = Object.entries(normalized.adapterFields || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined);
  if (!fields.length) {
    fieldList.hidden = true;
    return;
  }

  fieldList.hidden = false;
  fieldList.innerHTML = fields
    .map(([name, value]) => `<div><span>${prettifyFieldName(name)}</span><span class="val">${String(value)}</span></div>`)
    .join('');
}

function showReady(normalized) {
  setStatus(
    'ready',
    `<strong>Draft ready to fill</strong><br>${normalized.medicationLabel}<br><span class="status-subtle">Target: ${getSelectedEmr().toUpperCase()}</span>`
  );
  renderFieldPreview(normalized);
  fillBtn.disabled = false;
}

function applyPayload(parsed, preferredEmr = '') {
  const normalized = normalizePayload(parsed, preferredEmr);
  if (!normalized) {
    showEmpty('Clipboard or pasted text is not a valid TOL Scribe payload.');
    return;
  }
  state.rawPayload = parsed;
  state.normalized = normalized;
  showReady(normalized);
}

async function detectCurrentPage() {
  try {
    const [tab] = await queryActiveTab();
    if (!tab?.id) return;
    const response = await sendMessage(tab.id, { action: 'detectEmr' });
    state.detectedEmr = response?.emrType || '';
    const emrLabel = response?.emrLabel || 'Unknown';
    const pageLabel = response?.title || response?.url || 'Active page';
    pageHint.textContent = `Page: ${emrLabel} · ${pageLabel}`;
    if (emrSelect.value === 'auto' && state.normalized) {
      showReady(state.normalized);
    }
  } catch {
    pageHint.textContent = 'Page detection unavailable on this tab.';
  }
}

async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    payloadInput.value = text;
    applyPayload(JSON.parse(text), getSelectedEmr());
  } catch {
    showEmpty('No valid TOL Scribe payload found in the clipboard. Use "Copy for EMR" first.');
  }
}

async function fillActivePage() {
  if (!state.rawPayload || !state.normalized) return;

  try {
    const [tab] = await queryActiveTab();
    if (!tab?.id) {
      setStatus('empty', '<strong>Error:</strong> No active tab found.');
      return;
    }

    const emrType = getSelectedEmr();
    const response = await sendMessage(tab.id, {
      action: 'fillRx',
      emrType,
      payload: state.rawPayload,
      normalized: normalizePayload(state.rawPayload, emrType),
    });

    if (response?.success) {
      const missing = response.missing?.length ? `<br><span class="status-subtle">Missing: ${response.missing.join(', ')}</span>` : '';
      setStatus('ready', `<strong>Filled ${response.filledCount} fields</strong>${missing}`);
      fillBtn.textContent = 'Filled';
      setTimeout(() => { fillBtn.textContent = 'Fill Fields'; }, 1200);
      return;
    }

    setStatus('empty', `<strong>Fill failed:</strong> ${response?.message || 'No matching fields were found on the current page.'}`);
  } catch {
    setStatus('empty', '<strong>Error:</strong> Could not reach the page. Refresh the EMR tab and try again.');
  }
}

loadBtn.addEventListener('click', () => {
  try {
    applyPayload(JSON.parse(payloadInput.value), getSelectedEmr());
  } catch {
    showEmpty('Pasted text is not valid JSON.');
  }
});

readBtn.addEventListener('click', readClipboard);
fillBtn.addEventListener('click', fillActivePage);

emrSelect.addEventListener('change', async () => {
  await storageSet({ emrType: emrSelect.value });
  if (state.rawPayload) {
    applyPayload(state.rawPayload, getSelectedEmr());
  }
});

(async () => {
  const stored = await storageGet('emrType');
  if (stored?.emrType) emrSelect.value = stored.emrType;
  await detectCurrentPage();
  await readClipboard();
})();
