import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bootstrapDomainSchema } from '../migrations/domainSchemaBootstrap.js';
import { bootstrapArtifactLedger } from '../migrations/artifactLedgerBootstrap.js';

const resolveOutDir = () => path.resolve(process.env.WORKER_OUTBOX_DIR ?? path.join('apps', 'worker', 'outbox'));

const timestamp = () => new Date().toISOString();

const jobHandlers = {
  source_ingestion_refresh: async () => ({
    refreshedSources: ['eurostat', 'oecd', 'numbeo'],
    records: 128,
  }),
  temporal_alignment_refresh: async () => ({
    alignedIndicators: 42,
    windows: ['current', 'short_term', 'medium_term'],
  }),
  spatial_enrichment_refresh: async () => ({
    updatedNodes: 28,
    updatedEdges: 211,
  }),
  simulation_cache_refresh: async () => ({
    regeneratedScenarios: ['inflationWave', 'railStrike', 'heatwave'],
    cacheEntries: 84,
  }),
  narrative_context_refresh: async () => ({
    rebuiltNarrativeContexts: 28,
    citationBundles: 28,
  }),
  scenario_artifact_rollup: async () => ({
    rolledUpRuns: 16,
    generatedArtifacts: 16,
  }),
  evidence_artifact_rollup: async () => ({
    mergedObservations: 42,
    generatedArtifacts: 42,
  }),
  domain_schema_bootstrap: async () => bootstrapDomainSchema(),
  artifact_ledger_bootstrap: async () => bootstrapArtifactLedger(),
};

export const WORKER_JOBS = Object.keys(jobHandlers);

const persistResult = async (result) => {
  const outDir = resolveOutDir();
  await mkdir(outDir, { recursive: true });
  const fileName = `${result.jobId}-${Date.now()}.json`;
  const outputPath = path.join(outDir, fileName);
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return outputPath;
};

export const runJob = async (jobId) => {
  const handler = jobHandlers[jobId];
  if (!handler) {
    throw new Error(`Unknown job id: ${jobId}`);
  }

  const startedAt = timestamp();
  const payload = await handler();
  const finishedAt = timestamp();

  const result = {
    jobId,
    startedAt,
    finishedAt,
    payload,
  };

  const outputPath = await persistResult(result);

  return {
    ...result,
    outputPath,
  };
};

export const runRegisteredJobs = async () => {
  const results = [];
  for (const jobId of WORKER_JOBS) {
    results.push(await runJob(jobId));
  }
  return results;
};
