import { describe, expect, it } from 'vitest';
import {
  addChecklistItem,
  createChecklistTemplate,
  deserializeChecklist,
  getChecklistProgress,
  serializeChecklist,
  toggleChecklistItem,
} from './checklistPlanner.js';

describe('checklistPlanner', () => {
  it('creates and round-trips checklist payloads', () => {
    const checklist = createChecklistTemplate('lisbon-pt');
    const serialized = serializeChecklist(checklist);
    const deserialized = deserializeChecklist(serialized, 'lisbon-pt');

    expect(deserialized.cityKey).toBe('lisbon-pt');
    expect(deserialized.items.length).toBeGreaterThan(0);
    expect(deserialized.items.every((item) => item.done === false)).toBe(true);
  });

  it('toggles completion and computes progress', () => {
    const checklist = createChecklistTemplate('berlin-de');
    const firstId = checklist.items[0].id;
    const updated = toggleChecklistItem(checklist, firstId);
    const progress = getChecklistProgress(updated);

    expect(updated.items[0].done).toBe(true);
    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(checklist.items.length);
    expect(progress.ratio).toBeGreaterThan(0);
  });

  it('adds custom checklist items with custom id factory', () => {
    const checklist = createChecklistTemplate('madrid-es');
    const updated = addChecklistItem(checklist, 'Book moving van', () => 'custom-1');

    expect(updated.items.at(-1)).toEqual({
      id: 'custom-1',
      phase: 'Custom',
      label: 'Book moving van',
      done: false,
    });
  });
});
