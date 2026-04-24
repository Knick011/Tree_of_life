const { execFileSync } = require('child_process');
const http = require('http');
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

async function testPsSuiteFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/pssuite-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('pssuite'));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  await page.waitForTimeout(1200);

  const values = await page.evaluate(() => ({
    medication: document.querySelector('#txtDrugName')?.value || '',
    sig: document.querySelector('#txtSig')?.value || '',
    quantity: document.querySelector('#txtQuantity')?.value || '',
    refills: document.querySelector('#txtRefills')?.value || '',
  }));

  if (!values.medication || !values.sig || !values.quantity) {
    throw new Error(`PS Suite fill failed: ${JSON.stringify(values)}`);
  }
  await page.close();
}

async function testOscarFill(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/emr-harness/oscar-rx.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#__tol_inline_fab').waitFor({ state: 'visible', timeout: 5000 });
  await writeClipboard(page, createPayload('oscar'));
  await openInlinePanel(page);
  await page.locator('#__tol_inline_read').click();
  await page.locator('#__tol_inline_fill').click();
  await page.waitForTimeout(1600);

  const values = await page.evaluate(() => {
    const instruction = document.querySelector('#rxText textarea[id^="instructions_"]');
    const quantity = document.querySelector('#rxText input[id^="quantity_"]');
    const repeats = document.querySelector('#rxText input[id^="repeats_"]');
    return {
      instruction: instruction?.value || '',
      quantity: quantity?.value || '',
      repeats: repeats?.value || '',
    };
  });

  if (!values.instruction || !values.quantity) {
    throw new Error(`OSCAR fill failed: ${JSON.stringify(values)}`);
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
  await page.waitForTimeout(1200);

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

  let context;
  try {
    await waitForServer(`${BASE_URL}/index.html`);
    context = await chromium.launchPersistentContext(path.join(ROOT, '.playwright-tol-profile'), {
      headless: false,
      args: [
        `--disable-extensions-except=${CHROMIUM_EXTENSION_DIR}`,
        `--load-extension=${CHROMIUM_EXTENSION_DIR}`,
      ],
    });

    await testControlPage(context);
    await testPsSuiteFill(context);
    await testOscarFill(context);
    await testNextGenFill(context);

    console.log('TOL extension harness smoke test passed.');
  } finally {
    await context?.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
