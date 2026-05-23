import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseManifestJson } from './manifestParser.js';

const DEFAULT_MIGRATION_LOG_TABLE = 'esmip_schema_migrations';

const buildDigest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const loadManifest = async (manifestPath) => {
  const absolutePath = path.resolve(manifestPath);
  const raw = await readFile(absolutePath, 'utf8');
  return parseManifestJson(raw, absolutePath);
};

const countStatements = (sql) => sql
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)
  .length;

const describeSchema = async (schemaFilePath) => {
  const absolutePath = path.resolve(schemaFilePath);
  const sql = await readFile(absolutePath, 'utf8');

  return {
    schemaFilePath: absolutePath,
    statementCount: countStatements(sql),
    sizeBytes: Buffer.byteLength(sql, 'utf8'),
    sha256: buildDigest(sql),
  };
};

const defaultClientFactory = async (connectionString) => {
  const { Client } = await import('pg');
  return new Client({ connectionString });
};

const ensureMigrationLogTable = async (client) => {
  await client.query(`
    create table if not exists esmip_schema_migrations (
      sha256 text primary key,
      schema_file_path text not null,
      source_manifest text,
      applied_at timestamptz not null default now()
    );
  `);
};

const hasDigestApplied = async (client, sha256) => {
  const result = await client.query('select 1 from esmip_schema_migrations where sha256 = $1 limit 1;', [sha256]);
  return result.rowCount > 0;
};

export const applyDomainSchemaMigration = async ({
  manifestPath,
  schemaFilePath,
  connectionString,
  migrationApplyEnabled = true,
  migrationLogTable = DEFAULT_MIGRATION_LOG_TABLE,
  clientFactory = defaultClientFactory,
} = {}) => {
  if (!migrationApplyEnabled) {
    return {
      status: 'skipped',
      reason: 'ENABLE_DB_MIGRATIONS is not true',
    };
  }

  const resolvedConnectionString = String(connectionString ?? '').trim();
  if (!resolvedConnectionString) {
    throw new Error('Missing connection string for migration apply');
  }

  if (migrationLogTable && migrationLogTable !== DEFAULT_MIGRATION_LOG_TABLE) {
    throw new Error(`Unsupported migration log table: ${migrationLogTable}`);
  }

  const manifest = manifestPath ? await loadManifest(manifestPath) : null;
  const resolvedSchemaPath = path.resolve(
    schemaFilePath
      ?? manifest?.schema?.schemaFilePath
      ?? path.resolve('packages', 'domain', 'schema', 'strategic_mobility_v1.sql'),
  );

  const schemaSql = await readFile(resolvedSchemaPath, 'utf8');
  const schemaDigest = buildDigest(schemaSql);

  if (manifest?.schema?.sha256 && manifest.schema.sha256 !== schemaDigest) {
    throw new Error('Manifest schema hash does not match current schema SQL');
  }

  const describedSchema = await describeSchema(resolvedSchemaPath);

  const client = await clientFactory(resolvedConnectionString);

  return (async () => {
    await client.connect();
    await client.query('begin;');

    const result = await (async () => {
      await ensureMigrationLogTable(client);

      const alreadyApplied = await hasDigestApplied(client, schemaDigest);
      if (alreadyApplied) {
        await client.query('rollback;');
        return {
          status: 'already_applied',
          schema: describedSchema,
          migrationLogTable: DEFAULT_MIGRATION_LOG_TABLE,
        };
      }

      await client.query(schemaSql);
      await client.query(
        'insert into esmip_schema_migrations (sha256, schema_file_path, source_manifest) values ($1, $2, $3);',
        [schemaDigest, resolvedSchemaPath, manifestPath ?? null],
      );
      await client.query('commit;');

      return {
        status: 'applied',
        schema: describedSchema,
        migrationLogTable: DEFAULT_MIGRATION_LOG_TABLE,
        sourceManifest: manifestPath ?? null,
      };
    })().catch(async (error) => {
      await client.query('rollback;').catch(() => undefined);
      throw error;
    });

    return result;
  })().finally(() => client.end());
};
