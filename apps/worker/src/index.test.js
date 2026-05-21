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
});
