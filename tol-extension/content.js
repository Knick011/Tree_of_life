// content.js — Tree of Life EMR Rx Filler
// Runs on all pages; listens for messages from popup to fill Rx fields.

// ─── EMR Field Mappings ─────────────────────────────────────────────
// Each EMR has a map of TOL field names → CSS selectors or field strategies.
// Strategies: 'input' (set value), 'select' (set selected option), 'search' (type + trigger),
//             'check' (set checkbox).

const EMR_MAPS = {

  // ─── OSCAR / Juno ──────────────────────────────────────────────
  oscar: {
    name: 'OSCAR',
    // OSCAR uses dynamic IDs with randomId suffixes, so we match by name prefix or known patterns
    fields: {
      medication: {
        // The drug search box
        selectors: ['#searchString', 'input[name="searchString"]', 'input[id*="searchString"]'],
        strategy: 'search',
      },
      sig: {
        selectors: ['textarea[name="special"]', 'textarea[name*="special"]', 'input[name*="instruction"]'],
        strategy: 'input',
      },
      quantity: {
        selectors: ['input[name="quantity"]', 'input[name*="quantity"]'],
        strategy: 'input',
      },
      frequency: {
        selectors: ['select[name="frequencyCode"]', 'select[name*="frequency"]'],
        strategy: 'select',
      },
      duration: {
        selectors: ['select[name="cmbDuration"]', 'input[name="txtDuration"]', 'input[name*="duration"]'],
        strategy: 'input',
      },
      durationUnit: {
        selectors: ['select[name="durationUnit"]'],
        strategy: 'select',
      },
      refills: {
        selectors: ['select[name="cmbRepeat"]', 'input[name="txtRepeat"]', 'input[name*="repeat"]'],
        strategy: 'input',
      },
      route: {
        selectors: ['select[name="route"]', 'select[name*="route"]'],
        strategy: 'select',
      },
      take: {
        selectors: ['select[name="take"]', 'input[name="takeOther"]'],
        strategy: 'input',
      },
      unit: {
        selectors: ['select[name="unit"]'],
        strategy: 'select',
      },
      method: {
        selectors: ['select[name="method"]'],
        strategy: 'select',
      },
      prn: {
        selectors: ['input[name="prn"]', 'input[id*="prn"]'],
        strategy: 'check',
      },
      longTerm: {
        selectors: ['input[name="longTerm"]'],
        strategy: 'check',
      },
      nosubs: {
        selectors: ['input[name="nosubs"]'],
        strategy: 'check',
      },
    },
  },

  // ─── PS Suite (Telus) ──────────────────────────────────────────
  pssuite: {
    name: 'PS Suite',
    fields: {
      medication: {
        selectors: ['input[type="text"][class*="drug"]', 'input[type="text"][class*="search"]', 'input[type="text"][placeholder*="drug"]', 'input[type="text"][placeholder*="medication"]', '#drugSearch', '#txtDrugName'],
        strategy: 'search',
      },
      sig: {
        selectors: ['textarea[name*="instruction"]', 'textarea[name*="sig"]', 'input[name*="instruction"]', 'input[name*="sig"]', '#txtSig', '#txtInstructions'],
        strategy: 'input',
      },
      quantity: {
        selectors: ['input[name*="quantity"]', 'input[name*="qty"]', '#txtQuantity', '#txtQty'],
        strategy: 'input',
      },
      frequency: {
        selectors: ['select[name*="frequency"]', 'select[name*="freq"]', 'input[name*="frequency"]', '#selFrequency'],
        strategy: 'select',
      },
      duration: {
        selectors: ['input[name*="duration"]', '#txtDuration'],
        strategy: 'input',
      },
      refills: {
        selectors: ['input[name*="refill"]', 'input[name*="repeat"]', '#txtRefills'],
        strategy: 'input',
      },
      route: {
        selectors: ['select[name*="route"]', '#selRoute'],
        strategy: 'select',
      },
    },
  },

  // ─── Accuro (QHR) ─────────────────────────────────────────────
  accuro: {
    name: 'Accuro',
    fields: {
      medication: {
        selectors: ['input[type="text"][class*="drug"]', 'input[type="text"][placeholder*="drug"]', 'input[type="text"][placeholder*="medication"]', 'input[type="search"]'],
        strategy: 'search',
      },
      sig: {
        selectors: ['textarea[name*="instruction"]', 'textarea[name*="sig"]', 'input[name*="instruction"]', 'input[name*="sig"]'],
        strategy: 'input',
      },
      quantity: {
        selectors: ['input[name*="quantity"]', 'input[name*="qty"]'],
        strategy: 'input',
      },
      frequency: {
        selectors: ['select[name*="frequency"]', 'input[name*="frequency"]'],
        strategy: 'select',
      },
      duration: {
        selectors: ['input[name*="duration"]'],
        strategy: 'input',
      },
      refills: {
        selectors: ['input[name*="refill"]', 'input[name*="repeat"]'],
        strategy: 'input',
      },
      route: {
        selectors: ['select[name*="route"]'],
        strategy: 'select',
      },
    },
  },

  // ─── Generic fallback ─────────────────────────────────────────
  generic: {
    name: 'Generic',
    fields: {
      medication: {
        selectors: ['input[type="text"][name*="drug" i]', 'input[type="text"][name*="med" i]', 'input[type="text"][placeholder*="drug" i]', 'input[type="text"][placeholder*="med" i]', 'input[type="search"]'],
        strategy: 'search',
      },
      sig: {
        selectors: ['textarea[name*="instruction" i]', 'textarea[name*="sig" i]', 'input[name*="instruction" i]', 'input[name*="sig" i]', 'input[name*="direction" i]'],
        strategy: 'input',
      },
      quantity: {
        selectors: ['input[name*="quantity" i]', 'input[name*="qty" i]', 'input[name*="dispense" i]'],
        strategy: 'input',
      },
      frequency: {
        selectors: ['select[name*="frequency" i]', 'select[name*="freq" i]', 'input[name*="frequency" i]'],
        strategy: 'select',
      },
      duration: {
        selectors: ['input[name*="duration" i]'],
        strategy: 'input',
      },
      refills: {
        selectors: ['input[name*="refill" i]', 'input[name*="repeat" i]'],
        strategy: 'input',
      },
      route: {
        selectors: ['select[name*="route" i]'],
        strategy: 'select',
      },
    },
  },
};

// ─── Field Filling Logic ────────────────────────────────────────────

function findElement(selectors) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch { /* invalid selector, skip */ }
  }
  return null;
}

function setInputValue(el, value) {
  if (!el || !value) return false;
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value'
  )?.set;
  if (nativeSetter) nativeSetter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}

function setSelectValue(el, value) {
  if (!el || !value) return false;
  const valLower = value.toLowerCase();

  // Try exact match first
  for (const opt of el.options) {
    if (opt.value.toLowerCase() === valLower || opt.text.toLowerCase() === valLower) {
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  // Try partial match
  for (const opt of el.options) {
    if (opt.text.toLowerCase().includes(valLower) || opt.value.toLowerCase().includes(valLower)) {
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  // Fallback: try setting as input
  return setInputValue(el, value);
}

function setCheckbox(el, value) {
  if (!el) return false;
  const shouldCheck = value === true || value === 'true' || value === 'yes' || value === '1';
  if (el.checked !== shouldCheck) {
    el.checked = shouldCheck;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('click', { bubbles: true }));
  }
  return true;
}

function typeSearchField(el, value) {
  if (!el || !value) return false;
  el.focus();
  setInputValue(el, value);
  // Simulate keystrokes to trigger type-ahead
  for (const char of value) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
  }
  return true;
}

function fillField(fieldDef, value) {
  if (!value && value !== false) return false;
  const el = findElement(fieldDef.selectors);
  if (!el) return false;

  switch (fieldDef.strategy) {
    case 'input': return setInputValue(el, String(value));
    case 'select': return setSelectValue(el, String(value));
    case 'search': return typeSearchField(el, String(value));
    case 'check': return setCheckbox(el, value);
    default: return setInputValue(el, String(value));
  }
}

// ─── Message Handler ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'fillRx') return;

  const emrType = msg.emrType || 'generic';
  const emrMap = EMR_MAPS[emrType] || EMR_MAPS.generic;
  const data = msg.data;
  let filledCount = 0;

  // Map TOL data fields to EMR fields
  const fieldValues = {
    medication: data.medication,
    sig: data.sig,
    quantity: data.quantity,
    frequency: data.frequency,
    duration: data.duration,
    durationUnit: data.durationUnit,
    refills: data.refills,
    route: data.route,
    take: data.take,
    unit: data.unit,
    method: data.method,
    prn: data.prn,
    longTerm: data.longTerm,
    nosubs: data.nosubs,
  };

  for (const [field, value] of Object.entries(fieldValues)) {
    const fieldDef = emrMap.fields[field];
    if (!fieldDef) continue;
    if (fillField(fieldDef, value)) filledCount++;
  }

  sendResponse({
    success: filledCount > 0,
    filledCount,
    message: filledCount > 0
      ? `Filled ${filledCount} fields on ${emrMap.name}`
      : `No matching fields found on this page for ${emrMap.name}. Make sure you are on the Rx/prescription page.`,
  });
});
