import { requestedExpansionCities } from '../data/cityExpansionCandidates.js';

export const ExpansionPipelinePanel = function expansionPipelinePanel() {
  const liveCities = requestedExpansionCities.filter((city) => city.status === 'live');
  const pendingCities = requestedExpansionCities.filter((city) => city.status === 'pending');

  return (
    <section className="panel stack-gap-lg">
      <div className="section-title">
        <p>Expansion Queue</p>
        <h2>Requested Cities Added Without Fabricated Scores</h2>
        <span>
          Manchester is already live in the current model. The rest of the requested additions are now tracked explicitly
          as pending until their housing, childcare, mobility, benefit, budget, and 360 source packets are audited.
        </span>
      </div>

      <div className="summary-grid summary-grid--scoreboard">
        <article className="summary-card summary-card--primary">
          <p>Already live</p>
          <h3>{liveCities.length}</h3>
          <span>{liveCities.map((city) => city.city).join(', ') || 'None yet'}</span>
        </article>
        <article className="summary-card">
          <p>Pending source audit</p>
          <h3>{pendingCities.length}</h3>
          <span>Queued without invented budgets, scores, or childcare bands.</span>
        </article>
        <article className="summary-card">
          <p>What blocks scoring</p>
          <h3>Official packets</h3>
          <span>Each new city needs the same 2022-2026 source discipline as the live roster.</span>
        </article>
      </div>

      <div className="table-scroll">
        <table className="data-table expansion-pipeline-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Country</th>
              <th>Status</th>
              <th>Current position</th>
            </tr>
          </thead>
          <tbody>
            {requestedExpansionCities.map((city) => (
              <tr key={`${city.city}-expansion-city`}>
                <td>{city.city}</td>
                <td>{city.country}</td>
                <td>
                  <span className={city.status === 'live' ? 'signal-pill signal-pill--strong' : 'signal-pill'}>
                    {city.status === 'live' ? 'Live now' : 'Pending audit'}
                  </span>
                </td>
                <td>{city.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};