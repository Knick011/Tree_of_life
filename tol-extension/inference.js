// TOL Scribe — semantic field inference
//
// Universal fallback for EMR prescription pages the extension has no adapter
// or taught mapping for. Instead of guessing selectors, it looks at the page
// the way a human does: every visible form control is scored against each
// logical prescription field using its visible label, table-row header, aria
// attributes, placeholder, name/id tokens, and its control type and options.
// The best-scoring unique assignment wins. English and French labels are
// covered (Quebec EMRs label fields in French).
//
// Exposed as globalThis.TOLInference. No fills happen here — the caller
// (content.js) decides what to fill and verifies every write.

(function initTolInference(globalScope) {
  const TOL_UI_PREFIX = '__tol_';

  // Weighted lexicon per logical field. `strong` terms are near-unambiguous
  // phrases; `weak` terms are supporting evidence. All matching is done on
  // lowercased, accent-stripped text.
  const LEXICON = {
    medication: {
      strong: ['drug name', 'medication name', 'nom du medicament', 'medicament', 'drug search', 'search medication'],
      weak: ['drug', 'medication', 'med', 'medicine', 'produit', 'rx', 'prescription item'],
    },
    sig: {
      strong: ['sig', 'directions for use', 'patient instructions', 'posologie', 'directives', 'dosage instructions'],
      weak: ['instructions', 'directions', 'dosage', 'how to take', 'mode d emploi'],
    },
    quantity: {
      strong: ['quantity', 'dispense quantity', 'qty', 'quantite', 'mitte', 'disp'],
      weak: ['dispense', 'amount', 'nombre'],
    },
    refills: {
      strong: ['refills', 'refill', 'repeats', 'repeat', 'renouvellements', 'renouvellement', 'rpt'],
      weak: ['renewal', 'repetitions'],
    },
    duration: {
      strong: ['duration', 'duree', 'duree du traitement'],
      weak: ['period', 'for how long', 'jours de traitement'],
    },
    daysSupply: {
      strong: ['days supply', 'day supply', 'jours d approvisionnement'],
      weak: ['supply'],
    },
    unitType: {
      strong: ['unit type', 'dispense unit', 'unite'],
      weak: ['unit', 'form', 'forme'],
    },
    route: {
      strong: ['route', 'route of administration', 'voie', 'voie d administration'],
      weak: [],
    },
    frequency: {
      strong: ['frequency', 'frequence'],
      weak: ['freq', 'how often'],
    },
    indication: {
      strong: ['indication', 'reason for prescription', 'reason for rx', 'diagnosis', 'diagnostic', 'raison'],
      weak: ['reason', 'condition', 'motif'],
    },
    pharmacyNote: {
      strong: ['note to pharmacy', 'notes to pharmacy', 'pharmacy note', 'note a la pharmacie', 'pharmacist note'],
      weak: ['pharmacy', 'pharmacie', 'comment', 'commentaire', 'note'],
    },
    effectiveDate: {
      strong: ['effective date', 'start date', 'date de debut', 'date d entree en vigueur'],
      weak: ['date'],
    },
    allowSubstitution: {
      strong: ['allow substitution', 'substitution permitted', 'substitution autorisee', 'no substitution', 'generic substitution'],
      weak: ['substitution', 'interchangeable'],
    },
  };

  // Option-content fingerprints: a <select> whose options look like these is
  // that field, no matter what it is named.
  const OPTION_FINGERPRINTS = {
    route: /^(po|oral|top|topical|im|intramuscular|iv|intravenous|sl|sublingual|pr|rectal|vag|vaginal|in|intranasal|oph|ophthalmic|otic|neb|inhaled|buccal)\b/i,
    frequency: /^(od|qd|daily|bid|tid|qid|qhs|q\d+h|prn|weekly|stat|once)\b/i,
    unitType: /^(tablet|capsule|ml|mg|g|patch|suppository|puff|drop|sachet|vial|unit)s?\b/i,
  };

  const FIELD_STRATEGIES = {
    medication: 'search',
    sig: 'input',
    quantity: 'input',
    refills: 'input',
    duration: 'input',
    daysSupply: 'input',
    unitType: 'select',
    route: 'select',
    frequency: 'select',
    indication: 'input',
    pharmacyNote: 'append',
    effectiveDate: 'input',
    allowSubstitution: 'checkbox',
  };

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, ' ')
      .replace(/[_\-./:*()[\]]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitIdentifier(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-.]+/g, ' ')
      .toLowerCase();
  }

  function isVisible(el) {
    if (!el || !el.getClientRects || el.getClientRects().length === 0) return false;
    const style = el.ownerDocument?.defaultView?.getComputedStyle?.(el);
    if (style && (style.visibility === 'hidden' || style.display === 'none')) return false;
    return true;
  }

  function isFillableControl(el) {
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return !['hidden', 'submit', 'button', 'image', 'reset', 'file', 'radio'].includes(type);
    }
    if (el.isContentEditable && el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  // Deep-collect visible, enabled controls from the document, open shadow
  // roots, and same-origin iframes.
  function collectFillableElements(root) {
    const out = [];
    const start = root || document;
    const walk = (scope) => {
      let all = [];
      try { all = scope.querySelectorAll('*'); } catch { return; }
      for (const el of all) {
        if (el.id && String(el.id).startsWith(TOL_UI_PREFIX)) continue;
        if (el.closest && el.closest(`[id^="${TOL_UI_PREFIX}"]`)) continue;
        if (isFillableControl(el) && isVisible(el) && !el.disabled && !el.readOnly) {
          out.push(el);
        }
        if (el.shadowRoot) walk(el.shadowRoot);
        if (el.tagName === 'IFRAME') {
          try {
            if (el.contentDocument) walk(el.contentDocument);
          } catch { /* cross-origin */ }
        }
      }
    };
    walk(start);
    return out;
  }

  function resolveLabelledBy(el) {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const doc = el.ownerDocument || document;
    return ids
      .map((id) => doc.getElementById(id)?.textContent || '')
      .join(' ');
  }

  function findLabelText(el) {
    const doc = el.ownerDocument || document;
    const parts = [];
    if (el.id) {
      try {
        const forLabel = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (forLabel) parts.push(forLabel.textContent);
      } catch { /* bad id for selector */ }
    }
    const ancestorLabel = el.closest && el.closest('label');
    if (ancestorLabel) parts.push(ancestorLabel.textContent);
    return parts.join(' ');
  }

  // Table-layout EMRs: the field's label usually sits in the previous cell of
  // the same row, or in the column header at the same index.
  function findTableContext(el) {
    const cell = el.closest && el.closest('td, th');
    if (!cell) return '';
    const parts = [];
    let prev = cell.previousElementSibling;
    if (prev) parts.push(prev.textContent);
    const row = cell.parentElement;
    const table = cell.closest('table');
    if (row && table) {
      const cellIndex = Array.prototype.indexOf.call(row.children, cell);
      const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
      if (headerRow && headerRow !== row && headerRow.children[cellIndex]) {
        parts.push(headerRow.children[cellIndex].textContent);
      }
    }
    return parts.join(' ');
  }

  // Nearby text for div-soup layouts: previous siblings of the control or of
  // its wrapper, capped so we don't swallow whole paragraphs.
  function findNearbyText(el) {
    const clip = (text) => String(text || '').trim().slice(0, 80);
    let node = el;
    for (let depth = 0; depth < 3 && node; depth += 1) {
      let sibling = node.previousElementSibling;
      let hops = 0;
      while (sibling && hops < 2) {
        const text = clip(sibling.textContent);
        if (text && text.length <= 60 && !sibling.querySelector('input, select, textarea')) {
          return text;
        }
        sibling = sibling.previousElementSibling;
        hops += 1;
      }
      node = node.parentElement;
    }
    return '';
  }

  function getElementContext(el) {
    return {
      // Strongest: explicit label associations.
      label: normalizeText(`${findLabelText(el)} ${resolveLabelledBy(el)} ${el.getAttribute('aria-label') || ''}`),
      // Table-row labels are how classic EMR layouts name their fields.
      table: normalizeText(findTableContext(el)),
      placeholder: normalizeText(`${el.getAttribute('placeholder') || ''} ${el.getAttribute('title') || ''}`),
      attr: normalizeText(`${splitIdentifier(el.getAttribute('name'))} ${splitIdentifier(el.id)} ${splitIdentifier(el.getAttribute('data-testid') || el.getAttribute('data-test-id') || '')}`),
      near: normalizeText(findNearbyText(el)),
    };
  }

  // Word-boundary matching for every term (phrases included) so short tokens
  // like "sig" or "disp" can't match inside unrelated words ("design").
  function boundaryRegex(term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^| )${escaped}( |$)`);
  }

  const SOURCE_ORDER = ['label', 'table', 'placeholder', 'attr', 'near'];

  function textScore(context, terms, weightMap) {
    let score = 0;
    const applyTerms = (list, penalty) => {
      for (const term of list) {
        const t = normalizeText(term);
        if (!t) continue;
        const boundary = boundaryRegex(t);
        for (const source of SOURCE_ORDER) {
          if (boundary.test(context[source])) {
            score = Math.max(score, weightMap[source] - penalty);
            break;
          }
        }
      }
    };
    applyTerms(terms.strong, 0);
    applyTerms(terms.weak, 12);
    return score;
  }

  function selectOptionText(el) {
    if (el.tagName !== 'SELECT') return [];
    return Array.from(el.options || []).map((option) => String(option.textContent || option.value || '').trim()).filter(Boolean);
  }

  function typePriorScore(fieldName, el) {
    const tag = el.tagName;
    const type = tag === 'INPUT' ? (el.getAttribute('type') || 'text').toLowerCase() : '';
    let score = 0;

    if (tag === 'SELECT') {
      const fingerprint = OPTION_FINGERPRINTS[fieldName];
      if (fingerprint) {
        const options = selectOptionText(el);
        const hits = options.filter((option) => fingerprint.test(option)).length;
        if (options.length && hits >= Math.max(2, options.length * 0.4)) score += 34;
      }
      if (['route', 'frequency', 'unitType', 'refills'].includes(fieldName)) score += 4;
      if (['sig', 'pharmacyNote', 'medication'].includes(fieldName)) score -= 20;
    }

    if (tag === 'TEXTAREA') {
      if (['sig', 'pharmacyNote', 'indication'].includes(fieldName)) score += 8;
      if (['quantity', 'refills', 'daysSupply', 'duration', 'route', 'frequency'].includes(fieldName)) score -= 14;
    }

    if (type === 'number') {
      if (['quantity', 'refills', 'daysSupply', 'duration'].includes(fieldName)) score += 8;
      if (['medication', 'sig', 'pharmacyNote', 'indication'].includes(fieldName)) score -= 20;
    }

    if (type === 'date') {
      score += fieldName === 'effectiveDate' ? 24 : -24;
    }

    if (type === 'checkbox') {
      score += fieldName === 'allowSubstitution' ? 20 : -40;
    }
    if (fieldName === 'allowSubstitution' && type !== 'checkbox') score -= 24;

    // Autocomplete-ish inputs are strong medication candidates.
    if (fieldName === 'medication' && tag === 'INPUT') {
      if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-autocomplete')) score += 10;
    }

    return score;
  }

  // Score every (field, element) pair, then assign greedily so each element
  // and each field is used at most once.
  function inferFields(root, options = {}) {
    const minScore = options.minScore ?? 30;
    const elements = collectFillableElements(root);
    if (!elements.length) return {};

    const weightMap = { label: 40, table: 34, placeholder: 30, attr: 26, near: 20 };
    const pairs = [];

    elements.forEach((el) => {
      const context = getElementContext(el);
      Object.keys(LEXICON).forEach((fieldName) => {
        const base = textScore(context, LEXICON[fieldName], weightMap);
        const prior = typePriorScore(fieldName, el);
        // Option fingerprints are decisive on their own; text evidence is
        // required for everything else so priors alone can't invent a match.
        const total = base > 0 ? base + prior : (prior >= 30 ? prior : 0);
        if (total >= minScore) {
          pairs.push({ fieldName, element: el, score: total, context });
        }
      });
    });

    pairs.sort((a, b) => b.score - a.score);

    const assigned = {};
    const usedElements = new Set();
    for (const pair of pairs) {
      if (assigned[pair.fieldName] || usedElements.has(pair.element)) continue;
      assigned[pair.fieldName] = {
        element: pair.element,
        score: pair.score,
        strategy: FIELD_STRATEGIES[pair.fieldName] || 'input',
      };
      usedElements.add(pair.element);
    }
    return assigned;
  }

  function countInferableFields(root, options) {
    return Object.keys(inferFields(root, options)).length;
  }

  globalScope.TOLInference = {
    inferFields,
    collectFillableElements,
    countInferableFields,
  };
})(globalThis);
