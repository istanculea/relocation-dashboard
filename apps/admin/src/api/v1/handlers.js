export {
  compareSubjects,
  createCandidateSet,
  createExport,
  createSimulationRun,
  getCandidateSet,
  getObservationEvidence,
  getSimulationRun,
  getSubjectSnapshot,
  patchCandidateSet,
  queryAtlasLayers,
  queryForecast,
  queryRhythm,
  apiV1Handlers,
} from '../../../../../packages/shared/contracts/api/v1Handlers.js';

const envelopeMeta = {
  generated_at: new Date().toISOString(),
  contract_version: 'v1',
};

const withEnvelope = (prefix, data) => ({
  request_id: `${prefix}-${Date.now()}`,
  data,
  meta: envelopeMeta,
});

const scenarioArtifacts = new Map();
const evidenceArtifacts = new Map();

const artifactId = (prefix, payload) => {
  const canonical = JSON.stringify(payload ?? {});
  let hash = 0;
  for (let index = 0; index < canonical.length; index += 1) {
    hash = ((hash << 5) - hash) + canonical.charCodeAt(index);
    hash |= 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16)}-${Date.now()}`;
};

export const createScenarioArtifact = ({
  run_id = null,
  name = 'scenario-artifact',
  payload = {},
  tags = [],
} = {}) => {
  const id = artifactId('sart', { run_id, name, payload, tags });
  const record = {
    artifact_id: id,
    artifact_type: 'scenario',
    run_id,
    name,
    payload,
    tags: Array.isArray(tags) ? tags : [],
    created_at: new Date().toISOString(),
  };

  scenarioArtifacts.set(id, record);
  return withEnvelope('scenario-artifact-create', record);
};

export const getScenarioArtifact = ({ artifactId: id } = {}) => withEnvelope(
  'scenario-artifact-get',
  scenarioArtifacts.get(id) ?? {
    artifact_id: id,
    artifact_type: 'scenario',
    not_found: true,
  },
);

export const createEvidenceArtifact = ({
  observation_id = null,
  name = 'evidence-artifact',
  payload = {},
  tags = [],
} = {}) => {
  const id = artifactId('eart', { observation_id, name, payload, tags });
  const record = {
    artifact_id: id,
    artifact_type: 'evidence',
    observation_id,
    name,
    payload,
    tags: Array.isArray(tags) ? tags : [],
    created_at: new Date().toISOString(),
  };

  evidenceArtifacts.set(id, record);
  return withEnvelope('evidence-artifact-create', record);
};

export const getEvidenceArtifact = ({ artifactId: id } = {}) => withEnvelope(
  'evidence-artifact-get',
  evidenceArtifacts.get(id) ?? {
    artifact_id: id,
    artifact_type: 'evidence',
    not_found: true,
  },
);
