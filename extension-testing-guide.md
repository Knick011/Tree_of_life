# TOL Extension Testing Guide

Last updated: April 24, 2026

## What is covered now

The current local harness verifies:

- the TOL widget stays hidden on non-prescribing pages
- the widget appears on prescribing pages
- PS Suite-style fill works
- OSCAR-style row creation and fill works
- NextGen-style structured fill works

## Automated smoke test

Run:

```powershell
node D:\formulaires\extension-harness-smoke.js
```

Expected result:

```text
TOL extension harness smoke test passed.
```

## Manual local test

### 1. Start the local app

```powershell
node D:\formulaires\server.js
```

Open:

- `http://127.0.0.1:4173/`

Sign in with:

- username: `admin123`
- password: `password123`

### 2. Load the extension unpacked

Chromium browsers:

1. Open `chrome://extensions`, `edge://extensions`, or `brave://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select:
   - `D:\formulaires\.build-extension\chromium`

Firefox:

1. Run:
   - `python D:\formulaires\build-extension-packages.py`
2. Use:
   - `D:\formulaires\dist\tol-extension-firefox.xpi`

### 3. Open the local harness

Go to:

- `http://127.0.0.1:4173/emr-harness/index.html`

Pages:

- `non-prescribing.html`
- `oscar-rx.html`
- `pssuite-rx.html`
- `nextgen-rx.html`

### 4. Expected widget behavior

- On `non-prescribing.html`: no TOL widget
- On `oscar-rx.html`: TOL widget visible
- On `pssuite-rx.html`: TOL widget visible
- On `nextgen-rx.html`: TOL widget visible

### 5. End-to-end fill flow

1. In TOL Scribe, choose the correct EMR in the header
2. Generate a draft
3. Click `Copy for EMR`
4. Open the harness prescribing page
5. Click the bottom-right `TOL Fill` button
6. Click `Read clipboard`
7. Click `Fill draft`

### 6. What to verify

#### OSCAR

- a pending row is created
- instructions fill
- quantity fills
- repeats fill
- route fills if available
- frequency fills if available
- duration fills if available
- indication / special instruction fills
- comment / pharmacy note fills

#### PS Suite

- medication fills
- sig fills
- quantity fills
- refills fills
- route / frequency fill if available
- indication fills
- pharmacy note fills

#### NextGen

- medication fills
- sig fills
- quantity fills
- unit type fills
- days supply fills
- refills fills
- reason for Rx fills

## Keyboard shortcut

Use:

- `Ctrl+Shift+Y`

This opens the inline TOL panel on the current page.

## Current confidence levels

- High confidence:
  - OSCAR / Juno
  - NextGen field model
  - DrChrono field model
  - Accuro field model
- Medium / heuristic until live DOM capture:
  - PS Suite
  - Med Access
  - CHR
  - Medesync
  - Athena
  - eClinicalWorks
  - Practice Fusion
  - Epic browser-fill path
  - EMIS
  - TPP SystmOne
  - Vision

## Next real-world test

After local harness testing, the next meaningful validation is:

1. OSCAR / Juno live page
2. PS Suite live page
3. Accuro live page

That is where selector tightening becomes product-critical.
