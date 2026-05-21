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

export const scoreFit = (row, profile) => {
  const weights = FIT_PROFILES[profile].weights;
  return Number((
    (row.familyRhythm * weights.familyRhythm)
    + (row.psychologicalRhythm * weights.psychologicalRhythm)
    + (row.environmentalRhythm * weights.environmentalRhythm)
  ).toFixed(2));
};

export const scoreCompatibility = (focusRow, row, profile) => {
  const fitScore = scoreFit(row, profile);

  if (!focusRow) {
    return fitScore;
  }

  const weights = FIT_PROFILES[profile].weights;
  const alignment = 10 - (
    Math.abs((focusRow.familyRhythm ?? 5) - (row.familyRhythm ?? 5)) * weights.familyRhythm
    + Math.abs((focusRow.psychologicalRhythm ?? 5) - (row.psychologicalRhythm ?? 5)) * weights.psychologicalRhythm
    + Math.abs((focusRow.environmentalRhythm ?? 5) - (row.environmentalRhythm ?? 5)) * weights.environmentalRhythm
  );

  return Number((((fitScore * 0.6) + (alignment * 0.4))).toFixed(2));
};

export const FamilyFitPage = function familyFitPage({
  rows,
  cityOptions,
  selectedCityKey,
  onSelectCity,
  onBack,
  onGoToMap,
  onGoToOutlook,
  onShare,
  onResetLink,
  isLinkCustomized,
}) {
  const [profile, setProfile] = useState('balanced');

  const focusRow = rows.find((row) => row.key === selectedCityKey) ?? rows[0] ?? null;
  const focusCityMeta = cityOptions.find((city) => city.key === focusRow?.key) ?? null;

  const ranked = useMemo(() => rows
    .filter((row) => row.key !== focusRow?.key)
    .map((row) => ({
      ...row,
      fitScore: scoreFit(row, profile),
      compatibilityScore: scoreCompatibility(focusRow, row, profile),
    }))
    .sort((left, right) => right.compatibilityScore - left.compatibilityScore), [focusRow, profile, rows]);

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
          <button type="button" className="ws-icon-btn" onClick={onGoToMap}>Map</button>
          <button type="button" className="ws-icon-btn" onClick={onGoToOutlook}>Outlook</button>
          <button type="button" className="ws-icon-btn" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      <main className="dashboard" style={{ padding: '1rem 1.25rem' }}>
        <section className="ws-pane" style={{ marginBottom: '0.9rem' }}>
          <div className="ws-pane__header"><span className="ws-pane__title">Profile Preference</span></div>
          <div className="ws-pane__body" style={{ display: 'grid', gap: '0.9rem' }}>
            <label>
              Anchor City
              <select className="ws-select" value={focusRow?.key ?? ''} onChange={(event) => onSelectCity(event.target.value || null)}>
                {rows.map((row) => (
                  <option key={row.key} value={row.key}>{row.city}, {row.country}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(FIT_PROFILES).map(([key, config]) => (
                <button key={key} type="button" className={`ws-icon-btn${profile === key ? ' ws-icon-btn--cta' : ''}`} onClick={() => setProfile(key)}>
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {focusRow && (
          <section className="ws-atlas-deck" aria-label="Family-fit focus summary">
            <article className="ws-atlas-deck__card">
              <span className="ws-atlas-deck__label">Anchor City</span>
              <strong>{focusRow.city}, {focusRow.country}</strong>
              <small>{focusCityMeta?.activeLensLabel ?? 'Balanced'} relocation frame</small>
            </article>
            <article className="ws-atlas-deck__card">
              <span className="ws-atlas-deck__label">Family Rhythm</span>
              <strong>{focusRow.familyRhythm.toFixed(2)}</strong>
              <small>Household tempo and safety fit</small>
            </article>
            <article className="ws-atlas-deck__card">
              <span className="ws-atlas-deck__label">Psychological Rhythm</span>
              <strong>{focusRow.psychologicalRhythm.toFixed(2)}</strong>
              <small>Stress load and emotional sustainability</small>
            </article>
            <article className="ws-atlas-deck__card">
              <span className="ws-atlas-deck__label">Environmental Rhythm</span>
              <strong>{focusRow.environmentalRhythm.toFixed(2)}</strong>
              <small>Air and environmental quality profile</small>
            </article>
          </section>
        )}

        <section className="ws-split-row" style={{ marginTop: '0.9rem' }}>
          <section className="ws-pane" style={{ flex: 1.05 }}>
            <div className="ws-pane__header"><span className="ws-pane__title">Anchor Narrative</span></div>
            <div className="ws-pane__body" style={{ display: 'grid', gap: '0.75rem' }}>
              <article className="ws-atlas-deck__card">
                <span className="ws-atlas-deck__label">Current Interpretation</span>
                <strong>{focusRow?.narrative || 'No narrative available'}</strong>
                <small>Use this as the baseline rhythm you want to preserve or improve.</small>
              </article>
            </div>
          </section>

          <section className="ws-pane" style={{ flex: 0.95 }}>
            <div className="ws-pane__header"><span className="ws-pane__title">Best Matches</span></div>
            <div className="ws-pane__body" style={{ display: 'grid', gap: '0.75rem' }}>
              {ranked.slice(0, 6).map((row) => (
                <button key={row.key} type="button" className="ws-atlas-deck__card" style={{ textAlign: 'left' }} onClick={() => onSelectCity(row.key)}>
                  <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                  <strong>Compatibility {row.compatibilityScore.toFixed(2)}</strong>
                  <small>Profile fit {row.fitScore.toFixed(2)} · {row.narrative || 'No narrative available'}</small>
                </button>
              ))}
            </div>
          </section>
        </section>

        <section className="ws-pane" style={{ marginTop: '0.9rem' }}>
          <div className="ws-pane__header"><span className="ws-pane__title">Compatibility Breakdown</span></div>
          <div className="ws-pane__body" style={{ display: 'grid', gap: '0.75rem' }}>
            {ranked.slice(0, 12).map((row) => (
              <article key={row.key} className="ws-atlas-deck__card">
                <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                <strong>Compatibility {row.compatibilityScore.toFixed(2)}</strong>
                <small>{row.narrative || 'No narrative available'}</small>
                <div style={{ marginTop: '0.35rem' }}>
                  <span>Family {row.familyRhythm.toFixed(2)}</span>
                  <span> · Psychological {row.psychologicalRhythm.toFixed(2)}</span>
                  <span> · Environmental {row.environmentalRhythm.toFixed(2)}</span>
                  <span> · Profile fit {row.fitScore.toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
