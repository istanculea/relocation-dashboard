import { formatFreshnessLabel, getFreshnessMeta } from '../utils/freshness.js';

const inferRiskTier = ({ confidence, freshnessDays }) => {
  if (confidence >= 0.75 && freshnessDays <= 180) {
    return { label: 'Low risk', tone: 'low' };
  }

  if (confidence >= 0.55 && freshnessDays <= 365) {
    return { label: 'Medium risk', tone: 'medium' };
  }

  return { label: 'High risk', tone: 'high' };
};

export const EvidenceCenterPanel = function evidenceCenterPanel({ city, snapshot }) {
  if (!city) {
    return null;
  }

  const profile = snapshot?.verificationProfile ?? city.verificationProfile ?? null;
  const confidence = Number.isFinite(profile?.confidence) ? profile.confidence : 0.35;
  const confidencePct = Math.round(confidence * 100);
  const freshnessDays = Number.isFinite(profile?.freshnessDays)
    ? profile.freshnessDays
    : 365;
  const sourceCount = Number.isFinite(profile?.sourceCount)
    ? profile.sourceCount
    : 0;
  const sourceDiversityScore = Number.isFinite(profile?.sourceDiversityScore)
    ? profile.sourceDiversityScore
    : 0.25;
  const risk = inferRiskTier({ confidence, freshnessDays });
  const freshnessMeta = getFreshnessMeta(profile?.verifiedAt ?? snapshot?.lastReviewed ?? city.audit?.lastReviewed);
  const sourceRefs = (snapshot?.verifiedDetails ?? [])
    .flatMap((detail) => detail.sources ?? [])
    .slice(0, 4);

  return (
    <section className="ws-pane ws-pane--evidence-center" id="sec-evidence-center" aria-label="Evidence center">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Evidence Center</span>
      </div>
      <div className="ws-pane__body ws-evidence-center">
        <div className="ws-atlas-deck" aria-label="Evidence center summary">
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Evidence confidence</span>
            <strong>{confidencePct}%</strong>
            <small>{profile?.evidenceClass ?? 'composite'} class</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Freshness</span>
            <strong>{formatFreshnessLabel(freshnessMeta)}</strong>
            <small>{freshnessDays} days since review anchor</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Source footprint</span>
            <strong>{sourceCount} sources</strong>
            <small>Diversity score {(sourceDiversityScore * 100).toFixed(0)}%</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Audit risk</span>
            <strong>{risk.label}</strong>
            <small>{city.city}, {city.country}</small>
          </article>
        </div>

        <div className="ws-evidence-center__chips" aria-label="Evidence center risk chips">
          <span className={`ws-evidence-chip ws-evidence-chip--${risk.tone}`}>{risk.label}</span>
          <span className={`freshness-badge ${freshnessMeta.css}`}>{formatFreshnessLabel(freshnessMeta)}</span>
          <span className="ws-evidence-chip ws-evidence-chip--neutral">{sourceCount} refs</span>
        </div>

        {sourceRefs.length ? (
          <ul className="ws-evidence-center__sources">
            {sourceRefs.map((source, index) => (
              <li key={`${city.key}-evidence-ref-${source.label}-${index}`}>
                <span>{source.label}</span>
                <small>{source.verifiedAt ?? source.observedAt ?? 'No date'}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ws-control-hint">No strict source references available for this city snapshot yet.</p>
        )}
      </div>
    </section>
  );
};
