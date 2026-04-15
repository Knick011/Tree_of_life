// popup.js — Tree of Life EMR Rx Filler popup logic

let rxData = null;

const statusBox = document.getElementById('statusBox');
const fieldList = document.getElementById('fieldList');
const fillBtn = document.getElementById('fillBtn');
const readBtn = document.getElementById('readBtn');
const emrSelect = document.getElementById('emrSelect');

// Restore last EMR selection
chrome.storage?.local?.get('emrType', (r) => {
  if (r?.emrType) emrSelect.value = r.emrType;
});

emrSelect.addEventListener('change', () => {
  chrome.storage?.local?.set({ emrType: emrSelect.value });
});

// Read clipboard for TOL Rx JSON
async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);

    // Validate it's TOL data
    if (!parsed._tol || !parsed.medication) {
      showEmpty('Clipboard has data but it is not from Tree of Life. Use "Copy for EMR" in TOL.');
      return;
    }

    rxData = parsed;
    showReady(parsed);
  } catch (e) {
    showEmpty('No valid Rx data in clipboard. Copy a prescription from Tree of Life first.');
  }
}

function showEmpty(msg) {
  rxData = null;
  statusBox.className = 'status-box status-empty';
  statusBox.textContent = msg;
  fieldList.hidden = true;
  fillBtn.disabled = true;
}

function showReady(data) {
  statusBox.className = 'status-box status-ready';
  statusBox.innerHTML = `<strong>Rx ready to fill</strong><br>${data.medication}`;

  // Show field breakdown
  const fields = [
    ['Medication', data.medication],
    ['Sig', data.sig],
    ['Quantity', data.quantity],
    ['Frequency', data.frequency],
    ['Duration', data.duration],
    ['Refills', data.refills],
    ['Route', data.route],
  ].filter(([, v]) => v);

  let html = '';
  fields.forEach(([label, val]) => {
    html += `<div><span>${label}</span><span class="val">${val}</span></div>`;
  });
  fieldList.innerHTML = html;
  fieldList.hidden = false;
  fillBtn.disabled = false;
}

// Fill button — send data to content script
fillBtn.addEventListener('click', async () => {
  if (!rxData) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const emrType = emrSelect.value;

  chrome.tabs.sendMessage(tab.id, {
    action: 'fillRx',
    emrType: emrType,
    data: rxData,
  }, (response) => {
    if (chrome.runtime.lastError) {
      statusBox.innerHTML = '<strong>Error:</strong> Could not reach the page. Make sure you are on an EMR Rx page and refresh it.';
      statusBox.className = 'status-box status-empty';
      return;
    }
    if (response?.success) {
      statusBox.innerHTML = `<strong>Filled ${response.filledCount} fields</strong> on ${emrType.toUpperCase()}`;
      statusBox.className = 'status-box status-ready';
      fillBtn.textContent = 'Done!';
      setTimeout(() => { fillBtn.textContent = 'Fill Rx Fields'; }, 2000);
    } else {
      statusBox.innerHTML = `<strong>Partial fill:</strong> ${response?.message || 'Some fields may not have been found.'}`;
    }
  });
});

readBtn.addEventListener('click', readClipboard);

// Auto-read on popup open
readClipboard();
