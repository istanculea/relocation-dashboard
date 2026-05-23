import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { runJob, WORKER_JOBS } from './jobs/jobRunner.js';

process.env.WORKER_OUTBOX_DIR = path.resolve('.tmp', 'worker-outbox-tests');

describe('worker feature slices', () => {
  it('runs a registered job and emits output metadata', async () => {
    const result = await runJob(WORKER_JOBS[0]);

    expect(result.jobId).toBe(WORKER_JOBS[0]);
    expect(typeof result.outputPath).toBe('string');
  });

  it('registers and runs artifact productization jobs', async () => {
    expect(WORKER_JOBS).toContain('scenario_artifact_rollup');
    expect(WORKER_JOBS).toContain('evidence_artifact_rollup');
    expect(WORKER_JOBS).toContain('artifact_ledger_bootstrap');

    const artifactResult = await runJob('artifact_ledger_bootstrap');
    expect(artifactResult.jobId).toBe('artifact_ledger_bootstrap');
    expect(typeof artifactResult.payload.outputPath).toBe('string');
  });
});
