const TEMPLATE_ITEMS = [
  { id: 'prep-documents', phase: 'Prepare', label: 'Collect visas, residency, and identity documents.' },
  { id: 'prep-budget', phase: 'Prepare', label: 'Finalize relocation budget with 6-month buffer.' },
  { id: 'move-housing', phase: 'Move', label: 'Shortlist housing and schedule virtual tours.' },
  { id: 'move-school', phase: 'Move', label: 'Review childcare/school enrollment timelines.' },
  { id: 'settle-healthcare', phase: 'Settle', label: 'Register for healthcare and family doctor access.' },
  { id: 'settle-admin', phase: 'Settle', label: 'Open bank account and complete local admin setup.' },
];

const version = 1;

export const getChecklistStorageKey = (cityKey) => `relocation-dashboard:checklist:${cityKey}`;

export const createChecklistTemplate = (cityKey) => ({
  version,
  cityKey,
  items: TEMPLATE_ITEMS.map((item) => ({ ...item, done: false })),
});

export const deserializeChecklist = (rawValue, cityKey) => {
  if (!rawValue) {
    return createChecklistTemplate(cityKey);
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || !Array.isArray(parsed.items)) {
      return createChecklistTemplate(cityKey);
    }

    return {
      version: Number(parsed.version) || version,
      cityKey,
      items: parsed.items
        .filter((item) => item && typeof item.id === 'string' && typeof item.label === 'string')
        .map((item) => ({
          id: item.id,
          label: item.label,
          phase: typeof item.phase === 'string' ? item.phase : 'Custom',
          done: Boolean(item.done),
        })),
    };
  } catch {
    return createChecklistTemplate(cityKey);
  }
};

export const serializeChecklist = (checklist) => JSON.stringify({
  version: checklist.version,
  cityKey: checklist.cityKey,
  items: checklist.items,
});

export const toggleChecklistItem = (checklist, itemId) => ({
  ...checklist,
  items: checklist.items.map((item) => (
    item.id === itemId
      ? { ...item, done: !item.done }
      : item
  )),
});

export const addChecklistItem = (checklist, label, createId = () => `custom-${Date.now()}`) => {
  const trimmed = label.trim();
  if (!trimmed) {
    return checklist;
  }

  return {
    ...checklist,
    items: [...checklist.items, {
      id: createId(),
      phase: 'Custom',
      label: trimmed,
      done: false,
    }],
  };
};

export const resetChecklist = (checklist) => ({
  ...checklist,
  items: checklist.items.map((item) => ({ ...item, done: false })),
});

export const getChecklistProgress = (checklist) => {
  const total = checklist.items.length;
  const completed = checklist.items.filter((item) => item.done).length;
  const ratio = total === 0 ? 0 : completed / total;

  return { total, completed, ratio };
};
