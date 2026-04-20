# No-Read EMR Fill Plan

## Product position

The product does **not** read patient data from the EMR.

The workflow is:

1. The clinician uses `Guided`, `Template`, `Lookup`, or `Scores`.
2. The clinician confirms the draft inside TOL Scribe.
3. TOL Scribe generates a structured order payload.
4. A browser extension fills the target prescribing tool from that payload.
5. The clinician reviews and signs inside the EMR.

This keeps the product on the `drafting + fill assist` side rather than turning it into an autonomous order-entry tool.

## Non-goals

- No patient chart scraping.
- No background synchronization with EMRs.
- No silent order placement.
- No pharmacy transmission in v1.

## Core architecture

### 1. Canonical order schema

Every generated draft should map into one internal schema:

- `medicationDisplay`
- `sig`
- `route`
- `frequencyCode`
- `doseAmount`
- `doseUnit`
- `dispense.amount`
- `dispense.unit`
- `duration`
- `refills`
- `indication`
- `pharmacyNote`
- `region`
- `emrType`
- `conditionKey`
- `templateId`
- `selectedOptionId`

### 2. Adapter model

Each EMR adapter maps the canonical schema into platform-specific fields.

Current target adapters:

- `pssuite`
- `oscar`
- `epic`
- `athena`

Planned next adapters:

- `accuro`
- `ecw`
- `nextgen`

### 3. Extension workflow

The extension should support:

1. `Paste JSON` or `Read clipboard`
2. `Validate payload`
3. `Detect EMR`
4. `Show field preview`
5. `Fill mapped fields`
6. `Highlight unfilled fields`
7. `Require clinician confirmation`

## Extension modes

### Mode A: Copy only

User copies:

- Rx text
- chart note
- pharmacy note

No automation.

### Mode B: Copy + browser fill

User clicks `Copy for EMR`.
The extension parses the payload and fills:

- medication
- sig / instructions
- quantity
- refills / repeats
- duration
- indication
- pharmacy note

### Mode C: Native integration

Later only, for platforms that support it cleanly through SMART on FHIR or vendor APIs.

## EMR field strategy

### PS Suite

Treat as:

- `medication`
- `instructions`
- `quantity`
- `repeats`
- `duration`
- `indication`
- `noteToPharmacy`

### OSCAR

Treat as:

- `drugName`
- `instructions`
- `quantity`
- `repeats`
- `duration`
- `specialInstruction`
- `noteToPharmacy`

### Epic

Treat as:

- `medicationDisplay`
- `sig`
- `dispenseQuantity`
- `refills`
- `duration`
- `indication`
- `pharmacyNote`

### Athena

Treat as:

- `medicationDisplay`
- `sig`
- `quantity`
- `refills`
- `duration`
- `patientNote`
- `pharmacyNote`

## Safety rules

- If no option is clinically usable, do not generate a fillable prescription payload.
- Supportive-care plans should not generate medication-fill payloads.
- Emergency pathways should generate `protocol / referral` output, not normal Rx fill payloads.
- Every payload should include:
  - `schemaVersion`
  - `generatedAt`
  - `selectedOptionId`
  - `conditionKey`
  - `templateId`

## Physician-controlled modules

The product should support clinic or physician preferences that enable or disable:

- Guided mode
- Template mode
- Lookup
- Scores
- Paediatrics
- Emergency protocols
- Browser-fill extension
- Copy-only mode
- Market overlays

This should be managed as a settings profile, not separate forks of the product.

## Phase plan

### Phase 1

- Stabilize current prescribing flows.
- Fix blocked-option selection bugs.
- Improve structured EMR payload generation.
- Keep current UX.

### Phase 2

- Build the extension shell.
- Implement OSCAR and PS Suite adapters first.
- Add visible fill preview and partial-fill warnings.

### Phase 3

- Add Epic-focused adapter strategy.
- Add more North American EMR packs.
- Add extension QA harness per platform.

## Success criteria

- Clinician can go from condition/template to a fill-ready draft in under 30 seconds.
- Extension fills the main fields reliably in supported platforms.
- No patient data is read from the EMR.
- No blocked case can produce a fillable medication draft.
