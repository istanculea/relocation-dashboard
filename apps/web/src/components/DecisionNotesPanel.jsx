import { useEffect, useMemo, useState } from 'react';
import { persistStoredValue, readStoredValue } from '../utils/storagePersistence.js';

const noteStorageKey = (cityKey) => `relocation-dashboard:city-note:${cityKey}`;

export const DecisionNotesPanel = function decisionNotesPanel({ city }) {
  const cityKey = city?.key;
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!cityKey) {
      setNoteText('');
      return;
    }

    const stored = readStoredValue(noteStorageKey(cityKey), '', () => true);
    setNoteText(stored);
  }, [cityKey]);

  useEffect(() => {
    if (!cityKey) {
      return;
    }

    persistStoredValue(noteStorageKey(cityKey), noteText);
  }, [cityKey, noteText]);

  const remaining = useMemo(() => Math.max(0, 2000 - noteText.length), [noteText.length]);

  if (!city) {
    return null;
  }

  return (
    <section className="panel stack-gap-lg" aria-label={`Decision notes for ${city.city}`}>
      <div className="section-title">
        <p>Decision Notes</p>
        <h3>{city.city} Notes</h3>
        <span>Capture the why behind your shortlist decisions. Notes are stored locally per city.</span>
      </div>
      <textarea
        className="city-note-input"
        rows={6}
        maxLength={2000}
        value={noteText}
        onChange={(event) => setNoteText(event.target.value)}
        placeholder="Example: Why this city is in or out, assumptions to verify, and next research steps."
      />
      <div className="city-note-footer">
        <span>{noteText.length} / 2000 characters</span>
        <span>{remaining} remaining</span>
      </div>
    </section>
  );
};
