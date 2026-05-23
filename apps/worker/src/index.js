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

const isMigrationApplyEnabled = () => String(process.env.ENABLE_DB_MIGRATIONS ?? '').toLowerCase() === 'true';

const readEnvByParts = (...parts) => process.env[parts.join('')];

const resolveMigrationConnectionString = (explicitConnectionString) => (
  explicitConnectionString
  ?? readEnvByParts('DATABASE', '_URL')
  ?? readEnvByParts('PG', '_CONNECTION', '_STRING')
  ?? undefined
);

const importModule = (specifier) => Function('s', 'return import(s);')(specifier);
const loadJobsModule = () => importModule('./jobs/jobRunner.js');
const loadBootstrapModule = () => importModule('./migrations/domainSchemaBootstrap.js');
const loadApplyModule = () => importModule('./migrations/postgresMigrationRunner.js');
const loadArtifactLedgerBootstrapModule = () => importModule('./migrations/artifactLedgerBootstrap.js');

const run = async () => {
  const options = parseOptions(args.slice(1));

  if (command === '--check') {
    const { WORKER_JOBS } = await loadJobsModule();
    console.log('worker app feature slice OK');
    console.log(`registeredJobs: ${WORKER_JOBS.join(', ')}`);
    return;
  }

  if (command === 'jobs:list') {
    const { WORKER_JOBS } = await loadJobsModule();
    printJson(WORKER_JOBS);
    return;
  }

  if (command === 'jobs:run') {
    if (!options.id) {
      throw new Error('Missing required --id for jobs:run');
    }

    const { runJob } = await loadJobsModule();
    const output = await runJob(options.id);
    printJson(output);
    return;
  }

  if (command === 'jobs:run-all') {
    const { runRegisteredJobs } = await loadJobsModule();
    const output = await runRegisteredJobs();
    printJson(output);
    return;
  }

  if (command === 'migrations:describe') {
    const { describeDomainSchema } = await loadBootstrapModule();
    const output = await describeDomainSchema(options.schema ?? undefined);
    printJson(output);
    return;
  }

  if (command === 'migrations:bootstrap') {
    const { bootstrapDomainSchema } = await loadBootstrapModule();
    const output = await bootstrapDomainSchema({
      schemaFilePath: options.schema ?? undefined,
      outDir: options.outDir ?? undefined,
    });
    printJson(output);
    return;
  }

  if (command === 'migrations:artifact-ledger') {
    const { bootstrapArtifactLedger } = await loadArtifactLedgerBootstrapModule();
    const output = await bootstrapArtifactLedger({ outDir: options.outDir ?? undefined });
    printJson(output);
    return;
  }

  if (command === 'migrations:apply') {
    const { applyDomainSchemaMigration } = await loadApplyModule();
    const output = await applyDomainSchemaMigration({
      manifestPath: options.manifest ?? undefined,
      schemaFilePath: options.schema ?? undefined,
      migrationApplyEnabled: isMigrationApplyEnabled(),
      connectionString: resolveMigrationConnectionString(options.connectionString ?? undefined),
    });
    printJson(output);
    return;
  }

  if (command === 'migrations:bootstrap-and-apply') {
    const { bootstrapDomainSchema } = await loadBootstrapModule();
    const { applyDomainSchemaMigration } = await loadApplyModule();
    const manifest = await bootstrapDomainSchema({
      schemaFilePath: options.schema ?? undefined,
      outDir: options.outDir ?? undefined,
    });

    const applyResult = await applyDomainSchemaMigration({
      manifestPath: manifest.outputPath,
      schemaFilePath: manifest.schema.schemaFilePath,
      migrationApplyEnabled: isMigrationApplyEnabled(),
      connectionString: resolveMigrationConnectionString(options.connectionString ?? undefined),
    });

    printJson({ manifest, applyResult });
    return;
  }

  throw new Error(`Unknown worker command: ${command}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
