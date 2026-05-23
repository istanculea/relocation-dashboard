import { createServer } from 'node:http';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const readJsonBody = async (request) => {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method ?? '')) {
    return {};
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
    if (chunks.reduce((total, part) => total + part.length, 0) > 1024 * 1024) {
      throw new Error('Request body exceeds 1MB limit');
    }
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Malformed JSON request body');
  }
};

const compileRoute = (method, pattern, handlerKey, mapParams = () => ({})) => ({
  method,
  pattern,
  handlerKey,
  mapParams,
});

const routes = [
  compileRoute('POST', /^\/v1\/atlas\/layers\/query$/, 'queryAtlasLayers', ({ body }) => body),
  compileRoute('GET', /^\/v1\/subjects\/([^/]+)\/([^/]+)\/snapshot$/, 'getSubjectSnapshot', ({ captures, query }) => ({
    subjectType: captures[0],
    subjectId: captures[1],
    horizon: query.horizon,
  })),
  compileRoute('POST', /^\/v1\/compare$/, 'compareSubjects', ({ body }) => body),
  compileRoute('POST', /^\/v1\/forecast\/query$/, 'queryForecast', ({ body }) => body),
  compileRoute('POST', /^\/v1\/rhythm\/query$/, 'queryRhythm', ({ body }) => body),
  compileRoute('POST', /^\/v1\/simulations\/runs$/, 'createSimulationRun', ({ body }) => body),
  compileRoute('GET', /^\/v1\/simulations\/runs\/([^/]+)$/, 'getSimulationRun', ({ captures }) => ({ runId: captures[0] })),
  compileRoute('GET', /^\/v1\/evidence\/observations\/([^/]+)$/, 'getObservationEvidence', ({ captures }) => ({ observationId: captures[0] })),
  compileRoute('POST', /^\/v1\/candidate-sets$/, 'createCandidateSet', ({ body }) => body),
  compileRoute('GET', /^\/v1\/candidate-sets\/([^/]+)$/, 'getCandidateSet', ({ captures }) => ({ candidateSetId: captures[0] })),
  compileRoute('PATCH', /^\/v1\/candidate-sets\/([^/]+)$/, 'patchCandidateSet', ({ captures, body }) => ({
    candidateSetId: captures[0],
    patch: body,
  })),
  compileRoute('POST', /^\/v1\/exports$/, 'createExport', ({ body }) => body),
  compileRoute('POST', /^\/v1\/admin\/artifacts\/scenario$/, 'createScenarioArtifact', ({ body }) => body),
  compileRoute('GET', /^\/v1\/admin\/artifacts\/scenario\/([^/]+)$/, 'getScenarioArtifact', ({ captures }) => ({ artifactId: captures[0] })),
  compileRoute('POST', /^\/v1\/admin\/artifacts\/evidence$/, 'createEvidenceArtifact', ({ body }) => body),
  compileRoute('GET', /^\/v1\/admin\/artifacts\/evidence\/([^/]+)$/, 'getEvidenceArtifact', ({ captures }) => ({ artifactId: captures[0] })),
];

const createNotFoundBody = (pathname, method) => ({
  request_id: `http-${Date.now()}`,
  data: null,
  meta: {
    generated_at: new Date().toISOString(),
    contract_version: 'v1',
  },
  errors: [{ code: 'not_found', message: `No route for ${method} ${pathname}` }],
});

const createNotImplementedBody = (pathname, method, handlerKey) => ({
  request_id: `http-${Date.now()}`,
  data: null,
  meta: {
    generated_at: new Date().toISOString(),
    contract_version: 'v1',
  },
  errors: [{ code: 'not_implemented', message: `Handler ${handlerKey} unavailable for ${method} ${pathname}` }],
});

export const dispatchApiRequest = async ({ handlers, method, pathname, query, body }) => {
  const route = routes.find((candidateRoute) => candidateRoute.method === method && candidateRoute.pattern.test(pathname));

  if (!route) {
    return {
      statusCode: 404,
      payload: createNotFoundBody(pathname, method),
    };
  }

  const handler = handlers[route.handlerKey];

  if (typeof handler !== 'function') {
    return {
      statusCode: 501,
      payload: createNotImplementedBody(pathname, method, route.handlerKey),
    };
  }

  const routeMatch = pathname.match(route.pattern);
  const args = route.mapParams({
    captures: routeMatch?.slice(1) ?? [],
    query,
    body,
  });
  const payload = await handler(args);

  const acceptedStatuses = {
    createSimulationRun: 202,
    createExport: 202,
    createCandidateSet: 201,
    createScenarioArtifact: 201,
    createEvidenceArtifact: 201,
  };

  return {
    statusCode: acceptedStatuses[route.handlerKey] ?? 200,
    payload,
  };
};

const createApiRequestListener = ({ handlers, allowCors, logger }) => async (request, response) => {
  try {
    if (allowCors) {
      const requestOrigin = request.headers.origin;
      if (typeof requestOrigin === 'string' && requestOrigin.trim().length > 0) {
        response.setHeader('access-control-allow-origin', requestOrigin);
        response.setHeader('vary', 'origin');
      }
      response.setHeader('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS');
      response.setHeader('access-control-allow-headers', 'content-type,authorization');
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url ?? '/', 'http://localhost');
    const body = await readJsonBody(request);
    const query = Object.fromEntries(url.searchParams.entries());

    const { statusCode, payload } = await dispatchApiRequest({
      handlers,
      method: request.method ?? 'GET',
      pathname: url.pathname,
      query,
      body,
    });

    response.writeHead(statusCode, jsonHeaders);
    response.end(`${JSON.stringify(payload)}\n`);
  } catch (error) {
    logger.error?.(error);
    response.writeHead(500, jsonHeaders);
    response.end(`${JSON.stringify({
      request_id: `http-${Date.now()}`,
      data: null,
      meta: {
        generated_at: new Date().toISOString(),
        contract_version: 'v1',
      },
      errors: [{ code: 'internal_error', message: error.message }],
    })}\n`);
  }
};

export const createApiHttpServer = ({ handlers, allowCors = true, logger = console } = {}) => {
  const requestListener = createApiRequestListener({ handlers, allowCors, logger });
  const server = createServer();

  const shutdownServer = () => {
    if (server.listening) {
      server.close();
    }
  };

  process.once('exit', shutdownServer);
  process.once('SIGINT', shutdownServer);
  process.once('SIGTERM', shutdownServer);

  server.on('request', requestListener);
  server.on('error', (error) => {
    logger.error?.(error);

    if (server.listening) {
      server.close();
    }
  });
  server.on('close', () => {
    process.off('exit', shutdownServer);
    process.off('SIGINT', shutdownServer);
    process.off('SIGTERM', shutdownServer);
    logger.info?.('api_http_server_closed');
  });

  return server;
};
