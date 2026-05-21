import { readFile } from 'node:fs/promises';

const checks = [
  {
    id: 'domain',
    specifier: '../packages/domain/index.js',
    assert: (module) => typeof module.buildSpatialHierarchy === 'function',
  },
  {
    id: 'forecasting',
    specifier: '../packages/forecasting/index.js',
    assert: (module) => typeof module.buildCityTemporalOutlook === 'function',
  },
  {
    id: 'simulation',
    specifier: '../packages/simulation/index.js',
    assert: (module) => typeof module.createSimulationShock === 'function',
  },
  {
    id: 'scoring',
    specifier: '../packages/scoring/index.js',
    assert: (module) => typeof module.buildStrategicPositioning === 'function',
  },
  {
    id: 'narratives',
    specifier: '../packages/narratives/index.js',
    assert: (module) => typeof module.buildNarrativeBrief === 'function',
  },
  {
    id: 'graph',
    specifier: '../packages/graph/index.js',
    assert: (module) => Array.isArray(module.MOBILITY_MAPS),
  },
  {
    id: 'exports',
    specifier: '../packages/exports/index.js',
    assert: (module) => typeof module.exportCsvSnapshot === 'function',
  },
  {
    id: 'shared',
    specifier: '../packages/shared/index.js',
    assert: (module) => typeof module.CONTRACT_VERSION === 'string',
  },
  {
    id: 'ui',
    specifier: '../packages/ui/index.js',
    assert: (module) => module.UI_PACKAGE_STATUS === 'phase5-scaffold',
  },
];

const failures = [];

for (const check of checks) {
  const imported = await import(check.specifier);
  if (!check.assert(imported)) {
    failures.push(check.id);
  }
}

const mapsBridgeSource = await readFile(new URL('../packages/maps/index.js', import.meta.url), 'utf8');
if (!mapsBridgeSource.includes("../../apps/web/src/platform/maps/transportHeuristics.js")) {
  failures.push('maps');
}

if (failures.length > 0) {
  console.error(`Package export checks failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Package export checks OK: ${checks.map((check) => check.id).join(', ')}`);
