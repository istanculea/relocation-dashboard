import { createApiHttpServer } from '../../../packages/shared/contracts/api/httpRouteAdapter.js';
import { pathToFileURL } from 'node:url';
import { apiV1Handlers } from './api/v1/index.js';

export const startAdminApiServer = ({
  port = Number(process.env.ADMIN_API_PORT ?? 4070),
  host = process.env.ADMIN_API_HOST ?? '127.0.0.1',
} = {}) => new Promise((resolve) => {
  const server = createApiHttpServer({ handlers: apiV1Handlers });
  server.listen(port, host, () => {
    console.log(`admin api runtime listening on http://${host}:${port}`);
    console.log('artifact endpoints enabled: /v1/admin/artifacts/scenario and /v1/admin/artifacts/evidence');
    resolve(server);
  });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startAdminApiServer().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
