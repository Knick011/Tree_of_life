# E-Prescribing Integration Rollout Plan

Last updated: April 21, 2026

## Product framing

TOL Scribe should not try to "integrate with every prescribing system" at once.

The correct build strategy is:

1. One canonical draft model inside TOL Scribe
2. One adapter per EMR / prescribing product
3. One site-specific selector pack or native integration path per product
4. One commercial wedge first: outpatient family medicine and urgent / walk-in clinics

## Ideal customer persona

Best-fit early customer:

- 2 to 20 clinician outpatient family medicine or urgent care groups
- repetitive prescribing volume
- high admin burden from retyping sigs, quantity, and refill instructions
- willing to use copy-to-EMR or browser-fill workflows
- limited appetite for enterprise IT projects

Why this persona first:

- fast buying cycles
- repetitive prescribing patterns
- lower integration complexity than hospitals
- clearer ROI from saving clicks and reducing pharmacy callbacks

## Canonical order model

Every integration should map from one internal prescription draft object with at least:

- medication display name
- coded medication identifier if available
- strength and form
- sig / instructions
- route
- frequency
- duration
- dispense quantity
- repeats / refills
- indication
- note to pharmacy
- substitution / DAW indicator
- controlled-substance flag
- region / market
- target EMR type

Do not read patient data from the EMR by default.
The doctor chooses the pathway or template in TOL Scribe, then the extension fills the EMR from the generated draft.

## Tool list by country

### Canada

#### Priority 1

1. OSCAR Pro / Juno OSCAR Rx
- Customer fit: strong for family medicine and independent clinics
- Public evidence: product site, support material, and real OSCAR Rx HTML are available
- Integration path: browser extension first
- Feasibility: high
- Status: already the strongest current adapter

2. TELUS PS Suite
- Customer fit: strong for mainstream Canadian ambulatory clinics
- Public evidence: official product pages exist, but real prescribing DOM is not public
- Integration path: browser extension first
- Feasibility: medium
- Need: live page access or DOM snapshots

3. Accuro EMR
- Customer fit: strong for Canadian physician groups
- Public evidence: official product pages exist, but prescribing DOM is not public
- Integration path: browser extension first
- Feasibility: medium
- Need: live page access or DOM snapshots

#### Priority 2

4. TELUS Med Access
- Customer fit: strong for web-based Canadian ambulatory clinics
- Public evidence: official product pages exist
- Integration path: browser extension first
- Feasibility: medium-high if live access is obtained because it is web-based

5. TELUS CHR
- Customer fit: newer cloud-based clinics and multidisciplinary teams
- Public evidence: official product pages exist
- Integration path: browser extension first
- Feasibility: medium-high if live access is obtained because it is cloud-based

6. Medesync
- Customer fit: specialists and Quebec-heavy workflows
- Public evidence: official product pages exist
- Integration path: browser extension first
- Feasibility: medium

#### National service layer

7. PrescribeIT standard / transition path
- Customer fit: national standards relevance, not a direct UI target
- Public evidence: official transition notice says the centrally operated service ends May 29, 2026
- Integration path: standards-aware output, not dependency on the central service
- Feasibility: medium for standards alignment, low as a direct distribution channel

### United States

#### Priority 1

1. Athenahealth
- Customer fit: ambulatory practices
- Public evidence: public FHIR docs available
- Integration path: browser extension first, with FHIR read/search awareness
- Feasibility: high for extension workflows
- Constraint: public MedicationRequest profile does not support create/update

2. eClinicalWorks
- Customer fit: large ambulatory footprint across small and mid-size practices
- Public evidence: official e-prescribing and interoperability material is public
- Integration path: browser extension first
- Feasibility: medium
- Need: live prescribing page HTML / DOM

3. NextGen Enterprise
- Customer fit: ambulatory and specialty groups
- Public evidence: public e-prescribing workflow docs are available
- Integration path: browser extension first
- Feasibility: medium
- Need: live prescribing page HTML / DOM

#### Priority 2

4. Epic
- Customer fit: hospital-owned clinics, large multispecialty groups, enterprise settings
- Public evidence: strong public API and CDS documentation
- Integration path: SMART on FHIR / CDS Hooks first, browser extension only as bridge
- Feasibility: medium for enterprise-native path, low for generic DOM-only rollout
- Best path: unsigned order workflow, not brittle selector filling

5. Oracle Health EHR
- Customer fit: enterprise and hospital-affiliated clinics
- Public evidence: strong public order workflow docs
- Integration path: native / enterprise integration first
- Feasibility: lower for extension-first, higher for customer-specific native work

#### Optional / strategic

6. Veradigm ePrescribe Enterprise
- Customer fit: EHR vendor or white-label route, not just end-clinic route
- Public evidence: official ePrescribe Enterprise materials are public
- Integration path: partner / API route
- Feasibility: medium if you decide to become an e-prescribing front-end backed by a vendor instead of hand-building everything

### United Kingdom

#### Priority 1 for research, not for launch

1. EMIS Web
- Customer fit: major primary care presence
- Public evidence: official product pages and GP Connect references are public
- Integration path: likely partner / API / managed integration path, not extension-first
- Feasibility: low-to-medium without customer access and vendor cooperation

2. TPP SystmOne
- Customer fit: major primary care presence
- Public evidence: official prescribing, EPS, and bulk-signing pages are public
- Integration path: likely partner / API / managed integration path, not extension-first
- Feasibility: low-to-medium without customer access and vendor cooperation

#### Secondary

3. Vision 3
- Customer fit: remaining UK GP practices and shared care sites
- Public evidence: product and help pages show prescribing / EPS behavior
- Integration path: likely customer-specific or partner-assisted
- Feasibility: low-to-medium

#### National service layer

4. NHS EPS / eRD
- Customer fit: mandatory workflow layer in English general practice
- Public evidence: NHS guidance is public
- Integration path: design output around EPS-compatible prescribing workflows and repeat-dispensing concepts
- Feasibility: high for workflow alignment, lower for direct system integration without vendor access

## Coverage view

### Best near-term coverage for your target persona

Start here:

1. OSCAR Pro / Juno
2. PS Suite
3. Accuro
4. Med Access
5. Athenahealth
6. eClinicalWorks
7. NextGen

That set gives you much better coverage of independent and ambulatory physician workflows than jumping into hospitals first.

### Enterprise / hospital coverage later

Later:

1. Epic
2. Oracle Health
3. UK EMIS / TPP pathways

## Prioritized target matrix

| Region | Product | Customer fit | Public technical surface | Best integration path | Near-term priority |
| --- | --- | --- | --- | --- | --- |
| Canada | OSCAR Pro / Juno | Independent family medicine, walk-in, small groups | Strong, including real HTML captures already available | Browser extension | Highest |
| Canada | PS Suite | Mainstream ambulatory and specialty clinics | Medium | Browser extension | Highest |
| Canada | Accuro | Broad physician-group fit | Medium | Browser extension | Highest |
| Canada | Med Access | Web-based ambulatory clinics | Medium-high | Browser extension | High |
| Canada | CHR | Cloud-first multidisciplinary clinics | Medium-high | Browser extension | Medium |
| Canada | Medesync | Quebec and specialist-heavy clinics | Medium | Browser extension | Medium |
| US | Athenahealth | Small and mid-size ambulatory practices | Medium-high via official FHIR docs | Browser extension first | High |
| US | eClinicalWorks | Large ambulatory footprint | Medium | Browser extension first | High |
| US | NextGen Enterprise / Office | Specialty groups, small and mid-size ambulatory | Medium-high via official help docs | Browser extension first | High |
| US | Practice Fusion | Smaller independent practices | Medium | Browser extension first | Medium |
| US | Epic | Hospital-owned clinics, enterprise | High for APIs, low for DOM | SMART / CDS Hooks first | Later |
| US | Oracle Health | Enterprise and hospital-affiliated clinics | High for docs, low for browser-fill | Native / customer-specific | Later |
| US | Veradigm ePrescribe Enterprise | Platform / partner route | High | OEM / partner path | Strategic |
| UK | EMIS Web | Major GP base | Medium | Partner / managed integration | Research first |
| UK | TPP SystmOne | Major GP base | Medium-high | Partner / managed integration | Research first |
| UK | Vision 3 | Smaller but relevant GP/shared care base | Medium | Partner / customer-specific | Research first |
| UK | NHS EPS / eRD | National workflow layer, not a UI | High for standards/workflow | Workflow-aligned output | Required context |

## Public technical surface and ease-of-build

### Easiest now

- OSCAR Pro / Juno
  - Public HTML / field patterns available
  - Real selector-driven adapter is feasible

### Medium with customer access

- PS Suite
- Accuro
- Med Access
- CHR
- Athenahealth
- eClinicalWorks
- NextGen

These are feasible once you have:

- one live tenant
- DOM snapshots
- screen recordings
- sample prescriptions

### Harder and should not be extension-first

- Epic
- Oracle Health
- EMIS Web
- TPP SystmOne
- Vision 3

For these, DOM scraping alone is not the right strategy.

## Exact build plan

### Phase 0: Stabilize the adapter framework

Build now:

1. Canonical prescription draft schema
2. Adapter registry by EMR key
3. Site-specific selector packs
4. Packaging script per browser
5. Playwright regression checks for each supported product page
6. Logging of fill success / missing fields without collecting PHI

### Phase 1: Canada ambulatory wedge

Target:

1. OSCAR Pro / Juno
2. PS Suite
3. Accuro

Deliverables:

- production-ready OSCAR adapter
- PS Suite selector pack
- Accuro selector pack
- extension install docs
- clinic admin setup guide
- issue reporting template with screenshots and HTML capture steps

### Phase 2: Canada web EMRs

Target:

1. Med Access
2. CHR
3. Medesync if physician demand warrants it

Deliverables:

- Med Access adapter
- CHR adapter
- additional field mapping for pharmacy note / structured comments

### Phase 3: US ambulatory

Target:

1. Athenahealth
2. eClinicalWorks
3. NextGen

Deliverables:

- browser-fill adapters where practical
- better mapping for U.S. fields like pharmacy search, EPCS notes, and insurance / RTPB-adjacent prompts

### Phase 4: Enterprise-native paths

Target:

1. Epic
2. Oracle Health

Deliverables:

- SMART on FHIR / CDS Hooks proof of concept for Epic
- customer-specific Oracle integration assessment
- unsigned-order handoff model instead of generic DOM filling

### Phase 5: UK strategy

Target:

1. EMIS Web
2. TPP SystmOne
3. Vision 3

Deliverables:

- vendor-access discovery
- NHS workflow alignment for EPS / eRD
- go / no-go decision on extension versus partnership

## Immediate next steps

1. Keep OSCAR / Juno as the reference implementation
2. Choose the next two Canadian ambulatory systems based on your pilot physicians:
   - PS Suite if your physicians use TELUS heavily
   - Accuro if your pilots include Loblaw / QHR environments
3. Collect one real prescribing-page HTML capture for each target system
4. Build one adapter at a time
5. Add regression tests before widening to the next system

## What can be built now without more vendor access

Now:

- adapter registry
- browser-specific release packaging
- canonical payload improvements
- site-specific selector architecture
- PS Suite / Accuro adapter scaffolds
- Epic native integration discovery docs
- product-specific field maps for Athenahealth, NextGen, and UK EPS-aligned output
- browser extension settings for per-user EMR defaults and site allowlists

## What should wait for customer access

- any final selector pack for PS Suite, Accuro, Med Access, CHR, eClinicalWorks, NextGen
- any serious Epic or Oracle implementation
- any UK production integration

## Practical recommendation

Do not spread across all three countries at once.

Best route:

1. Win Canada ambulatory first
2. Expand into U.S. ambulatory web EMRs second
3. Approach Epic and UK only after the adapter and governance model is proven

## Official source notes

Canada:

- TELUS says more than 40,000 Canadian healthcare professionals use a TELUS EMR and that 1 in 2 family physicians in Canada use a TELUS Health EMR:
  https://www.telus.com/en/health/health-professionals/clinics/collaborative-health-record
- TELUS positions PS Suite as Canada's leading EMR provider and confirms integrated electronic prescribing applications:
  https://www.telus.com/en/health/health-professionals/clinics/ps-suite
- TELUS positions Med Access as a fast web-based EMR with integrated electronic prescribing applications:
  https://www.telus.com/en/health/health-professionals/clinics/med-access
- TELUS positions Medesync as a web-based EMR with built-in drug search, favourites, and medication templates:
  https://www.telus.com/en/health/health-professionals/clinics/medesync
- Accuro documents prescription workflows and PrescribeIT support:
  https://accuroemr.com/emr-software/prescriptions/
  https://userguide.accuroemr.com/PrescribeIT.htm
- PrescribeIT's operated service is scheduled to conclude on May 29, 2026, with an open-standards path replacing it:
  https://accelero.infoway-inforoute.ca/en/initiatives/prescribeit
  https://www.prescribeit.ca/?catid=2%3Ageneral&id=477%3Anotice-prescribeit-service-update&view=article
- PrescribeIT lists conformed EMR / HIS vendors including Oscar Pro, Juno, Med Access, and Accuro:
  https://www.prescribeit.ca/about-us/working-together

United States:

- Athenahealth's public MedicationRequest profile is read-focused rather than generic write/create for broad extension bypass:
  https://docs.mydata.athenahealth.com/fhir-r4/StructureDefinition-athena-medrequest-profile.html
  https://mydata.athenahealth.com/static/apidoc/ig-ge-medicationorder.html
- eClinicalWorks publicly documents built-in e-prescribing, Rx eligibility, Rx history, formulary checking, and EPCS:
  https://www.eclinicalworks.com/products-services/
  https://www.eclinicalworks.com/products-services/interoperability/clinical-integrations/
- NextGen publishes detailed e-prescribing setup, supported features, and medication workflow documentation:
  https://docs.nextgen.com/en-US/nextgenc2ae-enterprise-ehr-help-3240205/eprescribing-setup-326497
  https://docs.nextgen.com/nextgen%C2%AE-enterprise-ehr-help-3240205/eprescribing-medications-357966
  https://docs.nextgen.com/en-US/nextgenc2ae-enterprise-ehr-help-3240205/supported-eprescribing-features-329501
- Epic publicly documents MedicationRequest unsigned-order creation through CDS Hooks:
  https://open.epic.com/Clinical/FHIR
  https://fhir.epic.com/Developer/Create
- Oracle Health publicly documents order workflows:
  https://docs.oracle.com/en/industries/health/oracle-health-ehr/ehrug/orders2.html
  https://docs.oracle.com/en/industries/health/oracle-health-ehr/ehrcg/orders1.html
- Veradigm positions ePrescribe Enterprise as a white-label integrated e-prescribing platform:
  https://veradigm.com/eprescribe-software/
- Practice Fusion documents certified e-prescribing and EPCS for independent practices:
  https://www.practicefusion.com/e-prescribing/
  https://www.practicefusion.com/epcs/
- HL7 MedicationRequest is the best canonical model baseline:
  https://hl7.org/fhir/r4/medicationrequest.html

United Kingdom:

- NHS EPS is the national prescription workflow layer and has been the expected route for eligible GP prescriptions in England since November 2019:
  https://www.england.nhs.uk/long-read/electronic-prescription-service-eps/
  https://production-like.nhsd.io/services/electronic-prescription-service
- NHS eRD is an important repeat-prescribing workflow concept:
  https://www.england.nhs.uk/long-read/electronic-repeat-dispensing-erd/
- EMIS Web is positioned by the vendor as a market-leading clinical system:
  https://www.emishealth.com/products/emis-web
- TPP publishes prescribing-specific capabilities including formulary support and EPS bulk signing:
  https://tpp-uk.com/general-practice/prescribing/
- Vision 3 help and product pages show embedded prescribing, formulary management, and dm+d-aligned Gemscript usage:
  https://www.oneadvanced.com/products/gp-clinical-system/
  https://help.visionhealth.co.uk/DLM830/Front_Screen_Help/Content/Releases/DLM_830/FMT/Prescribing_With_FMT.htm
  https://help.visionhealth.co.uk/DLM860/consultation_manager/Content/ConMgr/Gemscript/Gemscript_Drug_Dictionary.htm

Local implementation evidence:

- Real OSCAR Rx HTML and pending-row patterns are already available locally:
  D:\formulaires\oscarrx.md
  D:\formulaires\oscarextension.md
