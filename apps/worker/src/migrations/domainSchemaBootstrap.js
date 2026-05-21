import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SCHEMA_FILE = path.resolve('packages', 'domain', 'schema', 'strategic_mobility_v1.sql');
const DEFAULT_MIGRATION_OUT_DIR = path.resolve('apps', 'worker', 'outbox', 'migrations');

const countStatements = (sql) => sql
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)
  .length;

const buildDigest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

export const describeDomainSchema = async (schemaFilePath = DEFAULT_SCHEMA_FILE) => {
  const absolutePath = path.resolve(schemaFilePath);
  const sql = await readFile(absolutePath, 'utf8');

  return {
    schemaFilePath: absolutePath,
    statementCount: countStatements(sql),
    sizeBytes: Buffer.byteLength(sql, 'utf8'),
    sha256: buildDigest(sql),
  };
};

export const bootstrapDomainSchema = async ({
  schemaFilePath = DEFAULT_SCHEMA_FILE,
  outDir = DEFAULT_MIGRATION_OUT_DIR,
} = {}) => {
  const schema = await describeDomainSchema(schemaFilePath);
  const generatedAt = new Date().toISOString();
  const manifest = {
    id: `domain-schema-${generatedAt}`,
    generatedAt,
    schema,
    migrationHint: 'Execute this SQL through your DB migration runner in a controlled release.',
  };

  const absoluteOutDir = path.resolve(outDir);
  await mkdir(absoluteOutDir, { recursive: true });
  const filePath = path.join(absoluteOutDir, `domain-schema-manifest-${Date.now()}.json`);
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    ...manifest,
    outputPath: filePath,
  };
};
