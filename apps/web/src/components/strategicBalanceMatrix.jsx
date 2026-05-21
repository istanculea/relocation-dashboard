import { strategicBalanceMethodologyNote } from '../data/strategicBalanceMatrix.js';
import { priorityPresets } from '../data/dashboardConfig.js';
import { PhaseSection } from './familyComparisonBoardPrimitives.jsx';

const formatScore = (value) => value.toFixed(2);

export const StrategicBalanceMatrix = function strategicBalanceMatrix({ rows, filteredRows, selectedCityKey, lensKey }) {
  if (!rows.length) {
    return null;
  }

  const filteredKeys = new Set((filteredRows ?? rows).map((r) => r.key));

  const matrixPillars = rows[0].strategicBalance.pillars.map((pillar) => ({
    key: pillar.key,
    label: pillar.label,
  }));

  const topCity = [...rows].sort((a, b) => b.strategicBalance.weightedScore - a.strategicBalance.weightedScore)[0];

  return (
    <PhaseSection
      phase="Strategic Layer"
      title="Strategic Balance: Full City Heatmap"
      description={`All ${rows.length} cities scored across 15 MCDA pillars. Selected column is highlighted; cities outside the active shortlist filter are dimmed. Lens: ${priorityPresets[lensKey].label}.`}
      className="phase-section--matrix"
    >
      <div className="strategic-balance-topbar">
        <article className="summary-card summary-card--primary">
          <p>Top balanced city</p>
          <h3>{topCity.city}</h3>
          <span>{formatScore(topCity.strategicBalance.weightedScore)} / 10 strategic score</span>
        </article>
        <article className="summary-card">
          <p>Cities in matrix</p>
          <h3>{rows.length}</h3>
          <span>{filteredKeys.size} in active shortlist</span>
        </article>
        <article className="summary-card">
          <p>Decision lens</p>
          <h3>{priorityPresets[lensKey].label}</h3>
          <span>15 MCDA pillars weighted for family priorities</span>
        </article>
      </div>

      <div className="table-scroll">
        <table className="data-table strategic-balance-matrix strategic-balance-matrix--compact" aria-label="Strategic balance heatmap across all cities">
          <thead>
            <tr>
              <th className="matrix-pillar-col" scope="col">Pillar</th>
              {rows.map((city) => (
                <th
                  key={`${city.key}-matrix-header`}
                  scope="col"
                  className={[
                    'matrix-city-col',
                    city.key === selectedCityKey ? 'matrix-city-col--selected' : '',
                    !filteredKeys.has(city.key) ? 'matrix-city-col--dim' : '',
                  ].join(' ')}
                >
                  <div className="matrix-city-label">
                    <strong>{city.city}</strong>
                    <span>{formatScore(city.strategicBalance.weightedScore)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixPillars.map((pillar) => (
              <tr key={`${pillar.key}-matrix-row`} className="comparison-table__row">
                <td className="matrix-pillar-col">
                  <strong>{pillar.label}</strong>
                </td>
                {rows.map((city) => {
                  const entry = city.strategicBalance.pillars.find((p) => p.key === pillar.key);
                  const tier = entry.tier.toLowerCase();

                  return (
                    <td
                      key={`${pillar.key}-${city.key}`}
                      className={[
                        'matrix-cell',
                        `matrix-cell--${tier}`,
                        city.key === selectedCityKey ? 'matrix-cell--selected' : '',
                        !filteredKeys.has(city.key) ? 'matrix-cell--dim' : '',
                      ].join(' ')}
                      title={`${city.city} — ${pillar.label}: ${formatScore(entry.score)} (${entry.tier}). ${entry.summary}`}
                    >
                      {formatScore(entry.score)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="comparison-table__row comparison-table__row--active">
              <td className="matrix-pillar-col">
                <strong>Weighted total</strong>
              </td>
              {rows.map((city) => (
                <td
                  key={`${city.key}-matrix-total`}
                  className={[
                    'matrix-cell matrix-cell--total',
                    city.key === selectedCityKey ? 'matrix-cell--selected' : '',
                    !filteredKeys.has(city.key) ? 'matrix-cell--dim' : '',
                  ].join(' ')}
                >
                  <strong>{formatScore(city.strategicBalance.weightedScore)}</strong>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="overview-note">{strategicBalanceMethodologyNote}</p>
    </PhaseSection>
  );
};
