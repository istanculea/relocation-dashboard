import { useEffect, useMemo, useState } from 'react';
import { persistStoredValue, readStoredValue } from '../utils/storagePersistence.js';
import {
  addChecklistItem,
  createChecklistTemplate,
  deserializeChecklist,
  getChecklistProgress,
  getChecklistStorageKey,
  resetChecklist,
  serializeChecklist,
  toggleChecklistItem,
} from '../utils/checklistPlanner.js';

export const ChecklistPlannerPanel = function checklistPlannerPanel({ city }) {
  const cityKey = city?.key;
  const [checklist, setChecklist] = useState(() => createChecklistTemplate('unknown'));
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (!cityKey) {
      setChecklist(createChecklistTemplate('unknown'));
      return;
    }

    const raw = readStoredValue(getChecklistStorageKey(cityKey), '', () => true);
    setChecklist(deserializeChecklist(raw, cityKey));
  }, [cityKey]);

  useEffect(() => {
    if (!cityKey) {
      return;
    }

    persistStoredValue(getChecklistStorageKey(cityKey), serializeChecklist(checklist));
  }, [cityKey, checklist]);

  const progress = useMemo(() => getChecklistProgress(checklist), [checklist]);
  const progressPct = Math.round(progress.ratio * 100);

  if (!city) {
    return null;
  }

  return (
    <section className="panel stack-gap-lg" aria-label={`Relocation checklist for ${city.city}`}>
      <div className="section-title">
        <p>Relocation Planner</p>
        <h3>{city.city} Checklist</h3>
        <span>Track prep, move, and settle tasks for this city scenario.</span>
      </div>

      <div className="checklist-progress" role="status" aria-live="polite">
        <div className="checklist-progress__label">
          <span>{progress.completed} / {progress.total} tasks done</span>
          <strong>{progressPct}%</strong>
        </div>
        <div className="checklist-progress__track" aria-hidden="true">
          <span className="checklist-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <ul className="checklist-list">
        {checklist.items.map((item) => (
          <li key={item.id} className={`checklist-item${item.done ? ' checklist-item--done' : ''}`}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => setChecklist((previous) => toggleChecklistItem(previous, item.id))}
              />
              <span className="checklist-item__phase">{item.phase}</span>
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="checklist-add-row">
        <input
          type="text"
          className="city-combobox__input"
          value={customLabel}
          onChange={(event) => setCustomLabel(event.target.value)}
          placeholder="Add a custom task"
          aria-label="Add custom checklist task"
        />
        <button
          type="button"
          className="ws-icon-btn"
          onClick={() => {
            setChecklist((previous) => addChecklistItem(previous, customLabel));
            setCustomLabel('');
          }}
        >
          Add
        </button>
        <button
          type="button"
          className="ws-icon-btn"
          onClick={() => setChecklist((previous) => resetChecklist(previous))}
        >
          Reset
        </button>
      </div>
    </section>
  );
};
