# Tree of Life (TOL) Data Architecture

## Overview

Tree of Life is a guided prescribing speed tool for primary care clinics. This document covers the canonical data schema, real-world data sources for the Canadian market, adapter architecture, and phased rollout plan.

---

## 1. Canonical Schema

### 1.1 Medication Entry (Catalog)

Each medication entry in the catalog follows this schema:

```
{
  id:              string        // Unique medication-condition key (e.g., 'sertraline', 'naproxen-oa')
  condition:       string        // Links to a condition value in CONDITIONS
  labels:          { en, fr }    // Display name by language
  type:            { en, fr }    // Short clinical category label
  form:            { en, fr }    // Dosage form (e.g., '500 mg tablet')
  rationale:       { en, fr }    // Why this option surfaces
  pros:            { en: [] }    // Array of advantage strings
  cons:            { en: [] }    // Array of disadvantage strings
  evidence:        { en: [] }    // Evidence and guideline references
  basePreference:  { CA, US, UK } // Base score per region (0-100)
  regionData: {
    CA: {
      available:   boolean       // Whether marketed in Canada
      preferred:   boolean       // Locally preferred (formulary boost)
      formulary:   string        // Formulary status description
      price:       number        // Indicative monthly cost (CAD)
      codeSystem:  string        // 'DIN' for Canada
      code:        string        // DIN number (real or placeholder)
    },
    US: { ... },                 // RxNorm codes
    UK: { ... },                 // dm+d codes
  },
  dose:            { en, fr }    // Dosing summary text
  order: {
    medication:    string        // Order line medication name
    sig:           { en, fr }    // Sig / directions
    dispense:      string        // Quantity to dispense
    refills:       string        // Number of refills
    duration:      string        // Expected duration
    pharmacy:      { en, fr }    // Pharmacy communication note
  },
  symptomBoosts:   { [symptom]: number }  // Score adjustments per symptom
  rules:           [Rule]        // Array of evaluation rules
}
```

### 1.2 Rule Schema

```
{
  effect:  'blocked' | 'caution'
  when:    (ctx, template?) => boolean   // Evaluated against patient context
  reason:  { en, fr }                    // Displayed explanation
}
```

### 1.3 Condition Entry

```
{
  value:     string        // Unique key (e.g., 'hypertension')
  domain:    string        // Clinical domain (e.g., 'cardiovascular')
  subtype:   string        // Subtype within domain (e.g., 'bp')
  en:        string        // English display name
  fr:        string        // French display name (optional)
  summary:   { en, fr }    // One-line clinical description
}
```

### 1.4 Scoring Engine

The scoring engine computes a final score for each medication:

```
score = basePreference[region]
      + sum(symptomBoosts for active symptoms)
      + templateBoost (if template default: +10)
      + localPreferred (if preferred && policy='local': +7)
      - rulesPenalties (blocked: -24, caution: -8)
      - costPenalty (if policy='value' && price >= 20: -6)
```

Refine preferences (patient feedback) adjust scores post-evaluation:
- noPills: oral -30, topical +10
- wantStronger: escalation +15, first-line -5
- wantCheaper: price >= 20 gets -15, price < 12 gets +5
- wantShorter: single-dose +15, short course +8
- sideEffects: all options -5

---

## 2. Canadian Data Sources

### 2.1 Health Canada Drug Product Database (DPD)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database.html |
| **Coverage** | All marketed drugs in Canada |
| **Key fields** | DIN, brand name, active ingredient, company, ATC code, route, dosage form, strength, schedule, status |
| **Format** | Downloadable flat files (CSV/TXT), REST API available |
| **License** | Open Government Licence - Canada (free, no restrictions) |
| **Update frequency** | Weekly extracts |
| **Use in Tree of Life** | Canonical drug identity layer. Every medication entry should reference a real DIN. |

**Key tables:**
- `drug_product` - Core product identity (DIN, class, status)
- `active_ingredient` - Ingredient name, strength, unit
- `form` - Dosage form and route
- `packaging` - Pack size, type
- `therapeutic_class` - ATC classification
- `company` - Manufacturer
- `status` - Market status (marketed, cancelled, dormant)
- `schedule` - OTC vs Rx vs controlled

### 2.2 Ontario Drug Benefit (ODB) Formulary

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.ontario.ca/page/ontario-drug-benefit-formulary |
| **Coverage** | ~4,400 drug products covered under Ontario public plans |
| **Key fields** | DIN, drug name, strength, form, ODB status (General Benefit, Limited Use, EAP), LU criteria codes, interchangeability status |
| **Format** | Downloadable Excel/CSV, searchable web |
| **License** | Ontario Open Data (free) |
| **Update frequency** | Monthly updates |
| **Use in Tree of Life** | Provincial formulary overlay for Ontario. Determines `preferred`, `formulary` status, and cost tier. |

**Coverage codes:**
- **GB** (General Benefit) - No special authorization needed
- **LU** (Limited Use) - Covered if specific clinical criteria met (LU codes)
- **EAP** (Exceptional Access Program) - Individual approval required

### 2.3 BC PharmaCare Formulary

| Attribute | Details |
|-----------|---------|
| **URL** | https://pharmacareformularysearch.gov.bc.ca/ |
| **Coverage** | BC provincial formulary |
| **Key fields** | DIN, drug name, plan coverage, reference drug program status, special authority criteria |
| **Format** | Searchable web, downloadable data |
| **License** | BC Open Data |
| **Use in Tree of Life** | Provincial overlay for British Columbia. |

### 2.4 Alberta Drug Benefit List

| Attribute | Details |
|-----------|---------|
| **Coverage** | Alberta provincial formulary |
| **Key fields** | DIN, coverage status, special authorization |
| **Use in Tree of Life** | Provincial overlay for Alberta. |

### 2.5 NAPRA Drug Schedules

| Attribute | Details |
|-----------|---------|
| **URL** | https://napra.ca/national-drug-schedules |
| **Coverage** | National drug scheduling (Rx, OTC, behind-counter) |
| **Use in Tree of Life** | Determines if a drug is Rx-only, behind-counter, or OTC for each province. |

### 2.6 Canadian Clinical Practice Guidelines (Evidence Layer)

| Source | Domain | Use |
|--------|--------|-----|
| **Hypertension Canada** | BP management | Treatment algorithms, first-line recommendations |
| **Diabetes Canada (CPG)** | T2DM | Metformin-first pathways, SGLT2i/GLP-1RA decision trees |
| **CCS Lipid Guidelines** | Cardiovascular | Statin intensity, risk-based treatment thresholds |
| **CANMAT** | Mental health | Depression/anxiety medication tiers |
| **CTS** | Respiratory | CAP, COPD exacerbation antibiotic choice |
| **Bugs & Drugs (Alberta)** | Infectious disease | Antibiotic selection, local resistance patterns |
| **SOGC** | Women's health | OCP/HRT guidelines |
| **CRA** | Rheumatology | OA, gout management |

These are publicly available practice guidelines. They inform the `basePreference` scores, `rules`, and `rationale` text but are not data files to import.

---

## 3. Adapter Architecture

### 3.1 Three-Layer Model

```
┌─────────────────────────────────────────┐
│  Layer 3: Clinical Logic                │
│  Rules, scoring, templates, copy output │
│  (app-logic.js, app-catalog-*.js)       │
├─────────────────────────────────────────┤
│  Layer 2: Provincial Formulary Overlay  │
│  ODB, BC PharmaCare, AB DBL            │
│  (preferred, coverage, LU criteria)     │
├─────────────────────────────────────────┤
│  Layer 1: National Drug Catalog (DPD)   │
│  DIN, ingredient, strength, form,       │
│  ATC code, schedule, market status      │
└─────────────────────────────────────────┘
```

### 3.2 Import Pipeline (Future)

```
DPD CSV extract
  → parse & normalize (DIN as primary key)
  → filter to relevant ATC codes / conditions
  → merge with provincial formulary data
  → generate medication catalog entries
  → validate rules and scoring
  → output app-catalog-*.js files
```

### 3.3 Data Refresh Strategy

| Layer | Source | Refresh | Method |
|-------|--------|---------|--------|
| National catalog | DPD | Weekly | Automated CSV download + diff |
| Provincial formulary | ODB, BC, AB | Monthly | Automated download + overlay merge |
| Clinical rules | Guidelines | Quarterly | Manual review by clinical advisor |
| Pricing | Provincial formulary + PharmaCare | Monthly | Automated from formulary data |

---

## 4. Current State (Mock Data)

### 4.1 Coverage Summary

| Domain | Conditions | Medications | Status |
|--------|-----------|-------------|--------|
| Infection | 21 (original 11 + 6 new) | 44 | Mock DINs |
| STI | 6 (original 5 + 1 new) | 12 | Mock DINs |
| Mental health | 3 | 9 | Real DINs where available |
| Cardiovascular | 2 | 6 | Real DINs where available |
| Endocrine | 4 | 8 | Real DINs where available |
| GI | 2 | 5 | Real DINs where available |
| MSK / pain | 4 | 12 | Real DINs where available |
| Dermatology | 2 | 6 | Real DINs where available |
| Women's health | 2 | 4 | Real DINs where available |
| ENT / allergy | 1 | 3 | Real DINs where available |
| Chronic respiratory | 1 | 3 | Real DINs where available |
| **Total** | **43** | **107** | |

### 4.2 Data Quality

- **DIN codes**: Mix of real DINs (for newer conditions) and placeholder DEMO-* codes (original infection/STI conditions)
- **Pricing**: Approximate Ontario retail pricing; not linked to real formulary data yet
- **Formulary status**: Text descriptions based on known ODB coverage; not auto-derived
- **Rules**: Clinically reasonable but not validated by a pharmacist — mock only

---

## 5. Phased Rollout Plan

### Phase 1: Ontario MVP (Current Target)

**Goal**: Replace mock data with real DPD + ODB data for Ontario.

**Steps**:
1. Download DPD extract, filter to 107 medications by active ingredient + form
2. Map each catalog entry to real DIN(s)
3. Download ODB formulary, overlay coverage status (GB/LU/EAP)
4. Update `regionData.CA` with real DINs, real ODB status, real pricing
5. Have clinical advisor review rules and scoring for top 20 conditions
6. Replace DEMO-* codes with real DINs in all catalog files

**Data needed**:
- DPD extract (free, open government license)
- ODB formulary download (free, Ontario open data)
- Clinical advisor review (doctor partner)

**Timeline**: Foundation sprint

### Phase 2: Multi-Province Canada

**Goal**: Add BC PharmaCare and Alberta DBL overlays.

**Steps**:
1. Build provincial adapter that reads subRegion from state
2. Create `provinceOverlay` object: `{ ON: {...}, BC: {...}, AB: {...} }`
3. Modify `evaluateOption` to apply provincial formulary status
4. Add LU code display for restricted drugs
5. Add provincial price variations where data differs

**Architecture change**: The `regionData.CA` object expands to include:
```
regionData: {
  CA: {
    available: true,
    provinces: {
      ON: { preferred: true, formulary: 'GB', price: 8.5, luCode: null },
      BC: { preferred: true, formulary: 'Regular', price: 9.2, luCode: null },
      AB: { preferred: false, formulary: 'Restricted', price: 10.1, luCode: 'AB-1234' },
    },
    codeSystem: 'DIN',
    code: '02238280',
  }
}
```

### Phase 3: US Market

**Goal**: Populate US regionData with real RxNorm codes and indicative pricing.

**Sources**:
- RxNorm (NLM, free) for drug coding
- FDA Orange Book for therapeutic equivalence
- GoodRx or similar for indicative retail pricing

### Phase 4: UK Market

**Goal**: Populate UK regionData with dm+d codes and NHS pricing.

**Sources**:
- dm+d (NHS Digital, free) for drug coding
- NHS Drug Tariff for pricing

---

## 6. Integration Points

### 6.1 EMR Copy Output

Tree of Life generates copy-ready text in 4 EMR formats:
- **PS Suite** (Canadian EMR, most common in Ontario)
- **OSCAR Pro** (Canadian open-source EMR)
- **Epic** (US hospital/enterprise)
- **Athena** (US ambulatory)

Each format templates the same underlying order data differently.

### 6.2 Future API Endpoints

When moving from static files to a backend:

```
GET  /api/conditions                    → List all conditions
GET  /api/conditions/:id/medications    → Medications for condition
POST /api/evaluate                      → Score medications for patient context
GET  /api/formulary/:province/:din      → Provincial coverage lookup
GET  /api/templates                     → Clinician-saved templates
POST /api/templates                     → Save new template
```

### 6.3 Terminology Mapping

| Market | System | Source | License |
|--------|--------|--------|---------|
| Canada | DIN | DPD (Health Canada) | Open Government |
| US | RxNorm | NLM | Free (UMLS license) |
| UK | dm+d | NHS Digital | Open Data |
| International | ATC | WHO | Reference use OK |

---

## 7. Legal and Compliance Notes

- **DPD data**: Open Government Licence - Canada. Free for commercial use with attribution.
- **ODB formulary**: Ontario Open Data. Free for commercial use.
- **Clinical guidelines**: Published for public use. Reference and cite, do not reproduce full text.
- **Drug pricing**: Approximate only. Real-time pricing requires pharmacy integration.
- **Clinical disclaimer**: All output must include "mock/draft only" warning until clinically validated. Product should never claim to be a prescribing authority — it supports the clinician's decision.
- **PIPEDA compliance**: No patient data is stored or transmitted in the current architecture (all processing is client-side). Backend phase will require PIPEDA assessment.
