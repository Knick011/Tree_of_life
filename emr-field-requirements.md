# EMR Field Requirements

Last updated: April 22, 2026

## Purpose

This document records the public, official knowledge-base evidence behind each EMR field model currently used by the TOL Scribe extension.

Important limitation:

- `OSCAR / Juno` is the only target where real local HTML plus public docs exist today.
- Several other EMRs have strong public product documentation but weak public field-level prescribing documentation.
- For those systems, the adapter should be treated as a structured heuristic until live prescribing-page HTML is captured from a real clinic tenant.

## Canonical TOL Draft Fields

The current TOL payload now carries or derives the following structured fields:

- medication
- sig / directions
- quantity
- unit type
- refills
- duration
- days supply
- route
- frequency
- indication / reason for Rx
- note to pharmacy
- effective date
- allow substitution

## Canada

### OSCAR / Juno

Confidence: High

Public evidence:

- OSCAR Rx3 writing guide confirms:
  - drug search
  - instructions
  - quantity
  - repeats
  - duration
  - duration unit
  - long-term medication flag
- local HTML captures confirm dynamic field ids for:
  - `drugName_<id>`
  - `instructions_<id>`
  - `siInput_<id>`
  - `quantity_<id>`
  - `repeats_<id>`
  - `route_<id>`
  - `frequency_<id>`
  - `duration_<id>`
  - `durationUnit_<id>`
  - `comment_<id>`

Sources:

- https://oscarmanual.org/oscar_emr_12/clinical-functions/prescription/writing-prescriptions-rx3/
- [oscarrx.md](D:/formulaires/oscarrx.md)
- [oscarextension.md](D:/formulaires/oscarextension.md)

Current TOL status:

- real workflow-specific adapter
- doc-backed fill order
- best current production candidate

### PS Suite

Confidence: Medium

Public evidence:

- TELUS publicly confirms integrated electronic prescribing applications
- public field-level prescribing UI documentation is not available

Source:

- https://www.telus.com/en/health/health-professionals/clinics/ps-suite

Current TOL status:

- structured field model only
- needs real prescribing-page HTML / DOM capture

### Accuro

Confidence: Medium

Public evidence:

- Accuro public user guide confirms:
  - medication search
  - route
  - dosage selection
  - quantity
  - refill quantity
  - pharmacy contact on instructions tab
  - drug use choices

Sources:

- https://userguide.accuroemr.com/5089.htm

Current TOL status:

- structured field model
- public docs stronger than TELUS for field semantics
- still needs real prescribing-page HTML / DOM capture

### Med Access

Confidence: Low

Public evidence:

- TELUS confirms integrated electronic prescribing applications
- no public field-level prescribing workflow documentation found

Source:

- https://www.telus.com/en/health/health-professionals/clinics/med-access

Current TOL status:

- heuristic field model only

### CHR

Confidence: Low

Public evidence:

- TELUS confirms full EMR functionality including prescriptions
- no public field-level prescribing workflow documentation found

Source:

- https://www.telus.com/en/health/health-professionals/clinics/collaborative-health-record

Current TOL status:

- heuristic field model only

### Medesync

Confidence: Low

Public evidence:

- TELUS confirms:
  - drug search
  - favourites
  - templates
  - prescription models
- no public field-level prescribing form documentation found

Source:

- https://www.telus.com/en/health/health-professionals/clinics/medesync

Current TOL status:

- heuristic field model only

## United States

### Epic

Confidence: Medium

Public evidence:

- strongest official material is API / FHIR / CDS based, not DOM based
- unsigned-order creation is documented through Epic interfaces

Sources:

- https://open.epic.com/Clinical/FHIR
- https://fhir.epic.com/Developer/Create

Current TOL status:

- structured browser-fill heuristic only
- real long-term path should be SMART / CDS Hooks, not DOM automation

### Athenahealth

Confidence: Medium

Public evidence:

- official MedicationRequest profile
- official dispenseInstructions extension documentation

Sources:

- https://docs.mydata.athenahealth.com/fhir-r4/StructureDefinition-athena-medrequest-profile.html
- https://docs.mydata.athenahealth.com/fhir-r4/StructureDefinition-athena-medicationrequest-extension-dispenseInstructions.html

Current TOL status:

- structured browser-fill heuristic only

### eClinicalWorks

Confidence: Medium

Public evidence:

- official product pages confirm:
  - e-prescribing
  - formulary checking
  - EPCS
- public field-level prescribing page docs were not found

Sources:

- https://www.eclinicalworks.com/products-services/pricing/
- https://www.eclinicalworks.com/wp-content/uploads/2016/11/ePrescribing-of-Controlled-Substances-Slick.pdf

Current TOL status:

- structured browser-fill heuristic only

### NextGen

Confidence: High

Public evidence:

- official docs explicitly say electronic prescriptions need:
  - valid SIG
  - numeric quantity value
  - unit type
- other public docs confirm refill workflows and supported features

Sources:

- https://docs.nextgen.com/en-US/nextgenc2ae-enterprise-ehr-help-3240205/electronic-prescriptions-357886
- https://docs.nextgen.com/nextgen%C2%AE-enterprise-ehr-help-3240205/eprescribing-medications-357966
- https://docs.nextgen.com/en-US/nextgenc2ae-enterprise-ehr-help-3240205/supported-eprescribing-features-329501

Current TOL status:

- stronger field model than most U.S. browser-fill targets
- still needs live DOM capture for final selectors

### Practice Fusion

Confidence: Low

Public evidence:

- official product pages confirm:
  - certified e-prescribing
  - EPCS
  - templates
  - refill workflows
  - prior auth
- no public field-level prescribing form docs found

Sources:

- https://www.practicefusion.com/e-prescribing/
- https://www.practicefusion.com/epcs/

Current TOL status:

- heuristic field model only

### DrChrono

Confidence: High

Public evidence:

- official support docs explicitly describe:
  - drug
  - sig / patient instructions
  - quantity
  - refills
  - days supply
  - effective date
  - service location
  - reason for Rx
  - supervising provider
  - allow substitution
  - notes to pharmacy

Sources:

- https://support.drchrono.com/home/227837547-prescribing-medications-via-drchrono-s-web-app
- https://support.drchrono.com/home/204621714-appropriate-and-inappropriate-use-of-the-notes-to-pharmacy-field

Current TOL status:

- doc-backed field model
- still needs live DOM capture for final selectors

## United Kingdom

### EMIS Web

Confidence: Low

Public evidence:

- strong product material, but not field-level prescribing docs

Source:

- https://www.emishealth.com/products/emis-web

Current TOL status:

- heuristic field model only

### TPP SystmOne

Confidence: Medium

Public evidence:

- prescribing page confirms:
  - bulk signing
  - repeat dispensing
  - formularies
  - decision support

Source:

- https://tpp-uk.com/general-practice/prescribing/

Current TOL status:

- workflow-backed field model
- still needs live prescribing-page HTML for browser fill

### Vision

Confidence: Medium

Public evidence:

- Vision help confirms:
  - quantity
  - dosage defaults
  - duration
  - issue frequency
  - pack size
  - repeat behavior
  - dm+d / Gemscript integration

Sources:

- https://help.visionhealth.co.uk/VA/windows/content/Help_Topics/Medication/Adding_Medication.htm
- https://help.visionhealth.co.uk/Vision_Consultation_Manager_Help_Centre/content/conmgr/29207.htm
- https://help.visionhealth.co.uk/Vision_Consultation_Manager_Help_Centre/Content/ConMgr/Gemscript/Gemscript_Drug_Dictionary.htm

Current TOL status:

- workflow-backed field model
- still needs live prescribing-page HTML for browser fill

## Practical build rule

Use this standard:

- `High confidence`: public field-level docs or real local HTML exist
- `Medium confidence`: public workflow docs exist but final DOM is unknown
- `Low confidence`: only public product-level evidence exists

Do not call anything production-ready unless it is:

1. field-modeled
2. DOM-tested
3. regression-tested
4. physician-validated
