import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bootstrapDomainSchema, describeDomainSchema } from './domainSchemaBootstrap.js';

describe('domain schema bootstrap', () => {
  it('describes strategic schema metadata', async () => {
    const metadata = await describeDomainSchema();

    expect(metadata.schemaFilePath.endsWith(path.join('packages', 'domain', 'schema', 'strategic_mobility_v1.sql'))).toBe(true);
    expect(metadata.statementCount).toBeGreaterThan(0);
    expect(metadata.sizeBytes).toBeGreaterThan(0);
    expect(metadata.sha256).toHaveLength(64);
  });

  it('writes a bootstrap manifest for migration runners', async () => {
    const outDir = path.resolve('.tmp', 'worker-migration-manifests');
    const output = await bootstrapDomainSchema({ outDir });

    expect(output.outputPath.startsWith(outDir)).toBe(true);
    expect(output.schema.statementCount).toBeGreaterThan(0);
    expect(output.schema.sha256).toHaveLength(64);
  });
});
