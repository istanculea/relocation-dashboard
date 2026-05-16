import {
  auditStatusMeta,
  verificationWindow,
} from '../data/dashboardConfig.js';
import { benchmarkSources } from '../data/citySourceMeta.js';
import { getVerifiedSources, isSourceInVerificationWindow } from '../data/sourceSelection.js';
import {
  AuditBadge,
  formatVerifiedSections,
  getGapReason,
  SectionSources,
  SectionTitle,
  strictSectionCards,
  strictWithheldCopy,
  summarizeAudit,
  userFacingSectionKeys,
} from './verificationPanelShared';

const isStrictlyVerifiedSection = (city, sectionKey) =>
  city.audit.sections[sectionKey] === 'verified' && getVerifiedSources(city, sectionKey).length > 0;

export const BenchmarkMethodologyPanel = function benchmarkMethodologyPanel() {
  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Benchmark Layer"
        title="Secondary Sources That Do Not Widen the Strict Gate"
        detail="These sources improve calibration and source transparency, but they do not count as strict verified anchors unless a city section still carries a current official citation. Rechecked sources that are stale or unavailable are disclosed here and kept out of the active benchmark path."
      />
      <div className="quality-grid">
        {benchmarkSources.map((source) => (
          <article key={source.label} className="quality-card">
            <div className="quality-card__header">
              <div>
                <h3>{source.label}</h3>
                <span>{source.scope}</span>
              </div>
              <div>
                <span className="source-date">{source.statusLabel}</span>
                <span className="source-date">{source.observedAt}</span>
              </div>
            </div>
            <p className="quality-card__summary">{source.note}</p>
            <p className="quality-card__summary">{source.freshness}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              Open source
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};

export const VerificationPolicyPanel = function verificationPolicyPanel({ ranking, rows }) {
  const topCoverageCity = ranking[0];
  const topCoverageRow = rows.find((row) => row.key === topCoverageCity.key);
  const childcareCount = rows.filter((row) => row.childcare).length;
  const mobilityCount = rows.filter((row) => row.mobility).length;
  const supportCount = rows.filter((row) => row.familyBenefits).length;

  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Verification Policy"
        title={verificationWindow.label}
        detail={verificationWindow.detail}
      />
      <div className="summary-grid summary-grid--verified">
        <article className="summary-card summary-card--primary">
          <p>Best current coverage</p>
          <h3>{topCoverageCity.city}</h3>
          <strong>{topCoverageRow?.verifiedDetails.length ?? 0} verified sections</strong>
          <span>{formatVerifiedSections(topCoverageRow?.verifiedSections ?? [])}</span>
        </article>
        <article className="summary-card">
          <p>Verified childcare anchors</p>
          <h3>{childcareCount} cities</h3>
          <span>Only official childcare policy or tariff pages updated from 2022 through 2026 are shown.</span>
        </article>
        <article className="summary-card">
          <p>Verified transport anchors</p>
          <h3>{mobilityCount} cities</h3>
          <span>Only operator-backed pass prices survive in the strict mobility table.</span>
        </article>
        <article className="summary-card">
          <p>Verified family support anchors</p>
          <h3>{supportCount} cities</h3>
          <span>Government or national family-support pages only.</span>
        </article>
      </div>
    </section>
  );
};

export const VerifiedSnapshotTable = function verifiedSnapshotTable({ rows }) {
  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Verified Snapshot"
        title="Strict 2022-2026 Fact Surface"
        detail="This table excludes budget bands, weighted scores, and any city section that could not be tied to an official source updated in the target window."
      />
      <div className="table-scroll">
        <table className="data-table data-table--wide">
          <thead>
            <tr>
              <th>City</th>
              <th>Verified sections</th>
              <th>Childcare</th>
              <th>Transit</th>
              <th>Family support</th>
              <th>Last reviewed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.key}-verified-snapshot`}>
                <td>{row.city}</td>
                <td>{formatVerifiedSections(row.verifiedSections)}</td>
                <td>{row.childcare ?? 'Withheld'}</td>
                <td>{row.mobility ?? 'Withheld'}</td>
                <td>{row.familyBenefits ?? 'Withheld'}</td>
                <td>{row.lastReviewed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const VerifiedMobilityTable = function verifiedMobilityTable({ ranking }) {
  const verifiedMobilityRows = ranking.filter((city) => isStrictlyVerifiedSection(city, 'mobilityCosts'));

  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Verified Mobility"
        title="Operator-Backed Mobility Anchors Only"
        detail="Only fare anchors that are directly supported by a current operator page are listed here. Qualitative car-need and bike-lane commentary is withheld in the strict view."
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Verified fare anchor</th>
              <th>Source freshness</th>
            </tr>
          </thead>
          <tbody>
            {verifiedMobilityRows.map((city) => {
              const source = city.sources.mobilityCosts?.find((entry) => isSourceInVerificationWindow(entry));
              const fareAnchor = source?.snapshotValue ?? source?.strictLines?.[0] ?? source?.note ?? city.mobility.pass;

              return (
                <tr key={`${city.key}-verified-mobility`}>
                  <td>{city.city}</td>
                  <td>{fareAnchor}</td>
                  <td>{source?.verifiedAt ?? 'Current source linked'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const DataQualityOverview = function dataQualityOverview({ ranking }) {
  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Audit Layer"
        title="Verified Anchors vs Modeled Comparison Layers"
        detail="Each city still carries the full audit map, but the strict dashboard below only renders sections that remain fully verified against 2022-2026 official sources."
      />
      <div className="quality-legend">
        {Object.entries(auditStatusMeta).map(([key, meta]) => (
          <div key={key} className="quality-legend__item">
            <AuditBadge status={key} />
            <span>
              {key === 'verified' && 'Directly checked or recently confirmed anchor values.'}
              {key === 'mixed' && 'Combination of checked anchors and comparison modeling.'}
              {key === 'modeled' && 'Synthetic or parity-based estimate pending source-by-source audit.'}
            </span>
          </div>
        ))}
      </div>
      <div className="quality-grid">
        {ranking.map((city) => (
          <article key={`${city.key}-quality`} className="quality-card">
            <div className="quality-card__header">
              <div>
                <h3>{city.city}</h3>
                <span>{city.country}</span>
              </div>
              <AuditBadge status={city.audit.overall} />
            </div>
            <p className="quality-card__summary">{city.audit.notes}</p>
            <div className="quality-card__counts">
              <strong>{summarizeAudit(city.audit)}</strong>
              <span>Last reviewed {city.audit.lastReviewed}</span>
            </div>
            <div className="quality-chip-list">
              {city.audit.sectionEntries.map((entry) => (
                <span key={`${city.key}-${entry.key}`} className={`quality-chip quality-chip--${entry.status}`}>
                  {entry.label}: {entry.statusLabel}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export const VerificationGapsPanel = function verificationGapsPanel({ ranking }) {
  const gapRows = ranking.flatMap((city) =>
    city.audit.sectionEntries
      .filter((entry) => userFacingSectionKeys.has(entry.key) && !isStrictlyVerifiedSection(city, entry.key))
      .map((entry) => ({
        key: `${city.key}-${entry.key}`,
        city: city.city,
        section: entry.label,
        statusLabel: entry.statusLabel,
        reason: getGapReason(city, entry.key, entry.status),
      })),
  );

  return (
    <section className="panel stack-gap-lg">
      <SectionTitle
        eyebrow="Verification Gaps"
        title="Why Some Facts Stay Withheld"
        detail="This table explains which user-facing sections are still out of the strict snapshot and why. The goal is explicit source discipline, not silent omission."
      />
      <div className="table-scroll">
        <table className="data-table data-table--wide">
          <thead>
            <tr>
              <th>City</th>
              <th>Section</th>
              <th>Audit state</th>
              <th>Why withheld</th>
            </tr>
          </thead>
          <tbody>
            {gapRows.map((row) => (
              <tr key={row.key}>
                <td>{row.city}</td>
                <td>{row.section}</td>
                <td>{row.statusLabel}</td>
                <td>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const CommunityVoicesPanel = function communityVoicesPanel({ city, embedded = false }) {
  if (!city) {
    return null;
  }

  const voices = city.sources?.communityVoices ?? [];
  const wrapperClassName = embedded ? 'stack-gap-lg' : 'panel stack-gap-lg';

  if (!voices.length) {
    return null;
  }

  return (
    <section className={wrapperClassName}>
      <div className="compact-section-header">
        <span className="compact-section-header__eyebrow">Community Voices</span>
        <h4 className="compact-section-header__title">{city.city} Resident Perspectives</h4>
        <span className="compact-section-header__detail">Community-sourced views — not verified official data.</span>
      </div>
      <ul className="compact-source-list">
        {voices.map((entry) => (
          <li key={`${city.key}-voice-${entry.label}`} className="compact-source-list__item">
            <span className="compact-source-list__label">
              {entry.url
                ? <a href={entry.url} target="_blank" rel="noreferrer">{entry.label}</a>
                : entry.label}
            </span>
            <span className="compact-source-list__note">{entry.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const SelectedCityVerificationPanel = function selectedCityVerificationPanel({ city, snapshot, embedded = false }) {
  if (!city) {
    return null;
  }

  const visibleSections = strictSectionCards.filter((section) => isStrictlyVerifiedSection(city, section.key));
  const wrapperClassName = embedded ? 'stack-gap-lg' : 'panel stack-gap-lg';

  return (
    <section className={wrapperClassName}>
      <div className="compact-section-header">
        <span className="compact-section-header__eyebrow">Strict Verification Explorer</span>
        <h4 className="compact-section-header__title">{city.city} Official Fact Surface</h4>
        <span className="compact-section-header__detail">Only facts backed by official pages (2022–2026) are shown. Unverified sections display a gap note.</span>
      </div>
      <div className="verification-meta-strip">
        <span><strong>Verified sections:</strong> {visibleSections.length} of {strictSectionCards.length} — {snapshot?.verifiedSections.join(', ') || 'none yet'}</span>
        <span><strong>Last reviewed:</strong> {snapshot?.lastReviewed ?? city.audit.lastReviewed}</span>
        <span><strong>Source window:</strong> {verificationWindow.label}</span>
      </div>
      <ul className="compact-source-list">
        {strictSectionCards.map((section) => (
          <li key={`${city.key}-${section.key}-strict-card`} className="compact-source-list__item">
            <span className="compact-source-list__label">{section.title}</span>
            {isStrictlyVerifiedSection(city, section.key) ? (
              <span className="compact-source-list__note">
                {section.buildLines(city).join(' · ')}
                <SectionSources city={city} sectionKey={section.key} strictOnly />
              </span>
            ) : (
              <span className="compact-source-list__note compact-source-list__note--withheld">{strictWithheldCopy}</span>
            )}
          </li>
        ))}
      </ul>
      <CommunityVoicesPanel city={city} embedded />
    </section>
  );
};
