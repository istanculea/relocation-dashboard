import { createHash } from 'node:crypto';

const nowIso = () => new Date().toISOString();

const sampleSubject = (subjectType = 'city', subjectId = 'vienna-at') => ({
  type: subjectType,
  id: subjectId,
  name: subjectType === 'city' ? 'Vienna' : 'Alpine Arc',
});

const confidenceSurface = (confidenceClass = 'source_backed', score = 0.86) => ({
  class: confidenceClass,
  score,
  freshness_days: 9,
  source_diversity: 0.78,
  evidence_depth: 0.81,
  assumptions_count: confidenceClass === 'inferential' ? 5 : 2,
});

const sampleMetrics = [
  {
    metric_key: 'affordability_resilience',
    value: 7.21,
    unit: 'index_0_10',
    directionality: 'higher_better',
    source_class: 'composite',
    confidence: confidenceSurface('composite', 0.76),
    lineage_id: 'lineage-affordability-001',
  },
  {
    metric_key: 'mobility_redundancy',
    value: 8.03,
    unit: 'index_0_10',
    directionality: 'higher_better',
    source_class: 'source_backed',
    confidence: confidenceSurface('source_backed', 0.9),
    lineage_id: 'lineage-mobility-003',
  },
];

const sampleForecastHighlights = [
  {
    metric_key: 'affordability_resilience',
    horizon: 'h5',
    value: 7.11,
    lower: 6.62,
    upper: 7.58,
    volatility: 0.26,
    confidence_trend: 'stable',
  },
  {
    metric_key: 'mobility_redundancy',
    horizon: 'h10',
    value: 8.2,
    lower: 7.8,
    upper: 8.6,
    volatility: 0.18,
    confidence_trend: 'improving',
  },
];

const sampleLifeRhythm = {
  calmness_index: 7.4,
  sensory_load_index: 4.2,
  bureaucracy_friction_index: 4.8,
  child_autonomy_index: 7.0,
  green_recovery_access_index: 8.1,
  social_tempo: 'balanced',
  overstimulation_risk: 3.9,
};

const envelopeMeta = {
  generated_at: nowIso(),
  contract_version: 'v1',
};

const buildRequestId = (prefix) => `${prefix}-${Date.now()}`;

const simulationRuns = new Map();
const candidateSets = new Map();

const stableId = (value, prefix) => {
  const digest = createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 12);
  return `${prefix}-${digest}`;
};

const withEnvelope = (prefix, data) => ({
  request_id: buildRequestId(prefix),
  data,
  meta: envelopeMeta,
});

export const queryAtlasLayers = ({ bbox = [], zoom = 5, layers = [] } = {}) => withEnvelope('atlas', {
  features: [
    {
      id: 'corridor-alpine-arc',
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[10.75, 47.35], [13.05, 46.75], [16.37, 48.21]],
      },
      properties: {
        layer: layers[0] ?? 'rail_accessibility',
        zoom,
        bbox,
      },
    },
  ],
  confidence_overlays: [
    {
      layer: layers[0] ?? 'rail_accessibility',
      confidence: confidenceSurface('source_backed', 0.89),
    },
  ],
});

export const getSubjectSnapshot = ({ subjectType = 'city', subjectId = 'vienna-at', horizon = 'current' } = {}) => withEnvelope('snapshot', {
  subject: sampleSubject(subjectType, subjectId),
  metrics: sampleMetrics,
  forecast_highlights: sampleForecastHighlights.map((entry) => ({ ...entry, horizon: horizon === 'current' ? entry.horizon : horizon })),
  life_rhythm: sampleLifeRhythm,
  confidence: confidenceSurface('composite', 0.82),
});

export const compareSubjects = ({
  subjects = [sampleSubject('city', 'vienna-at'), sampleSubject('city', 'salzburg-at')],
  lens = 'family_resilience',
  horizon = 'current',
} = {}) => withEnvelope('compare', {
  subjects,
  lens,
  horizon,
  strengths: subjects.map((subject) => ({
    subject_id: subject.id,
    narrative: `${subject.name} shows strong mobility-access resilience for the selected lens.`,
    drivers: ['mobility_redundancy', 'healthcare_reachability', 'family_logistics'],
  })),
  tradeoffs: subjects.map((subject) => ({
    subject_id: subject.id,
    narrative: `${subject.name} carries moderate affordability pressure risk in medium horizons.`,
    risk_factors: ['rent_pressure', 'demographic_pressure'],
  })),
  trajectory_divergence: subjects.map((subject, index) => ({
    metric_key: 'affordability_resilience',
    subject_id: subject.id,
    delta: Number((0.2 - index * 0.14).toFixed(2)),
  })),
  confidence_matrix: subjects.flatMap((subject) => [
    {
      subject_id: subject.id,
      metric_key: 'affordability_resilience',
      class: 'composite',
      score: 0.76,
    },
    {
      subject_id: subject.id,
      metric_key: 'mobility_redundancy',
      class: 'source_backed',
      score: 0.9,
    },
  ]),
});

export const queryForecast = ({ subjects = [sampleSubject()], metric_keys = ['affordability_resilience'], horizon = 'h5' } = {}) => withEnvelope('forecast', {
  series: subjects.flatMap((subject) => metric_keys.map((metricKey) => ({
    subject_id: subject.id,
    metric_key: metricKey,
    points: [
      { ts: new Date('2026-01-01').toISOString(), value: 7.2, lower: 6.7, upper: 7.8 },
      { ts: new Date('2028-01-01').toISOString(), value: 7.1, lower: 6.5, upper: 7.7 },
      { ts: new Date('2031-01-01').toISOString(), value: 7.0, lower: 6.2, upper: 7.6 },
    ],
    horizon,
    volatility: 0.28,
    confidence_trend: 'stable',
  }))),
});

export const queryRhythm = ({ subjects = [sampleSubject()] } = {}) => withEnvelope('rhythm', {
  results: subjects.map((subject) => ({
    subject_id: subject.id,
    compatibility_index: 7.45,
    calmness_index: 7.4,
    sensory_load_index: 4.2,
    bureaucracy_friction_index: 4.8,
    narrative: `${subject.name} aligns well with calm, family-oriented daily rhythms while preserving connectivity.`,
    confidence: confidenceSurface('composite', 0.79),
  })),
});

export const createSimulationRun = ({ scenario_type = 'inflation', scope = { type: 'global', target_ids: [] }, intensity = 0.5, duration_weeks = 12 } = {}) => {
  const runId = stableId({ scenario_type, scope, intensity, duration_weeks }, 'run');

  simulationRuns.set(runId, {
    run_id: runId,
    status: 'completed',
    impacted_subjects: scope.target_ids?.length ?? 0,
    delta_summary: {
      affordability_resilience: -0.34,
      mobility_redundancy: -0.08,
      survivability: -0.19,
    },
    errors: [],
  });

  return {
    request_id: buildRequestId('simulation-create'),
    data: {
      run_id: runId,
      status: 'queued',
      status_url: `/v1/simulations/runs/${runId}`,
    },
    meta: envelopeMeta,
  };
};

export const getSimulationRun = ({ runId }) => {
  const run = simulationRuns.get(runId) ?? {
    run_id: runId,
    status: 'failed',
    impacted_subjects: 0,
    delta_summary: {},
    errors: ['run_not_found'],
  };

  return withEnvelope('simulation-get', run);
};

export const getObservationEvidence = ({ observationId = 'obs-001' } = {}) => withEnvelope('evidence', {
  observation_id: observationId,
  sources: [
    {
      source_id: 'src-eurostat-001',
      title: 'Regional mobility and affordability trends',
      publisher: 'Eurostat',
      published_at: '2026-01-15',
      url: 'https://example.org/eurostat/regional-mobility',
      trace_pointer: 'dataset:regional_mobility/v3#row=1822',
      weight: 0.72,
    },
  ],
  assumptions: ['Temporal interpolation for missing Q3 values.'],
});

export const createCandidateSet = ({ title = 'Alpine-focused shortlist', subjects = [sampleSubject()], annotations = [] } = {}) => {
  const candidateSetId = stableId({ title, subjects }, 'cset');
  const stored = {
    candidate_set_id: candidateSetId,
    title,
    subjects,
    annotations,
    scenario_snapshots: [],
  };

  candidateSets.set(candidateSetId, stored);
  return withEnvelope('candidate-create', stored);
};

export const getCandidateSet = ({ candidateSetId }) => withEnvelope('candidate-get', candidateSets.get(candidateSetId) ?? {
  candidate_set_id: candidateSetId,
  title: 'unknown',
  subjects: [],
  annotations: [],
  scenario_snapshots: [],
});

export const patchCandidateSet = ({ candidateSetId, patch = {} }) => {
  const existing = candidateSets.get(candidateSetId) ?? {
    candidate_set_id: candidateSetId,
    title: 'untitled',
    subjects: [],
    annotations: [],
    scenario_snapshots: [],
  };

  const updated = {
    ...existing,
    ...patch,
    candidate_set_id: candidateSetId,
  };

  candidateSets.set(candidateSetId, updated);
  return withEnvelope('candidate-patch', updated);
};

export const createExport = ({ workspace_state = {}, format = 'json', include_evidence = true } = {}) => withEnvelope('export', {
  export_job_id: stableId({ workspace_state, format, include_evidence }, 'export'),
  status: 'queued',
  download_url: '',
});

export const apiV1Handlers = {
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
};
