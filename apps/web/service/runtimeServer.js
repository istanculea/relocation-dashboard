const importModule = (specifier) => Function('s', 'return import(s);')(specifier);

export const startWebServiceRuntime = ({
  port = Number(process.env.WEB_SERVICE_PORT ?? 4174),
  host = process.env.WEB_SERVICE_HOST ?? '127.0.0.1',
} = {}) => new Promise(async (resolve, reject) => {
  try {
    const [{ createApiHttpServer }, { apiV1Handlers }] = await Promise.all([
      importModule('../../../packages/shared/contracts/api/httpRouteAdapter.js'),
      importModule('../../../packages/shared/contracts/api/v1Handlers.js'),
    ]);

    const server = createApiHttpServer({ handlers: apiV1Handlers });
    const shutdownServer = () => {
      if (server.listening) {
        server.close();
      }
    };

    process.on('exit', shutdownServer);
    process.on('SIGINT', shutdownServer);
    process.on('SIGTERM', shutdownServer);
    server.once('close', () => {
      process.off('exit', shutdownServer);
      process.off('SIGINT', shutdownServer);
      process.off('SIGTERM', shutdownServer);
    });

    server.listen(port, host, () => {
      console.log(`web service runtime listening on http://${host}:${port}`);
      resolve(server);
    });
  } catch (error) {
    reject(error);
  }
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
