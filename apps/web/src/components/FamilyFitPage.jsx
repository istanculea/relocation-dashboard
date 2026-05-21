import { useMemo, useState } from 'react';

const FIT_PROFILES = {
  balanced: {
    label: 'Balanced',
    weights: { familyRhythm: 0.4, psychologicalRhythm: 0.3, environmentalRhythm: 0.3 },
  },
  calm: {
    label: 'Calm & Grounded',
    weights: { familyRhythm: 0.3, psychologicalRhythm: 0.45, environmentalRhythm: 0.25 },
  },
  energetic: {
    label: 'Energetic & Ambitious',
    weights: { familyRhythm: 0.35, psychologicalRhythm: 0.2, environmentalRhythm: 0.45 },
  },
};

const scoreFit = (row, profile) => {
  const weights = FIT_PROFILES[profile].weights;
  return Number((
    (row.familyRhythm * weights.familyRhythm)
    + (row.psychologicalRhythm * weights.psychologicalRhythm)
    + (row.environmentalRhythm * weights.environmentalRhythm)
  ).toFixed(2));
};

export const FamilyFitPage = function familyFitPage({
  rows,
  onBack,
  onShare,
  onResetLink,
  isLinkCustomized,
}) {
  const [profile, setProfile] = useState('balanced');

  const ranked = useMemo(() => rows
    .map((row) => ({ ...row, fitScore: scoreFit(row, profile) }))
    .sort((left, right) => right.fitScore - left.fitScore), [rows, profile]);

  return (
    <div className="app-shell explorer-page-shell">
      <header className="ws-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">Family Fit Explorer</span>
          <span className="ws-header__subtitle">Human rhythm intelligence for relocation matching</span>
        </div>
        <div className="ws-header__divider" />
        <div className="ws-header__actions">
          <span className={`ws-link-state ${isLinkCustomized ? 'ws-link-state--customized' : 'ws-link-state--clean'}`}>
            Link: {isLinkCustomized ? 'Customized' : 'Clean'}
          </span>
          <button type="button" className="ws-icon-btn" onClick={onShare}>Share</button>
          <button type="button" className="ws-icon-btn" onClick={onResetLink}>Reset Link</button>
          <button type="button" className="ws-icon-btn" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      <main className="dashboard" style={{ padding: '1rem 1.25rem' }}>
        <section className="ws-pane" style={{ marginBottom: '0.9rem' }}>
          <div className="ws-pane__header"><span className="ws-pane__title">Profile Preference</span></div>
          <div className="ws-pane__body" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(FIT_PROFILES).map(([key, config]) => (
              <button key={key} type="button" className={`ws-icon-btn${profile === key ? ' ws-icon-btn--cta' : ''}`} onClick={() => setProfile(key)}>
                {config.label}
              </button>
            ))}
          </div>
        </section>

        <section className="ws-pane">
          <div className="ws-pane__header"><span className="ws-pane__title">Best Matches</span></div>
          <div className="ws-pane__body" style={{ display: 'grid', gap: '0.75rem' }}>
            {ranked.slice(0, 12).map((row) => (
              <article key={row.key} className="ws-atlas-deck__card">
                <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                <strong>Fit {row.fitScore.toFixed(2)}</strong>
                <small>{row.narrative || 'No narrative available'}</small>
                <div style={{ marginTop: '0.35rem' }}>
                  <span>Family {row.familyRhythm.toFixed(2)}</span>
                  <span> · Psychological {row.psychologicalRhythm.toFixed(2)}</span>
                  <span> · Environmental {row.environmentalRhythm.toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
