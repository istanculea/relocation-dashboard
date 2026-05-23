import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const resolveOutDir = (outDir) => path.resolve(outDir ?? path.join('apps', 'worker', 'outbox'));

export const buildArtifactLedgerSql = () => `
create table if not exists esmip_artifact_ledger (
  artifact_id text primary key,
  artifact_type text not null,
  reference_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
`.trim();

export const bootstrapArtifactLedger = async ({ outDir } = {}) => {
  const resolvedOutDir = resolveOutDir(outDir);
  await mkdir(resolvedOutDir, { recursive: true });

  const sql = buildArtifactLedgerSql();
  const outputPath = path.join(resolvedOutDir, `artifact-ledger-${Date.now()}.sql`);
  await writeFile(outputPath, `${sql}\n`, 'utf8');

  return {
    migration: 'artifact_ledger_bootstrap',
    outputPath,
    statementCount: 1,
  };
};
