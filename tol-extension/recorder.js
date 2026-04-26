// TOL Scribe — Recorder mode
// Lets a clinician click each prescription form field on a page, in a guided
// sequence, and persists the resulting selectors into chrome.storage so the
// Filler can use them on subsequent visits to the same EMR / host.
//
// Storage shape (chrome.storage.sync, falls back to local):
//   tolFieldMappings: {
//     "<host>": {
//       "<emrType>": {
//         medication: { selector, strategy, recordedAt },
//         sig:        { selector, strategy, recordedAt },
//         ...
//       }
//     }
//   }

(function (global) {
  const ext = global.browser ?? global.chrome;
  const STORAGE_KEY = 'tolFieldMappings';

  const FIELD_SEQUENCE = [
    { id: 'medication', label: 'Drug name field', strategy: 'search' },
    { id: 'sig',        label: 'Sig / instructions field', strategy: 'input' },
    { id: 'quantity',   label: 'Quantity / dispense field', strategy: 'input' },
    { id: 'refills',    label: 'Refills / repeats field', strategy: 'input' },
    { id: 'duration',   label: 'Duration field', strategy: 'input' },
    { id: 'route',      label: 'Route field', strategy: 'select' },
    { id: 'frequency',  label: 'Frequency field', strategy: 'select' },
    { id: 'indication', label: 'Indication / reason field', strategy: 'input' },
    { id: 'pharmacyNote', label: 'Pharmacy note field', strategy: 'append' },
  ];

  let recorderState = null;

  function storageGet(key) {
    return new Promise((resolve) => {
      try {
        const root = ext?.storage?.sync || ext?.storage?.local;
        if (!root) return resolve(null);
        root.get(key, (r) => resolve(r?.[key] || null));
      } catch { resolve(null); }
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      try {
        const root = ext?.storage?.sync || ext?.storage?.local;
        if (!root) return resolve();
        root.set({ [key]: value }, () => resolve());
      } catch { resolve(); }
    });
  }

  // Build best-effort selector for an element. Priority: id > name > aria-label >
  // data-testid > tag+class chain. Fragility heuristic: warn if class chain is the
  // only available signal because it's most likely to break on UI updates.
  function buildSelectorForElement(el) {
    if (!el || !el.tagName) return { selector: null, fragile: true };
    if (el.id) return { selector: `#${cssEscape(el.id)}`, fragile: false };
    const name = el.getAttribute('name');
    if (name) return { selector: `${el.tagName.toLowerCase()}[name="${cssEscape(name)}"]`, fragile: false };
    const aria = el.getAttribute('aria-label');
    if (aria) return { selector: `${el.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`, fragile: false };
    const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id');
    if (testId) return { selector: `[data-testid="${cssEscape(testId)}"]`, fragile: false };
    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return { selector: `${el.tagName.toLowerCase()}[placeholder="${cssEscape(placeholder)}"]`, fragile: false };
    // Fallback: tag + first stable class
    const cls = (el.className || '').split(/\s+/).filter(Boolean).filter((c) => !/^(focus|active|hover|valid|invalid|ng-)/i.test(c))[0];
    if (cls) return { selector: `${el.tagName.toLowerCase()}.${cssEscape(cls)}`, fragile: true };
    return { selector: el.tagName.toLowerCase(), fragile: true };
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
  }

  function showOverlay(html) {
    let el = document.getElementById('__tol_recorder_overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = '__tol_recorder_overlay';
      el.style.cssText = [
        'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
        'z-index:2147483647', 'background:#162231', 'color:#fff',
        'padding:14px 18px', 'border-radius:10px', 'font-family:Segoe UI, Arial, sans-serif',
        'font-size:13px', 'box-shadow:0 18px 50px rgba(0,0,0,0.32)',
        'max-width:480px', 'min-width:320px', 'line-height:1.5',
      ].join(';');
      document.documentElement.appendChild(el);
    }
    el.innerHTML = html;
    return el;
  }

  function hideOverlay() {
    const el = document.getElementById('__tol_recorder_overlay');
    if (el) el.remove();
  }

  function inferStrategyFromElement(el, declared) {
    if (!el) return declared;
    if (el.tagName === 'SELECT') return 'select';
    if (el.type === 'checkbox') return 'checkbox';
    if (el.tagName === 'TEXTAREA' && declared === 'append') return 'append';
    if (el.tagName === 'TEXTAREA') return 'input';
    return declared || 'input';
  }

  function highlightHover(e) {
    if (!recorderState) return;
    const el = e.target;
    if (!el || el.closest('#__tol_recorder_overlay')) return;
    if (recorderState.lastHover && recorderState.lastHover !== el) {
      recorderState.lastHover.style.outline = recorderState.lastHoverOutline || '';
    }
    recorderState.lastHover = el;
    recorderState.lastHoverOutline = el.style.outline;
    el.style.outline = '3px solid #f59e0b';
    el.style.outlineOffset = '1px';
  }

  function onPickClick(e) {
    if (!recorderState) return;
    const el = e.target;
    if (!el || el.closest('#__tol_recorder_overlay')) return;
    e.preventDefault();
    e.stopPropagation();
    if (recorderState.lastHover) {
      recorderState.lastHover.style.outline = recorderState.lastHoverOutline || '';
      recorderState.lastHover = null;
    }
    const stepIdx = recorderState.stepIdx;
    const step = FIELD_SEQUENCE[stepIdx];
    const built = buildSelectorForElement(el);
    if (!built.selector) {
      renderStep(`Could not build a selector for that element. Try clicking another field, or skip.`);
      return;
    }
    const strategy = inferStrategyFromElement(el, step.strategy);
    recorderState.mappings[step.id] = {
      selector: built.selector,
      strategy,
      recordedAt: new Date().toISOString(),
      fragile: built.fragile,
    };
    advance();
  }

  function advance() {
    recorderState.stepIdx++;
    if (recorderState.stepIdx >= FIELD_SEQUENCE.length) {
      finish();
    } else {
      renderStep();
    }
  }

  function skip() {
    if (!recorderState) return;
    advance();
  }

  function renderStep(extraNote) {
    const idx = recorderState.stepIdx;
    const step = FIELD_SEQUENCE[idx];
    const recorded = recorderState.mappings[step.id];
    const fragileBadge = recorded?.fragile ? `<span style="color:#fbbf24"> · fragile</span>` : '';
    const html = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px">
        <strong>Teach EMR — step ${idx + 1} of ${FIELD_SEQUENCE.length}</strong>
        <button id="__tol_recorder_cancel" style="border:none;background:transparent;color:#fff;font-size:18px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="margin-bottom:8px">Click the <strong>${step.label}</strong> in the EMR.</div>
      ${extraNote ? `<div style="color:#fbbf24;margin-bottom:8px">${extraNote}</div>` : ''}
      ${recorded ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:8px">Recorded: <code>${recorded.selector}</code>${fragileBadge}</div>` : ''}
      <div style="display:flex;gap:8px">
        <button id="__tol_recorder_skip" style="flex:1;background:#374151;color:#fff;border:none;border-radius:6px;padding:6px;cursor:pointer">Skip this field</button>
        <button id="__tol_recorder_finish" style="flex:1;background:#0d7377;color:#fff;border:none;border-radius:6px;padding:6px;cursor:pointer">Finish &amp; save</button>
      </div>
      <div style="margin-top:6px;font-size:11px;color:#94a3b8">Hover highlights what TOL will record.</div>
    `;
    const el = showOverlay(html);
    el.querySelector('#__tol_recorder_cancel').addEventListener('click', cancel);
    el.querySelector('#__tol_recorder_skip').addEventListener('click', skip);
    el.querySelector('#__tol_recorder_finish').addEventListener('click', finish);
  }

  async function finish() {
    if (!recorderState) return;
    const host = location.host;
    const { emrType, mappings } = recorderState;
    const all = (await storageGet(STORAGE_KEY)) || {};
    all[host] = all[host] || {};
    all[host][emrType] = { ...(all[host][emrType] || {}), ...mappings };
    await storageSet(STORAGE_KEY, all);
    teardown();
    showOverlay(`<div><strong>Saved.</strong> ${Object.keys(mappings).length} field${Object.keys(mappings).length === 1 ? '' : 's'} recorded for <code>${host}</code> · ${emrType}.</div>`);
    setTimeout(hideOverlay, 2400);
  }

  function cancel() {
    teardown();
    showOverlay(`<div><strong>Cancelled.</strong> Nothing saved.</div>`);
    setTimeout(hideOverlay, 1200);
  }

  function teardown() {
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('mouseover', highlightHover, true);
    if (recorderState?.lastHover) {
      recorderState.lastHover.style.outline = recorderState.lastHoverOutline || '';
    }
    recorderState = null;
  }

  function start(emrType) {
    if (recorderState) return;
    recorderState = {
      emrType: emrType || 'generic',
      stepIdx: 0,
      mappings: {},
      lastHover: null,
      lastHoverOutline: '',
    };
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('mouseover', highlightHover, true);
    renderStep();
  }

  // Expose accessors so the Filler can pick up recorded selectors at runtime.
  async function loadRecordedFieldsForHost(host, emrType) {
    const all = (await storageGet(STORAGE_KEY)) || {};
    return all[host]?.[emrType] || null;
  }

  global.TOLRecorder = { start, loadRecordedFieldsForHost };
})(typeof window !== 'undefined' ? window : globalThis);
