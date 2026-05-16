/**
 * DataSanityPanel.jsx — src/components/
 *
 * Data Confidence & Transparency Index for the active city.
 * Maps cityAuditMeta sections into colour-coded health status bars,
 * explains gap-fill logic, and surfaces the buildVerifiedSnapshotRows
 * verification window for each fact category.
 *
 * No external deps. Uses cityAuditMeta and sourceSelection utilities.
 */

import { getGapReason } from '../data/sourceSelection.js';

/* ─── Section display metadata ─────────────────────────────────────────── */

const SECTION_LABELS = {
  housingCosts:      'Housing Costs',
  childcareCosts:    'Childcare',
  basketCosts:       'Grocery Basket',
  healthcareAccess:  'Healthcare Access',
  mobilityCosts:     'Mobility & Transit',
  familyBenefits:    'Family Benefits & Tax',
  budgetModel:       'Budget Model',
};

const SECTION_ORDER = [
  'housingCosts',
  'childcareCosts',
  'basketCosts',
  'healthcareAccess',
  'mobilityCosts',
  'familyBenefits',
  'budgetModel',
];

const STATUS_META = {
  verified: { label: 'Verified',  dot: '🟢', css: 'status--verified' },
  mixed:    { label: 'Mixed',     dot: '🟡', css: 'status--mixed'    },
  modeled:  { label: 'Modeled',   dot: '🔴', css: 'status--modeled'  },
};

/* ─── Overall confidence score ──────────────────────────────────────────── */

const WEIGHTS = {
  verified: 1,
  mixed:    0.5,
  modeled:  0,
};

function computeConfidence(sections) {
  const keys = Object.keys(sections);
  if (!keys.length) return 0;
  const total = keys.reduce((sum, k) => sum + (WEIGHTS[sections[k]] ?? 0), 0);
  return Math.round((total / keys.length) * 100);
}

/* ─── Tier label ────────────────────────────────────────────────────────── */

function confidenceTier(pct) {
  if (pct >= 80) return { label: 'High Confidence',   css: 'sanity-tier--high'   };
  if (pct >= 50) return { label: 'Partial Confidence', css: 'sanity-tier--partial' };
  return           { label: 'Low Confidence',    css: 'sanity-tier--low'    };
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function StatusBar({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.modeled;
  return (
    <span className={`sanity-status ${meta.css}`}>
      {meta.dot} {meta.label}
    </span>
  );
}

function SectionRow({ city, sectionKey, status }) {
  const label = SECTION_LABELS[sectionKey] ?? sectionKey;
  const reason = getGapReason(city, sectionKey, status);

  return (
    <div className="sanity-row">
      <div className="sanity-row__label">{label}</div>
      <StatusBar status={status} />
      {reason && (
        <p className="sanity-row__reason">{reason}</p>
      )}
    </div>
  );
}

function OverallGauge({ confidence, tier }) {
  return (
    <div className={`sanity-gauge ${tier.css}`}>
      <div className="sanity-gauge__track">
        <div
          className="sanity-gauge__fill"
          style={{ width: `${confidence}%` }}
          aria-valuenow={confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          role="meter"
        />
      </div>
      <div className="sanity-gauge__labels">
        <span>{confidence}% verified</span>
        <strong>{tier.label}</strong>
      </div>
    </div>
  );
}

function VerificationLegend() {
  return (
    <div className="sanity-legend">
      {Object.entries(STATUS_META).map(([key, meta]) => (
        <span key={key} className="sanity-legend__item">
          {meta.dot} {meta.label}
        </span>
      ))}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

export const DataSanityPanel = function dataSanityPanel({ city }) {
  if (!city) return null;

  const audit = city.audit;
  if (!audit) {
    return (
      <div className="panel sanity-panel sanity-panel--empty">
        <p className="muted">No audit metadata available for {city.city}.</p>
      </div>
    );
  }

  const { sections = {}, overall, lastReviewed, notes } = audit;
  const confidence = computeConfidence(sections);
  const tier = confidenceTier(confidence);
  const sectionKeys = SECTION_ORDER.filter((k) => k in sections);

  return (
    <section className="panel sanity-panel" aria-label={`Data confidence for ${city.city}`}>
      <div className="section-title">
        <p>Data Transparency</p>
        <h3>Confidence Score Card — {city.city}</h3>
        <span>
          Every fact category is rated by its source quality: Verified (official page, 2022–2026),
          Mixed (official anchor + comparison layer), or Modeled (no direct city source).
        </span>
      </div>

      <OverallGauge confidence={confidence} tier={tier} />

      <div className="sanity-meta">
        <span className="sanity-meta__item">
          Overall: <strong className={`sanity-overall--${overall ?? 'unknown'}`}>{overall ?? 'unknown'}</strong>
        </span>
        <span className="sanity-meta__item">
          Last reviewed: <strong>{lastReviewed ?? '—'}</strong>
        </span>
      </div>

      {notes && (
        notes.length > 140 ? (
          <details className="sanity-notes-details">
            <summary className="sanity-notes-summary">
              {notes.slice(0, 120).trimEnd()}&hellip;
              <span className="sanity-notes-expand"> (expand)</span>
            </summary>
            <blockquote className="sanity-notes">{notes}</blockquote>
          </details>
        ) : (
          <blockquote className="sanity-notes">{notes}</blockquote>
        )
      )}

      <div className="sanity-sections">
        {sectionKeys.map((key) => (
          <SectionRow
            key={key}
            city={city}
            sectionKey={key}
            status={sections[key]}
          />
        ))}
      </div>

      <VerificationLegend />
    </section>
  );
};
