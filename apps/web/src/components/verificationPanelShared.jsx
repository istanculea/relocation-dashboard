import { auditStatusMeta } from '../data/dashboardConfig.js';
import {
  getFirstVerifiedSource,
  getGapReason,
  getSourceFallbackByStatus,
  getStrictDisplaySources,
  getVerifiedSources,
} from '../data/sourceSelection.js';
import { formatFreshnessLabel, getFreshnessMeta } from '../utils/freshness.js';

export const strictWithheldCopy =
  'Withheld from the strict verified snapshot until an official 2022-2026 source is attached.';

export const userFacingSectionKeys = new Set([
  'housingCosts',
  'childcareCosts',
  'basketCosts',
  'healthcareAccess',
  'mobilityCosts',
  'familyBenefits',
]);

export const summarizeAudit = (audit) =>
  `${audit.counts.verified} verified · ${audit.counts.mixed} mixed · ${audit.counts.modeled} modeled`;

export const formatVerifiedSections = (verifiedSections) =>
  verifiedSections.length ? verifiedSections.join(', ') : 'No strict verified sections yet';

export { getGapReason };

const getDisplaySources = (city, sectionKey, strictOnly = false) =>
  strictOnly ? getStrictDisplaySources(city, sectionKey) : city.sources?.[sectionKey] ?? [];

const buildStrictLines = (city, sectionKey, fallbackLines) => {
  const verifiedSource = getFirstVerifiedSource(
    city,
    sectionKey,
    (entry) => entry.strictLines?.length || entry.snapshotValue || entry.note,
  );

  if (verifiedSource?.strictLines?.length) {
    return verifiedSource.strictLines;
  }

  if (verifiedSource?.snapshotValue) {
    return [verifiedSource.snapshotValue];
  }

  if (verifiedSource?.note) {
    return [verifiedSource.note];
  }

  return fallbackLines();
};

export const strictSectionCards = [
  {
    key: 'housingCosts',
    title: 'Housing',
    buildLines: (city) =>
      buildStrictLines(city, 'housingCosts', () => [
        `Safe 2BR rent: ${city.housing.rentSafe2Bed}`,
        `Family districts: ${city.housing.areas.join(', ')}`,
      ]),
  },
  {
    key: 'childcareCosts',
    title: 'Childcare and Education',
    buildLines: (city) =>
      buildStrictLines(city, 'childcareCosts', () => [
        city.childcare.nurseryNet,
        `${city.childcare.schoolStart} ${city.childcare.schoolQuality}`,
      ]),
  },
  {
    key: 'basketCosts',
    title: 'Clean Basket',
    buildLines: (city) => [
      `Formula: ${city.basket.formula}`,
      `Diapers: ${city.basket.diapers}`,
      `Organic produce: ${city.basket.organicFruit} fruit | ${city.basket.organicVeg} vegetables`,
    ],
  },
  {
    key: 'healthcareAccess',
    title: 'Healthcare and Safety',
    buildLines: (city) => {
      const verifiedFacts = getVerifiedSources(city, 'healthcareAccess')
        .filter((entry) => entry.note)
        .map((entry) => entry.note);

      return verifiedFacts.length ? verifiedFacts : [city.health.registration];
    },
  },
  {
    key: 'mobilityCosts',
    title: 'Environment and Mobility',
    buildLines: (city) =>
      buildStrictLines(city, 'mobilityCosts', () => [
        `Verified pass price: ${city.mobility.pass}`,
        `Bike lanes: ${city.mobility.bikeLanes}`,
        `Car need: ${city.mobility.carNeed}`,
      ]),
  },
  {
    key: 'familyBenefits',
    title: 'State Support',
    buildLines: (city) => buildStrictLines(city, 'familyBenefits', () => [city.support.childBenefit]),
  },
];

export const SectionTitle = function sectionTitle({ eyebrow, title, detail }) {
  return (
    <div className="section-title">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{detail}</span>
    </div>
  );
};

export const AuditBadge = function auditBadge({ status, compact = false }) {
  const meta = auditStatusMeta[status];

  return (
    <span
      className={
        compact
          ? `audit-badge audit-badge--${meta.tone} audit-badge--compact`
          : `audit-badge audit-badge--${meta.tone}`
      }
    >
      {meta.label}
    </span>
  );
};

export const SectionSources = function sectionSources({ city, sectionKey, strictOnly = false }) {
  const entries = getDisplaySources(city, sectionKey, strictOnly);
  const status = city.audit.sections[sectionKey];

  return (
    <div className="source-block">
      <span className="source-block__eyebrow">Sources / footnotes</span>
      {entries.length ? (
        <ul className="source-list">
          {entries.map((entry, index) => (
            <li key={`${city.key}-${sectionKey}-${entry.label}-${index}`}>
              {entry.url ? (
                <a href={entry.url} target="_blank" rel="noreferrer">
                  {entry.label}
                </a>
              ) : (
                <span>{entry.label}</span>
              )}
              {entry.verifiedAt || entry.observedAt ? (() => {
                const sourceDateLabel = entry.verifiedAt ?? entry.observedAt;
                const freshnessMeta = getFreshnessMeta(sourceDateLabel);

                return (
                  <>
                    <span className="source-date">{sourceDateLabel}</span>
                    {freshnessMeta.tier !== 'unknown' ? (
                      <span className={`source-freshness ${freshnessMeta.css}`}>
                        {formatFreshnessLabel(freshnessMeta)}
                      </span>
                    ) : null}
                  </>
                );
              })() : null}
              {entry.note ? <small>{entry.note}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="source-block__fallback">{getSourceFallbackByStatus(status)}</p>
      )}
    </div>
  );
};