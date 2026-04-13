# Tree of Life (TOL) Build Plan

## Product Thesis

Build a clinician-facing prescribing workflow tool with two entry modes:

1. Guided prescribing
The doctor starts from a broad clinical area, narrows to a specific condition, optionally adds symptoms or clues, then reviews recommended medication packages.

2. Saved templates / fast apply
The doctor pre-builds reusable prescribing templates with patient guardrails such as age and weight bands, a target condition, a preferred medication package, and an EMR output style. When a patient arrives, the doctor can jump straight into that saved template, but the product still checks the patient against the saved guardrails before presenting a copy-ready draft.

The product is not positioned as automatic prescribing. It is positioned as a fast, reviewable, clinician-authored drafting and standardization tool.

## Core MVP

### Workflow

- Patient essentials first: age, weight, pregnancy, renal function, hepatic review.
- Market/output context: region, policy model, EMR output type.
- Guided path: clinical area -> subtype -> condition -> optional symptom clues.
- Saved template mode: select a doctor-owned template, inspect/edit guardrails, then fast apply.
- Explicit process step before revealing output.
- Output begins with patient signals and template fit, then the primary package, then alternatives.
- Copy-ready blocks for:
  - Rx text
  - Chart note
  - Pharmacy note

### Clinical Scope

Start narrow:

- Uncomplicated cystitis
- Cellulitis
- Ringworm / tinea corporis
- Acute otitis media
- Chlamydia review

These are not the final product categories. They are the first mock/pilot lanes because they are repetitive enough to show value and bounded enough to validate safely.

### Template System

Every saved template should store:

- Template name
- Target condition
- Preferred medication package
- Minimum age
- Maximum age
- Minimum weight
- Maximum weight
- Default EMR output style
- Region / policy context
- Notes and warnings

Every fast-apply use should still run:

- patient-fit validation
- allergy review
- pregnancy review
- renal review
- medication burden / interaction review

## Real Product Architecture

### Frontend

- Web app first
- Fast form flow
- Two clear modes: guided and template
- Copy/export blocks for EMR-specific paste workflows
- Full audit trail per processed snapshot

### Backend

- Rule engine for condition logic and patient-fit checks
- Template store per clinician / clinic
- Medication package library per condition
- Market adapter layer:
  - country / province / payer / formulary overlays
  - terminology mapping
- Audit event store

### Data Model

Main entities:

- Clinician
- Clinic / organization
- Patient snapshot
- Condition pathway
- Medication package
- Template
- Processed review
- Copy/export format
- Audit event

### Integration Strategy

Phase 1:

- copy/paste only
- no direct e-prescribing
- no write-back to EMR

Phase 2:

- SMART on FHIR launch where realistic
- richer patient-context import
- optional structured write-back

Phase 3:

- direct order creation or deeper EMR workflow integration only after pilot proof and governance maturity

## Data Strategy

### Lean Pilot

Use a mixed approach:

- open/public terminology and product data where available
- internally curated package library for the narrow pilot conditions
- clinician-authored templates
- explicit rule-based logic

This keeps the first version lighter and cheaper.

### Commercial Version

Add licensed drug knowledge and richer formulary/benefit content later for:

- broader condition support
- stronger dosing depth
- more defensible medication guidance
- cross-market scaling

## Governance And Safety

The product needs a formal clinical governance layer before broad sale.

Minimum governance structure:

- 1 clinical lead physician
- 1 pharmacist or medication-content reviewer
- template versioning
- dated clinical content releases
- visible rationale for every surfaced package
- logs showing exactly which patient snapshot and rule path produced the output

The product should avoid:

- one-click prescribing without patient checks
- opaque recommendations
- claiming to replace judgment
- pretending to cover all conditions early

## 12-Month Roadmap

### Phase 0: Now to 6 Weeks

- Lock the product shape
- Validate the two-mode workflow with physician testers
- Narrow the first commercial use case
- Define the first 20 template-worthy scenarios

### Phase 1: 6 to 12 Weeks

- Build the real rule/data model
- Replace hardcoded mock data with structured JSON or DB-backed data
- Add clinician template CRUD
- Add copy/export formatter service
- Add authentication and clinic scoping

### Phase 2: 3 to 6 Months

- Add pilot analytics
- Add audit log persistence
- Add patient import stubs or lightweight integrations
- Add admin console for clinic template management
- Pilot with a small family medicine group

### Phase 3: 6 to 12 Months

- Expand condition coverage carefully
- Add more EMR output profiles
- Add deeper local formulary logic
- Prepare for security/compliance review
- Convert pilots into paid clinics

## Pilot Success Metrics

Measure these from day one:

- time to draft a prescription
- number of clicks to usable output
- number of pharmacy callbacks
- percentage of cases using saved templates
- percentage of cases where a template fails patient-fit checks
- formulary adherence
- clinician satisfaction
- frequency of manual override from the default package

## Recommended Commercial Wedge

Do not start by selling to hospitals as a general platform.

Start with:

- family medicine clinics
- urgent care
- sexual health clinics
- outpatient groups with repetitive prescribing patterns

Best initial positioning:

`Clinician-authored prescribing templates with patient-fit checks and EMR-ready copy output.`

## Pricing Shape

Early pricing recommendation:

- free design-partner pilots for a few physician champions
- then per-prescriber monthly pricing
- small-clinic base plan plus seat minimum

Suggested early commercial structure:

- starter clinic: fixed monthly clinic fee
- growth clinic: per-prescriber pricing
- enterprise: custom

## What To Build Next In The Codebase

1. Replace hardcoded arrays with structured JSON files.
2. Move template edits from local browser state to persistent storage.
3. Add a real “copy format” abstraction instead of inline formatting.
4. Add clinician notes and override reasons.
5. Add clinic-level template governance.
6. Add test coverage for:
   - patient-fit validation
   - medication-package ranking
   - copy/export formatting
   - audit event generation

## Near-Term Recommendation

Use the current mock to answer three questions with physician testers:

1. Do they prefer guided mode, saved-template mode, or both?
2. Which 10 prescribing scenarios are most worth templating first?
3. Which EMR copy format saves the most real-world time?

Those answers should drive the real MVP.
