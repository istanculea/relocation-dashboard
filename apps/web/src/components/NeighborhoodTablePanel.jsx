import { useMemo, useState } from 'react';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';

const sortNeighborhoods = (rows, sortKey) => {
  const sorted = [...rows];

  if (sortKey === 'familyFit') {
    sorted.sort((left, right) => right.familyFit - left.familyFit);
  }

  if (sortKey === 'name') {
    sorted.sort((left, right) => left.name.localeCompare(right.name));
  }

  return sorted;
};

export const NeighborhoodTablePanel = function neighborhoodTablePanel({ city }) {
  const [sortKey, setSortKey] = useState('familyFit');
  const rows = useMemo(() => getNeighborhoodProfiles(city?.key), [city?.key]);
  const sortedRows = useMemo(() => sortNeighborhoods(rows, sortKey), [rows, sortKey]);

  if (!city) {
    return null;
  }

  return (
    <section className="panel stack-gap-lg" aria-label={`Neighborhood table for ${city.city}`}>
      <div className="section-title">
        <p>Neighborhoods</p>
        <h3>{city.city} Family Districts</h3>
        <span>Starter shortlist for district-level comparison before on-the-ground visits.</span>
      </div>

      <div className="checklist-add-row">
        <div className="ws-control-label">Sort</div>
        <button type="button" className="ws-icon-btn" onClick={() => setSortKey('familyFit')}>Top Family Fit</button>
        <button type="button" className="ws-icon-btn" onClick={() => setSortKey('name')}>A-Z</button>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Neighborhood</th>
              <th scope="col">Rent Level</th>
              <th scope="col">Safety</th>
              <th scope="col">Commute</th>
              <th scope="col">Family Fit</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.rentLevel}</td>
                <td>{row.safety}</td>
                <td>{row.commute}</td>
                <td>{row.familyFit.toFixed(1)}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
