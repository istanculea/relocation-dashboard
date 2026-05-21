const importModule = (specifier) => Function('s', 'return import(s);')(specifier);

export const startWebServiceRuntime = ({
  port = Number(process.env.WEB_SERVICE_PORT ?? 4174),
  host = process.env.WEB_SERVICE_HOST ?? '127.0.0.1',
} = {}) => new Promise((resolve, reject) => {
  Promise.all([
    importModule('../../../packages/shared/contracts/api/httpRouteAdapter.js'),
    importModule('../../../packages/shared/contracts/api/v1Handlers.js'),
  ]).then(([{ createApiHttpServer }, { apiV1Handlers }]) => {
  const server = createApiHttpServer({ handlers: apiV1Handlers });
  server.listen(port, host, () => {
    console.log(`web service runtime listening on http://${host}:${port}`);
    resolve(server);
  });
  }).catch(reject);
});

const maybeStartFromCli = async () => {
  if (!process.argv[1]) {
    return;
  }

  const { pathToFileURL } = await importModule('node:url');
  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    await startWebServiceRuntime();
  }
};

maybeStartFromCli().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
