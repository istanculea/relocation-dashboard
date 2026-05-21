import { runJob, runRegisteredJobs, WORKER_JOBS } from './jobs/jobRunner.js';

const args = process.argv.slice(2);
const command = args[0] ?? '--check';

const parseOptions = (rawArgs) => rawArgs.reduce((acc, token) => {
  const [key, value] = token.split('=');
  if (key.startsWith('--')) {
    acc[key.slice(2)] = value ?? true;
  }
  return acc;
}, {});

const printJson = (value) => {
  console.log(JSON.stringify(value, null, 2));
};

const run = async () => {
  const options = parseOptions(args.slice(1));

  if (command === '--check') {
    console.log('worker app feature slice OK');
    console.log(`registeredJobs: ${WORKER_JOBS.join(', ')}`);
    return;
  }

  if (command === 'jobs:list') {
    printJson(WORKER_JOBS);
    return;
  }

  if (command === 'jobs:run') {
    if (!options.id) {
      throw new Error('Missing required --id for jobs:run');
    }

    const output = await runJob(options.id);
    printJson(output);
    return;
  }

  if (command === 'jobs:run-all') {
    const output = await runRegisteredJobs();
    printJson(output);
    return;
  }

  throw new Error(`Unknown worker command: ${command}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
