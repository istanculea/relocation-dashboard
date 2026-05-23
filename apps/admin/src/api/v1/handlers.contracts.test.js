import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  compareSubjects,
  createCandidateSet,
  createExport,
  createSimulationRun,
  getObservationEvidence,
  getSimulationRun,
  getSubjectSnapshot,
  queryAtlasLayers,
  queryForecast,
  queryRhythm,
} from '../../../../../packages/shared/contracts/api/v1Handlers.js';
import { dispatchApiRequest } from '../../../../../packages/shared/contracts/api/httpRouteAdapter.js';
import { apiV1Handlers } from './index.js';

const schemaPath = (fileName) => path.resolve('packages', 'domain', 'schema', 'json', fileName);
const openApiPath = path.resolve('packages', 'shared', 'contracts', 'api', 'openapi.v1.yaml');

const loadSchema = async (fileName) => {
  const raw = await readFile(schemaPath(fileName), 'utf8');
  return JSON.parse(raw);
};

const loadOpenApi = async () => {
  const raw = await readFile(openApiPath, 'utf8');
  return YAML.parse(raw);
};

const dereferenceSchema = (schema, components) => {
  if (Array.isArray(schema)) {
    return schema.map((entry) => dereferenceSchema(entry, components));
  }

  if (schema && typeof schema === 'object') {
    if (typeof schema.$ref === 'string' && schema.$ref.startsWith('#/components/schemas/')) {
      const schemaName = schema.$ref.split('/').at(-1);
      return dereferenceSchema(components[schemaName], components);
    }

    return Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [key, dereferenceSchema(value, components)]),
    );
  }

  return schema;
};

const getOpenApiResponseSchema = async (routePath, method, statusCode) => {
  const openApi = await loadOpenApi();
  const operation = openApi.paths[routePath][method.toLowerCase()];
  const response = operation.responses[String(statusCode)] ?? operation.responses.default;
  const schema = response.content['application/json'].schema;
  return dereferenceSchema(schema, openApi.components.schemas);
};

describe('v1 API contract handlers', () => {
  it('subject snapshot response satisfies JSON schema', async () => {
    const schema = await loadSchema('subject_snapshot_response.schema.json');
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const response = getSubjectSnapshot({ subjectType: 'city', subjectId: 'vienna-at', horizon: 'h5' });

    expect(validate(response)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('compare response satisfies JSON schema', async () => {
    const schema = await loadSchema('compare_response.schema.json');
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const response = compareSubjects({
      subjects: [
        { type: 'city', id: 'vienna-at', name: 'Vienna' },
        { type: 'city', id: 'salzburg-at', name: 'Salzburg' },
      ],
      lens: 'family_resilience',
      horizon: 'h10',
    });

    expect(validate(response)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('atlas layer response conforms to OpenAPI schema', async () => {
    const schema = await getOpenApiResponseSchema('/v1/atlas/layers/query', 'post', 200);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const response = queryAtlasLayers({
      bbox: [5, 45, 20, 55],
      zoom: 6,
      layers: ['rail_accessibility'],
    });

    expect(validate(response)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('forecast response conforms to OpenAPI schema', async () => {
    const schema = await getOpenApiResponseSchema('/v1/forecast/query', 'post', 200);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const response = queryForecast({
      subjects: [{ type: 'city', id: 'vienna-at', name: 'Vienna' }],
      metric_keys: ['affordability_resilience'],
      horizon: 'h5',
    });

    expect(validate(response)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('rhythm response conforms to OpenAPI schema', async () => {
    const schema = await getOpenApiResponseSchema('/v1/rhythm/query', 'post', 200);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const response = queryRhythm({
      subjects: [{ type: 'city', id: 'vienna-at', name: 'Vienna' }],
    });

    expect(validate(response)).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('simulation create/get responses conform to OpenAPI schemas', async () => {
    const createSchema = await getOpenApiResponseSchema('/v1/simulations/runs', 'post', 202);
    const getSchema = await getOpenApiResponseSchema('/v1/simulations/runs/{runId}', 'get', 200);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validateCreate = ajv.compile(createSchema);
    const validateGet = ajv.compile(getSchema);

    const created = createSimulationRun({
      scenario_type: 'inflation',
      scope: { type: 'global', target_ids: ['vienna-at'] },
      intensity: 0.7,
      duration_weeks: 8,
    });
    const fetched = getSimulationRun({ runId: created.data.run_id });

    expect(validateCreate(created)).toBe(true);
    expect(validateGet(fetched)).toBe(true);
  });

  it('candidate/evidence/export responses conform to OpenAPI schemas', async () => {
    const candidateSchema = await getOpenApiResponseSchema('/v1/candidate-sets', 'post', 201);
    const evidenceSchema = await getOpenApiResponseSchema('/v1/evidence/observations/{observationId}', 'get', 200);
    const exportSchema = await getOpenApiResponseSchema('/v1/exports', 'post', 202);

    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validateCandidate = ajv.compile(candidateSchema);
    const validateEvidence = ajv.compile(evidenceSchema);
    const validateExport = ajv.compile(exportSchema);

    const candidate = createCandidateSet({
      title: 'Alpine shortlist',
      subjects: [{ type: 'city', id: 'vienna-at', name: 'Vienna' }],
      annotations: [],
    });
    const evidence = getObservationEvidence({ observationId: 'obs-123' });
    const exportJob = createExport({
      workspace_state: { page: 'map' },
      format: 'json',
      include_evidence: true,
    });

    expect(validateCandidate(candidate)).toBe(true);
    expect(validateEvidence(evidence)).toBe(true);
    expect(validateExport(exportJob)).toBe(true);
  });

  it('supports scenario and evidence artifact admin endpoints', async () => {
    const scenarioCreate = await dispatchApiRequest({
      handlers: apiV1Handlers,
      method: 'POST',
      pathname: '/v1/admin/artifacts/scenario',
      query: {},
      body: {
        run_id: 'run-abc',
        name: 'Scenario snapshot',
        payload: { score: 7.8 },
        tags: ['step7'],
      },
    });

    expect(scenarioCreate.statusCode).toBe(201);
    expect(scenarioCreate.payload.data.artifact_type).toBe('scenario');

    const scenarioGet = await dispatchApiRequest({
      handlers: apiV1Handlers,
      method: 'GET',
      pathname: `/v1/admin/artifacts/scenario/${scenarioCreate.payload.data.artifact_id}`,
      query: {},
      body: {},
    });

    expect(scenarioGet.statusCode).toBe(200);
    expect(scenarioGet.payload.data.artifact_id).toBe(scenarioCreate.payload.data.artifact_id);

    const evidenceCreate = await dispatchApiRequest({
      handlers: apiV1Handlers,
      method: 'POST',
      pathname: '/v1/admin/artifacts/evidence',
      query: {},
      body: {
        observation_id: 'obs-42',
        name: 'Evidence bundle',
        payload: { sourceCount: 3 },
      },
    });

    expect(evidenceCreate.statusCode).toBe(201);
    expect(evidenceCreate.payload.data.artifact_type).toBe('evidence');
  });
});
