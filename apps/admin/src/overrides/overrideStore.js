import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const resolveDataPath = () => {
  if (process.env.ADMIN_OVERRIDE_STORE_PATH) {
    return path.resolve(process.env.ADMIN_OVERRIDE_STORE_PATH);
  }
  return path.resolve('apps', 'admin', 'data', 'overrides.json');
};

const resolveDataDir = () => path.dirname(resolveDataPath());

const nowIso = () => new Date().toISOString();

const ensureStore = async () => {
  const dataDir = resolveDataDir();
  const dataPath = resolveDataPath();
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dataPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    await writeFile(dataPath, '[]\n', 'utf8');
    return [];
  }
};

const persist = async (records) => {
  const dataPath = resolveDataPath();
  await writeFile(dataPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
};

export const listOverrides = async () => {
  const records = await ensureStore();
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const addOverride = async ({
  metricKey,
  targetId,
  overrideType,
  reason,
  requestedBy,
  value = null,
  notes = '',
}) => {
  const records = await ensureStore();
  const created = {
    id: `${metricKey}:${targetId}:${Date.now()}`,
    metricKey,
    targetId,
    overrideType,
    reason,
    requestedBy,
    value,
    notes,
    status: 'pending',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    reviewedBy: null,
  };

  records.push(created);
  await persist(records);
  return created;
};

export const updateOverrideStatus = async (id, status, reviewedBy = null) => {
  const records = await ensureStore();
  const index = records.findIndex((record) => record.id === id);

  if (index < 0) {
    throw new Error(`Override not found: ${id}`);
  }

  const updated = {
    ...records[index],
    status,
    reviewedBy,
    updatedAt: nowIso(),
  };

  records[index] = updated;
  await persist(records);
  return updated;
};
