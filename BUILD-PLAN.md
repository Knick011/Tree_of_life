# Tree of Life (TOL) — Build Plan

## What it is
Clinician-facing prescribing speed tool. Not an autonomous prescriber, not AI chatbot.
Two core modes: **Guided prescribing** (browse domain→subtype→condition) and **Doctor templates** (saved fast-apply presets with guardrails).
Output = Rx text + chart note + pharmacy note, formatted per EMR. Copy/paste into EMR.

## Tech
Vanilla JS, no framework. Static data (no DB yet). Node.js static file server.
Files: index.html, styles.css, app-config.js (options/state), app-data.js (conditions/templates/scenarios), app-catalog-a.js + app-catalog-b.js (medications), app-logic.js (rules engine), app-ui.js (rendering).

## Architecture
- 3-column dashboard: Patient (left 280px) | Clinical (center flex) | Output (right 360px)
- Live output: right panel auto-updates as fields are filled, no "generate" button
- Rules engine: each medication has rules (blocked/caution/boost) evaluated against patient context
- Scoring: base preference per region + rule deductions + symptom boosts + template/formulary boosts
- Status: eligible (green) / caution (amber) / blocked (red)

## Current state (15 conditions, 33 meds)
Infections: cystitis, cellulitis, ringworm, otitis media, pharyngitis, sinusitis, bronchitis, impetigo, male UTI, conjunctivitis
STI: chlamydia, gonorrhea, trichomoniasis, BV, vulvovaginal candidiasis
8 templates, 6 demo scenarios, 3 markets (CA/US/UK), 4 EMR formats

## Default state
Blank start. Doctor fills everything fresh. "New case" button resets.

## Monetization
B2B clinic subscription. $300-900/mo starter, $99-199/prescriber for growing clinics.
First buyers: family medicine, urgent care, sexual health clinics.
Co-building with a doctor partner from a clinic (first user secured).

## Regulatory framing
CDS tool — clinician always decides. Not autonomous. FDA CDS guidance + Health Canada SaMD guidance both require this framing to avoid medical device classification.

---

# Planned updates (in build order)

### 1. Scoring + color coding (UI)
- Show numeric score badge on primary med and each alternative
- Green/amber/red background tint on alt rows and primary card matching status
- Score visible as "Score: 82" tag next to status badge

### 2. Lookup tab
- Third mode button: Guided | Template | **Lookup**
- Shows all medications grouped by condition, each with dose, status, price, score
- No patient context needed — pure formulary browser
- Doctor can click any med to see full details (pros/cons/copy pack)
- Use case: "what do we have for sinusitis?" without filling the form

### 3. Refine / eliminate flow
- "Refine" button appears on output panel after primary is shown
- Opens inline section (not modal — stays in right column) with all non-blocked alternatives
- Each alternative shows: name, dose, pros, cons, price
- Checkbox to exclude ("Patient tried this", "Not tolerated", "Patient preference")
- Excluded meds get filtered out, best remaining auto-selects as new primary
- Exclusion reasons saved in audit trail

### 4. Province / state sub-region
- New dropdown below Region: "Province / State"
- Data structure: each region gets a subregions array in config
- CA: ON, BC, AB, QC, etc. US: placeholder "All states". UK: England, Scotland, Wales
- Medications get optional `subRegionData` overrides (formulary coverage, price adjustments)
- V1: structure only, populated with ON data from doctor partner later

### 5. Sponsored alternatives section
- Bottom of output panel, below audit fold
- Labeled "Sponsored alternatives" with disclaimer: "These options are presented by pharmaceutical partners. Tree of Life does not endorse or rank sponsored content."
- Placeholder only for V1 — no real ad data
- Completely separated from the scoring/ranking engine
- Will NOT be built until 50+ paying clinics (noted here for future)

---

# Data costs reminder
- V1: $0. Hand-curate 15-20 conditions with doctor partner.
- Scale (50+ conditions): $15-50K/yr for licensed drug DB (First Databank or Lexidrug).
- DIN/RxNorm/dm+d codes: free from government sources.
- Formulary data: free from provincial/state health authorities, manual upkeep.
- EMR integration (FHIR): free standard, $5-25K per vendor for API access. Not needed V1.
