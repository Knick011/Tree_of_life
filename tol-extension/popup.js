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

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function appendTextLine(container, text, className = '') {
  const line = document.createElement('div');
  if (className) line.className = className;
  line.textContent = text;
  container.appendChild(line);
}

function setStatus(kind, { title = '', body = '', subtle = '' } = {}) {
  statusBox.className = `status-box status-${kind}`;
  clearNode(statusBox);

  if (title) {
    const strong = document.createElement('strong');
    strong.textContent = title;
    statusBox.appendChild(strong);
  }

  if (body) {
    if (title) statusBox.appendChild(document.createElement('br'));
    statusBox.appendChild(document.createTextNode(body));
  }

  if (subtle) {
    if (title || body) statusBox.appendChild(document.createElement('br'));
    appendTextLine(statusBox, subtle, 'status-subtle');
  }
}

function showEmpty(message) {
  state.rawPayload = null;
  state.normalized = null;
  fieldList.hidden = true;
  clearNode(fieldList);
  fillBtn.disabled = true;
  setStatus('empty', { body: message });
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
    clearNode(fieldList);
    return;
  }

  fieldList.hidden = false;
  clearNode(fieldList);
  fields.forEach(([name, value]) => {
    const row = document.createElement('div');
    const label = document.createElement('span');
    const val = document.createElement('span');
    label.textContent = prettifyFieldName(name);
    val.className = 'val';
    val.textContent = String(value);
    row.appendChild(label);
    row.appendChild(val);
    fieldList.appendChild(row);
  });
}

function showReady(normalized) {
  setStatus('ready', {
    title: 'Draft ready to fill',
    body: normalized.medicationLabel,
    subtle: `Target: ${getSelectedEmr().toUpperCase()}`,
  });
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
    const sourceLabel = state.normalized?.defaultEmr ? `Payload: ${state.normalized.defaultEmr.toUpperCase()} · ` : '';
    pageHint.textContent = `${sourceLabel}Page: ${emrLabel} · ${pageLabel}`;
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
      setStatus('empty', { title: 'Error', body: 'No active tab found.' });
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
      setStatus('ready', {
        title: `Filled ${response.filledCount} field${response.filledCount === 1 ? '' : 's'}`,
        subtle: response.missing?.length ? `Missing: ${response.missing.join(', ')}` : '',
      });
      fillBtn.textContent = 'Filled';
      setTimeout(() => { fillBtn.textContent = 'Fill Fields'; }, 1200);
      return;
    }

    setStatus('empty', {
      title: 'Fill failed',
      body: response?.message || 'No matching fields were found on the current page.',
    });
  } catch {
    setStatus('empty', {
      title: 'Error',
      body: 'Could not reach the page. Refresh the EMR tab and try again.',
    });
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
  await detectCurrentPage();
});

(async () => {
  const stored = await storageGet('emrType');
  if (stored?.emrType) emrSelect.value = stored.emrType;
  await detectCurrentPage();
  await readClipboard();
})();
