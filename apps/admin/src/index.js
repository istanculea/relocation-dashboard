import {
  addOverride,
  listOverrides,
  updateOverrideStatus,
} from './overrides/overrideStore.js';
import { listPendingReviewQueue } from './reviews/reviewQueue.js';
import { apiV1Handlers } from './api/v1/index.js';
import { startAdminApiServer } from './server.js';

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
    console.log('admin app feature slice OK');
    return;
  }

  if (command === 'overrides:list') {
    const overrides = await listOverrides();
    printJson(overrides);
    return;
  }

  if (command === 'overrides:add') {
    const payload = {
      metricKey: options.metric ?? 'unknown_metric',
      targetId: options.target ?? 'unknown_target',
      overrideType: options.type ?? 'confidence_adjustment',
      reason: options.reason ?? 'unspecified',
      requestedBy: options.by ?? 'analyst',
      value: Number.isFinite(Number(options.value)) ? Number(options.value) : null,
      notes: options.notes ?? '',
    };

    const created = await addOverride(payload);
    printJson(created);
    return;
  }

  if (command === 'overrides:approve') {
    if (!options.id) {
      throw new Error('Missing required --id for overrides:approve');
    }

    const updated = await updateOverrideStatus(options.id, 'approved', options.by ?? 'reviewer');
    printJson(updated);
    return;
  }

  if (command === 'reviews:queue') {
    const queue = await listPendingReviewQueue();
    printJson(queue);
    return;
  }

  if (command === 'api:contracts:list') {
    printJson(Object.keys(apiV1Handlers));
    return;
  }

  if (command === 'serve') {
    await startAdminApiServer({
      port: Number(options.port ?? process.env.ADMIN_API_PORT ?? 4070),
      host: String(options.host ?? process.env.ADMIN_API_HOST ?? '127.0.0.1'),
    });
    return;
  }

  throw new Error(`Unknown admin command: ${command}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
