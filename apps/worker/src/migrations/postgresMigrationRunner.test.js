import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyDomainSchemaMigration } from './postgresMigrationRunner.js';

const createFakeClient = ({ alreadyApplied = false } = {}) => {
  const queries = [];
  const client = {
    connect: async () => {},
    end: async () => {},
    query: async (sql, params = []) => {
      queries.push({ sql, params });

      if (/select 1 from esmip_schema_migrations/i.test(sql)) {
        return { rowCount: alreadyApplied ? 1 : 0, rows: [] };
      }

      return { rowCount: 0, rows: [] };
    },
  };

  return { client, queries };
};

describe('postgres migration runner', () => {
  it('skips apply when env gate is disabled', async () => {
    const result = await applyDomainSchemaMigration({
      migrationApplyEnabled: false,
      connectionString: 'postgres://localhost/fake',
    });

    expect(result.status).toBe('skipped');
  });

  it('applies schema SQL with manifest when env gate is enabled', async () => {
    const manifestDir = path.resolve('.tmp', 'worker-manifest-tests');
    await mkdir(manifestDir, { recursive: true });

    const schemaPath = path.resolve('packages', 'domain', 'schema', 'strategic_mobility_v1.sql');
    const schemaSql = await readFile(schemaPath, 'utf8');
    const digest = createHash('sha256').update(schemaSql, 'utf8').digest('hex');

    const manifestPath = path.join(manifestDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ schema: { schemaFilePath: schemaPath, sha256: digest } }, null, 2));

    const { client, queries } = createFakeClient();

    const result = await applyDomainSchemaMigration({
      manifestPath,
      migrationApplyEnabled: true,
      connectionString: 'postgres://localhost/fake',
      clientFactory: async () => client,
    });

    expect(result.status).toBe('applied');
    expect(queries.some((entry) => /create table if not exists esmip_schema_migrations/i.test(entry.sql))).toBe(true);
    expect(queries.some((entry) => /insert into esmip_schema_migrations/i.test(entry.sql))).toBe(true);
  });
});
