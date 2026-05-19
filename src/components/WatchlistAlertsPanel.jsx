import { useEffect, useMemo, useState } from 'react';
import { evaluateWatchlistAlerts } from '../utils/watchlistAlerts.js';
import { persistStoredValue, readStoredValue } from '../utils/storagePersistence.js';

const storageKey = 'relocation-dashboard:watchlist-cities';

const parseWatchlist = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const WatchlistAlertsPanel = function watchlistAlertsPanel({ rows, scenarioKey, selectedCityKey, onSelectCity }) {
  const [watchlistKeys, setWatchlistKeys] = useState([]);

  useEffect(() => {
    const raw = readStoredValue(storageKey, '[]', () => true);
    setWatchlistKeys(parseWatchlist(raw));
  }, []);

  useEffect(() => {
    persistStoredValue(storageKey, JSON.stringify(watchlistKeys));
  }, [watchlistKeys]);

  const watchlistRows = useMemo(
    () => watchlistKeys
      .map((key) => rows.find((row) => row.key === key))
      .filter(Boolean),
    [rows, watchlistKeys],
  );

  const allAlerts = useMemo(
    () => watchlistRows.flatMap((row) => {
      const alerts = evaluateWatchlistAlerts({ city: row, scenarioKey });
      return alerts.map((alert) => ({ ...alert, cityKey: row.key, cityLabel: row.city }));
    }),
    [scenarioKey, watchlistRows],
  );

  const addSelectedCity = () => {
    if (!selectedCityKey || watchlistKeys.includes(selectedCityKey)) {
      return;
    }

    setWatchlistKeys((previous) => [...previous, selectedCityKey]);
  };

  const removeFromWatchlist = (cityKey) => {
    setWatchlistKeys((previous) => previous.filter((key) => key !== cityKey));
  };

  return (
    <section className="ws-watchlist-panel" aria-label="Watchlist alerts">
      <div className="ws-watchlist-panel__header">
        <h3>Watchlist Alerts</h3>
        <div className="ws-watchlist-panel__actions">
          <button type="button" className="ws-icon-btn" onClick={addSelectedCity}>Add selected city</button>
          {watchlistKeys.length > 0 && (
            <button type="button" className="ws-icon-btn" onClick={() => setWatchlistKeys([])}>Clear</button>
          )}
        </div>
      </div>

      {watchlistRows.length === 0 ? (
        <p className="ws-watchlist-empty">No watchlist cities yet. Select a city and click "Add selected city".</p>
      ) : (
        <>
          <div className="ws-watchlist-chips">
            {watchlistRows.map((row) => (
              <button
                key={row.key}
                type="button"
                className="ws-watchlist-chip"
                onClick={() => onSelectCity(row.key)}
              >
                {row.city}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFromWatchlist(row.key);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      removeFromWatchlist(row.key);
                    }
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          <ul className="ws-watchlist-alerts">
            {allAlerts.map((alert, index) => (
              <li key={`${alert.cityKey}-${index}`} className={`ws-watchlist-alert ws-watchlist-alert--${alert.severity}`}>
                <strong>{alert.cityLabel}</strong>
                <span>{alert.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
