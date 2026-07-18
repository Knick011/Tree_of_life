const { execFileSync } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = __dirname;
const BUILD_SCRIPT = path.join(ROOT, 'build-extension-packages.py');
const CHROMIUM_EXTENSION_DIR = path.join(ROOT, '.build-extension', 'chromium');
const BASE_URL = 'http://127.0.0.1:4173';

function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server did not start at ${url}`));
          return;
        }
        setTimeout(tryOnce, 250);
      });
    };
    tryOnce();
  });
}

function buildExtension() {
  execFileSync('python', [BUILD_SCRIPT], { cwd: ROOT, stdio: 'inherit' });
  if (!fs.existsSync(CHROMIUM_EXTENSION_DIR)) {
    throw new Error('Chromium extension build directory is missing.');
  }
}

function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, contents) => {
      if (error) {
        const code = error.code === 'ENOENT' ? 404 : 500;
        res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(code === 404 ? 'Not found' : 'Server error');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(contents);
    });
  });

  return new Promise((resolve) => {
    server.listen(4173, '127.0.0.1', () => resolve(server));
  });
}

function createPayload(emrType, overrides = {}) {
  const defaults = {
    medicationDisplay: 'Nitrofurantoin 100 mg capsule',
    sig: 'Take 1 capsule by mouth twice daily',
    route: 'PO',
    frequencyCode: 'BID',
    dispense: { raw: '14 capsules', amount: '14', unit: 'capsules' },
    duration: '7 days',
    daysSupply: '7',
    unitType: 'capsule',
    refills: '0',
    indication: 'Uncomplicated cystitis',
    pharmacyNote: 'Mock pharmacy note',
    effectiveDate: '2026-04-24',
    allowSubstitution: true,
    region: 'CA',
    emrType,
    conditionKey: 'cystitis',
    templateId: '',
    selectedOptionId: 'nitro-demo',
    ...overrides,
  };

  const adapterFields = {
    generic: {
      medication: defaults.medicationDisplay,
      sig: defaults.sig,
      quantity: defaults.dispense.raw,
      refills: defaults.refills,
      duration: defaults.duration,
      route: defaults.route,
      frequency: defaults.frequencyCode,
      indication: defaults.indication,
      pharmacyNote: defaults.pharmacyNote,
    },
    pssuite: {
      medication: defaults.medicationDisplay,
      instructions: defaults.sig,
      quantity: defaults.dispense.raw,
      repeats: defaults.refills,
      duration: defaults.duration,
      indication: defaults.indication,
      route: defaults.route,
      frequency: defaults.frequencyCode,
      noteToPharmacy: defaults.pharmacyNote,
    },
    oscar: {
      drugName: defaults.medicationDisplay,
      instructions: defaults.sig,
      quantity: defaults.dispense.raw,
      repeats: defaults.refills,
      duration: defaults.duration,
      route: defaults.route,
      frequency: defaults.frequencyCode,
      specialInstruction: defaults.indication,
      noteToPharmacy: defaults.pharmacyNote,
    },
    nextgen: {
      medicationDisplay: defaults.medicationDisplay,
      sig: defaults.sig,
      quantity: defaults.dispense.amount,
      unitType: defaults.unitType,
      daysSupply: defaults.daysSupply,
      refills: defaults.refills,
      route: defaults.route,
      frequencyCode: defaults.frequencyCode,
      reasonForRx: defaults.indication,
      pharmacyNote: defaults.pharmacyNote,
    },
  };

  return {
    _tol: true,
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    mode: 'copy-fill',
    canonical: defaults,
    adapter: {
      type: emrType,
      fields: adapterFields[emrType],
    },
    adapters: {
      [emrType]: {
        fields: adapterFields[emrType],
      },
    },
  };
}

async function writeClipboard(page, payload) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, JSON.stringify(payload));
}

async function openInlinePanel(page) {
  const fab = page.locator('#__tol_inline_fab');
  await fab.click();
  await page.locator('#__tol_inline_panel').waitFor({ state: 'visible', timeout: 5000 });
}

async function testControlPage(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/non-prescribing.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const visibleFab = await page.locator('#__tol_inline_fab').isVisible().catch(() => false);
  if (visibleFab) throw new Error('TOL widget should not appear on the non-prescribing control page.');
  await page.close();
}

async function testTolSiteHidden(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const visibleFab = await page.locator('#__tol_inline_fab').isVisible().catch(() => false);
  if (visibleFab) throw new Error('TOL widget should not appear on the TOL site.');
  await page.close();
}

async function testPsSuiteFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/pssuite-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('pssuite', {
    medicationDisplay: 'Trimethoprim-sulfamethoxazole DS 160/800 mg tablet',
    dispense: { raw: '14 tablets', amount: '14', unit: 'tablets' },
    unitType: 'tablet',
  }));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  try {
    await page.waitForFunction(() => (document.querySelector('#txtQuantity')?.value || '').length > 0, null, { timeout: 15000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      status: document.querySelector('#__tol_inline_status')?.textContent || '',
      overlayTitle: document.querySelector('#__tol_inline_overlay_title')?.textContent || '',
      overlayBody: document.querySelector('#__tol_inline_overlay_body')?.textContent || '',
      medication: document.querySelector('#txtDrugName')?.value || '',
      sig: document.querySelector('#txtSig')?.value || '',
      quantity: document.querySelector('#txtQuantity')?.value || '',
      refills: document.querySelector('#txtRefills')?.value || '',
    }));
    throw new Error(`PS Suite fill timed out: ${JSON.stringify(debug)}`);
  }

  const values = await page.evaluate(() => ({
    medication: document.querySelector('#txtDrugName')?.value || '',
    sig: document.querySelector('#txtSig')?.value || '',
    quantity: document.querySelector('#txtQuantity')?.value || '',
    refills: document.querySelector('#txtRefills')?.value || '',
    focusedEditable: (() => {
      const input = document.querySelector('#txtQuantity');
      input.focus();
      input.value = '15 tablets';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return document.activeElement === input && input.value === '15 tablets';
    })(),
  }));

  if (!values.medication || !values.sig || !values.quantity || !values.focusedEditable) {
    throw new Error(`PS Suite fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

async function testOscarFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/oscar-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('oscar', {
    medicationDisplay: 'Trimethoprim-sulfamethoxazole DS 160/800 mg tablet',
    dispense: { raw: '14 tablets', amount: '14', unit: 'tablets' },
    unitType: 'tablet',
  }));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  // Fresh profile has no learned drug mapping, so the adapter walks several
  // search queries (~1.2s each) before the matching one — allow for that.
  await page.waitForFunction(() => (document.querySelector('#rxText input[id^="quantity_"]')?.value || '').length > 0, null, { timeout: 20000 });

  const values = await page.evaluate(() => {
    const instruction = document.querySelector('#rxText textarea[id^="instructions_"]');
    const quantity = document.querySelector('#rxText input[id^="quantity_"]');
    const repeats = document.querySelector('#rxText input[id^="repeats_"]');
    if (quantity) {
      quantity.focus();
      quantity.value = '15 tablets';
      quantity.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return {
      instruction: instruction?.value || '',
      quantity: quantity?.value || '',
      repeats: repeats?.value || '',
      editable: !!quantity && document.activeElement === quantity && quantity.value === '15 tablets',
    };
  });

  if (!values.instruction || !values.quantity || !values.editable) {
    throw new Error(`OSCAR fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

async function testOscarCandidateChoice(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/oscar-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('oscar', {
    medicationDisplay: 'Dexamethasone 0.6 mg tablet',
    dispense: { raw: '5 tablets', amount: '5', unit: 'tablets' },
    unitType: 'tablet',
    sig: 'Take 1 tablet by mouth once daily',
    frequencyCode: 'OD',
    duration: '5 days',
  }));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  // "Dexamethasone 0.6 mg tablet" matches nothing until the bare-ingredient
  // query, so the adapter burns through five searches before offering
  // candidates — give it room.
  await page.locator('.tol-inline-candidate-btn').first().waitFor({ state: 'visible', timeout: 25000 });
  const candidateText = await page.locator('.tol-inline-candidate-btn').first().textContent();
  if (!/DEXAMETHASONE/i.test(candidateText || '')) {
    throw new Error(`Expected clickable dexamethasone candidate, got: ${candidateText}`);
  }
  await page.locator('.tol-inline-candidate-btn').first().click();
  await page.waitForFunction(() => (document.querySelector('#rxText input[id^="quantity_"]')?.value || '') === '5 tablets', null, { timeout: 20000 });

  const values = await page.evaluate(() => ({
    drug: document.querySelector('#rxText input[id^="drugName_"]')?.value || '',
    instruction: document.querySelector('#rxText textarea[id^="instructions_"]')?.value || '',
    quantity: document.querySelector('#rxText input[id^="quantity_"]')?.value || '',
    candidatesVisible: !!document.querySelector('.tol-inline-candidate-btn'),
  }));

  if (!/DEXAMETHASONE/i.test(values.drug) || !values.instruction || values.quantity !== '5 tablets' || values.candidatesVisible) {
    throw new Error(`OSCAR candidate choice fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

// After the clinician picked "DEXAMETHASONE 0.5MG TABLET" for the 0.6 mg
// draft in the previous test, the extension remembers the mapping. The same
// payload must now fill silently — no candidate prompt on repeat use.
async function testOscarLearnedMapping(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/oscar-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('oscar', {
    medicationDisplay: 'Dexamethasone 0.6 mg tablet',
    dispense: { raw: '5 tablets', amount: '5', unit: 'tablets' },
    unitType: 'tablet',
    sig: 'Take 1 tablet by mouth once daily',
    frequencyCode: 'OD',
    duration: '5 days',
  }));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  await page.waitForFunction(() => (document.querySelector('#rxText input[id^="quantity_"]')?.value || '') === '5 tablets', null, { timeout: 15000 });

  const values = await page.evaluate(() => ({
    drug: document.querySelector('#rxText input[id^="drugName_"]')?.value || '',
    quantity: document.querySelector('#rxText input[id^="quantity_"]')?.value || '',
    candidatesVisible: !!document.querySelector('.tol-inline-candidate-btn'),
  }));

  if (!/DEXAMETHASONE 0\.5MG/i.test(values.drug) || values.quantity !== '5 tablets' || values.candidatesVisible) {
    throw new Error(`OSCAR learned-mapping fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

// Mystery-EMR page: French visible labels only, meaningless ids (f1..f7), no
// name/aria attributes. Nothing selector-based can match — a successful fill
// proves the semantic inference path end to end, including FAB exposure on an
// unrecognized page once a draft is loaded.
async function testMysteryEmrInferenceFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/mystery-rx.html`, { waitUntil: 'domcontentloaded' });

  // No adapter recognizes this page and no draft is loaded yet, so the TOL
  // button must stay hidden.
  await page.waitForTimeout(900);
  const fabBeforePayload = await page.locator('#__tol_inline_fab').isVisible().catch(() => false);
  if (fabBeforePayload) {
    throw new Error('TOL widget should stay hidden on an unknown page until a draft is loaded.');
  }

  await writeClipboard(page, createPayload('generic', {
    medicationDisplay: 'Nitrofurantoin 100 mg capsule',
    dispense: { raw: '14 capsules', amount: '14', unit: 'capsules' },
  }));

  // Focusing a form field triggers the clipboard auto-load (user gesture).
  await page.locator('#f2').click();
  await page.locator('#__tol_inline_panel').waitFor({ state: 'visible', timeout: 6000 });
  await page.locator('#__tol_inline_fill').click();
  await page.waitForFunction(() => (document.querySelector('#f3')?.value || '').length > 0, null, { timeout: 15000 });

  const values = await page.evaluate(() => ({
    medication: document.querySelector('#f1')?.value || '',
    sig: document.querySelector('#f2')?.value || '',
    quantity: document.querySelector('#f3')?.value || '',
    refills: document.querySelector('#f4')?.value || '',
    duration: document.querySelector('#f5')?.value || '',
    route: document.querySelector('#f6')?.value || '',
    pharmacyNote: document.querySelector('#f7')?.value || '',
  }));

  if (!/nitrofurantoin/i.test(values.medication)) {
    throw new Error(`Mystery EMR: medication not inferred: ${JSON.stringify(values)}`);
  }
  if (!/by mouth/i.test(values.sig)) {
    throw new Error(`Mystery EMR: sig not inferred: ${JSON.stringify(values)}`);
  }
  if (values.quantity !== '14 capsules' || values.refills !== '0' || values.duration !== '7 days') {
    throw new Error(`Mystery EMR: numeric fields wrong: ${JSON.stringify(values)}`);
  }
  if (values.route !== 'PO') {
    throw new Error(`Mystery EMR: route select not inferred: ${JSON.stringify(values)}`);
  }
  if (!/pharmacy note/i.test(values.pharmacyNote)) {
    throw new Error(`Mystery EMR: pharmacy note not inferred: ${JSON.stringify(values)}`);
  }
  await page.close();
}

async function testNextGenFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/nextgen-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('nextgen'));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  await page.waitForFunction(() => (document.querySelector('#quantity')?.value || '').length > 0, null, { timeout: 15000 });

  const values = await page.evaluate(() => ({
    medication: document.querySelector('#medication')?.value || '',
    quantity: document.querySelector('#quantity')?.value || '',
    unitType: document.querySelector('#unitType')?.value || '',
    daysSupply: document.querySelector('#daysSupply')?.value || '',
    reasonForRx: document.querySelector('#reasonForRx')?.value || '',
  }));

  if (!values.medication || !values.quantity || !values.daysSupply) {
    throw new Error(`NextGen fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

async function main() {
  buildExtension();
  const server = await startServer();

  // A fresh profile per run keeps the suite hermetic: the extension remembers
  // clinician drug-mapping choices in chrome.storage.local, and a reused
  // profile would carry those learnings into the next run and change which
  // code path executes (auto-select instead of candidate prompt).
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tol-smoke-profile-'));

  let context;
  try {
    await waitForServer(`${BASE_URL}/index.html`);
    context = await chromium.launchPersistentContext(profileDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${CHROMIUM_EXTENSION_DIR}`,
        `--load-extension=${CHROMIUM_EXTENSION_DIR}`,
      ],
    });

    await testControlPage(context);
    await testTolSiteHidden(context);
    await testPsSuiteFill(context);
    await testOscarFill(context);
    await testOscarCandidateChoice(context);
    await testOscarLearnedMapping(context);
    await testNextGenFill(context);
    await testMysteryEmrInferenceFill(context);

    console.log('TOL extension harness smoke test passed.');
  } finally {
    await context?.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
