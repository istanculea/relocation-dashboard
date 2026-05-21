# European Mobility Intelligence Platform Implementation Blueprint

## 1. Purpose

This blueprint translates the strategic redesign into an execution plan for the current repository.

It is designed to:

- preserve current build and runtime behavior while refactoring,
- introduce exact package and module boundaries,
- define stable interface contracts between layers,
- map current files to phased migration targets.

## 2. Current Baseline (Confirmed)

The current React surface already has strong seams that support incremental evolution:

- App shell and route orchestration: `src/App.jsx`, `src/app/useDashboardOrchestration.js`
- Global state contexts: `src/context/DashboardContext.jsx`, `src/context/MobilityContext.jsx`
- Data assembly and derived outputs: `src/relocationData.js`
- Mobility schema validation primitives: `src/data/mobility/schema.js`
- Map rendering and transport heuristics: `src/components/CityMapPage.jsx`, `src/components/cityMapPageUtils.js`

These seams are the starting point for package extraction.

## 3. Target Repository Topology (Incremental)

### 3.1 End-State Topology

```text
/apps
  /web
  /admin
  /worker

/packages
  /domain
  /ingestion
  /verification
  /graph
  /forecasting
  /simulation
  /scoring
  /narratives
  /maps
  /exports
  /ui
  /shared
```

### 3.2 Transitional Topology (Inside Existing Vite App)

Before a monorepo split, implement boundaries under `src/`:

```text
src/
  platform/
    domain/
    verification/
    graph/
    forecasting/
    simulation/
    scoring/
    narratives/
    maps/
    exports/
    shared/
  application/
    atlas/
    compare/
    outlook/
    family-fit/
  presentation/
    components/
    pages/
    styles/
```

Rule: all new domain logic lands in `src/platform/*`; `src/components/*` becomes presentation-only over time.

## 4. Exact Package Boundaries

### 4.1 package: domain

Owns canonical entities and value objects only.

Allowed responsibilities:

- entity schemas and validators,
- hierarchy relationships,
- identity and keys.

Forbidden:

- scoring formulas,
- transport inference heuristics,
- UI shaping.

Primary entities:

- Continent
- StrategicRegion
- UrbanCluster
- CityNode
- NeighborhoodZone
- MobilityNode
- MobilityEdge
- IndicatorSnapshot
- IndicatorProjection
- VerificationRecord
- SimulationScenario
- NarrativeBrief

### 4.2 package: verification

Owns source quality, freshness, confidence, and trust composition.

Allowed responsibilities:

- confidence scoring,
- freshness decay,
- source diversity index,
- audit surface assembly.

Consumes from:

- `domain`

Used by:

- `scoring`, `forecasting`, `narratives`, `ui`

### 4.3 package: graph

Owns mobility network model and network metrics.

Allowed responsibilities:

- nodes and edges graph materialization,
- path and alternate path metrics,
- accessibility and redundancy metrics.

Consumes from:

- `domain`, `verification`

Used by:

- `maps`, `simulation`, `scoring`, `application/atlas`

### 4.4 package: forecasting

Owns temporal intelligence model.

Allowed responsibilities:

- trend extraction,
- short/medium projections,
- volatility, confidence bands.

Consumes from:

- `domain`, `verification`

Used by:

- `simulation`, `scoring`, `application/outlook`, `narratives`

### 4.5 package: simulation

Owns event-driven stress and resilience simulation.

Allowed responsibilities:

- shock definition,
- cascade impact propagation,
- survivability outputs.

Consumes from:

- `graph`, `forecasting`, `verification`

Used by:

- `application/atlas`, `application/outlook`, `narratives`

### 4.6 package: scoring

Owns deterministic scoring and strategic positioning outputs.

Allowed responsibilities:

- lens weighting,
- multi-dimensional profile calculation,
- strengths/tradeoffs extraction.

Consumes from:

- `domain`, `graph`, `forecasting`, `verification`, `simulation`

Used by:

- `application/compare`, `application/family-fit`, `narratives`

### 4.7 package: narratives

Owns structured explainability and LLM-safe narrative assembly.

Allowed responsibilities:

- deterministic brief construction,
- citation map building,
- confidence-aware summary generation.

Forbidden:

- fact generation,
- score mutation,
- rank decisions.

Consumes from:

- `scoring`, `verification`, `forecasting`, `simulation`

Used by:

- `application/compare`, `application/outlook`, export surfaces

### 4.8 package: maps

Owns geospatial view models and map overlay assembly.

Allowed responsibilities:

- map geometry transformation,
- layer model generation,
- mobility halos and pressure surfaces.

Consumes from:

- `graph`, `forecasting`, `verification`, `domain`

Used by:

- `application/atlas`, `presentation/components`

### 4.9 package: exports

Owns export payload contracts and serialization surfaces.

Consumes from:

- `scoring`, `narratives`, `verification`

Used by:

- app export actions and worker surfaces.

### 4.10 package: ui

Owns design tokens, reusable primitives, and page composition contracts.

Forbidden:

- direct reads from raw data files,
- business logic formulas.

## 5. Interface Contracts (Stable API Layer)

The following contracts should be implemented as JSDoc typedefs now, and migrated to TypeScript interfaces during the TypeScript phase.

### 5.1 Hierarchy Contracts

```ts
type RegionId = string;
type ClusterId = string;
type CityId = string;
type ZoneId = string;

interface StrategicRegion {
  id: RegionId;
  name: string;
  continentId: string;
  clusterIds: ClusterId[];
}

interface UrbanCluster {
  id: ClusterId;
  name: string;
  regionId: RegionId;
  cityIds: CityId[];
  corridorIds: string[];
}

interface CityNode {
  id: CityId;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  clusterId: ClusterId;
  zoneIds: ZoneId[];
}
```

### 5.2 Mobility Graph Contracts

```ts
type MobilityNodeType = 'city' | 'airport' | 'railHub' | 'healthHub' | 'cluster';
type MobilityEdgeMode = 'railHighSpeed' | 'railRegional' | 'air' | 'road' | 'ferry';

interface MobilityNode {
  id: string;
  type: MobilityNodeType;
  cityId?: CityId;
  lat: number;
  lon: number;
  capacityIndex?: number;
}

interface MobilityEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  mode: MobilityEdgeMode;
  travelMinutes: number;
  reliabilityScore: number;
  redundancyScore: number;
  borderCrossing: boolean;
}

interface AccessibilityProfile {
  cityId: CityId;
  populationReach3h: number;
  gdpReach3h: number;
  capitalsReach6h: number;
  airportsReach3h: number;
  transferComplexity: number;
}

interface ResilienceProfile {
  cityId: CityId;
  alternateRouteScore: number;
  disruptionSurvivability: number;
  strikeExposure: number;
  climateExposure: number;
}
```

### 5.3 Verification and Confidence Contracts

```ts
type EvidenceClass = 'sourceBacked' | 'composite' | 'inferential';

interface VerificationRecord {
  metricKey: string;
  cityId: CityId;
  evidenceClass: EvidenceClass;
  sourceCount: number;
  sourceDiversityScore: number;
  freshnessDays: number;
  freshnessDecay: number;
  confidence: number;
  verifiedAt: string;
  sourceRefs: string[];
}
```

### 5.4 Forecast Contracts

```ts
interface ForecastPoint {
  year: number;
  value: number;
  lower: number;
  upper: number;
}

interface IndicatorTimeline {
  cityId: CityId;
  indicatorKey: string;
  current: number;
  trend: 'improving' | 'stable' | 'worsening';
  volatility: 'low' | 'medium' | 'high';
  confidence: number;
  forecast: ForecastPoint[];
}
```

### 5.5 Simulation Contracts

```ts
type ShockType =
  | 'inflationWave'
  | 'fuelShock'
  | 'railStrike'
  | 'drought'
  | 'heatwave'
  | 'recession'
  | 'airportClosure'
  | 'healthcareOverload';

interface SimulationShock {
  id: string;
  type: ShockType;
  startDate: string;
  durationDays: number;
  severity: number;
  targetScope: 'continent' | 'region' | 'cluster' | 'city';
  targetIds: string[];
}

interface SimulationResult {
  cityId: CityId;
  resilienceDelta: number;
  affordabilityDelta: number;
  accessibilityDelta: number;
  survivabilityScore: number;
  recoveryDays: number;
}
```

### 5.6 Explainability and Narrative Contracts

```ts
interface StrategicPositioning {
  cityId: CityId;
  strengths: string[];
  tradeoffs: string[];
  bestFor: string[];
  lessIdealFor: string[];
}

interface NarrativeInput {
  positioning: StrategicPositioning;
  verification: VerificationRecord[];
  forecast: IndicatorTimeline[];
  simulation?: SimulationResult[];
}

interface NarrativeOutput {
  cityId: CityId;
  summary: string;
  confidence: number;
  citationMap: Array<{ claimId: string; sourceRefs: string[] }>;
}
```

## 6. Existing Module-to-Package Refactor Map

### 6.1 Immediate Re-homing (No Behavior Change)

- `src/data/mobility/schema.js` -> `src/platform/graph/contracts.js`
- `src/components/cityMapPageUtils.js` -> `src/platform/maps/transportHeuristics.js`
- `src/context/MobilityContext.jsx` -> `src/application/atlas/mobilityState.jsx`
- `src/context/DashboardContext.jsx` -> `src/application/compare/dashboardState.jsx`
- `src/utils/simulationModifiers.js` -> `src/platform/simulation/budgetShockAdapters.js`
- `src/app/exportActions.js` -> `src/platform/exports/exportActions.js`
- `src/relocationData.js` split:
  - data assembly -> `src/platform/domain/catalogAssembler.js`
  - ranking/scoring -> `src/platform/scoring/rankingEngine.js`
  - verification row shaping -> `src/platform/verification/verificationViews.js`

### 6.2 Application Shell Recomposition

- `src/App.jsx` becomes route shell and mode switch only.
- Move mode-specific orchestration from `src/app/useDashboardOrchestration.js` into:
  - `src/application/atlas/useAtlasController.js`
  - `src/application/compare/useCompareController.js`
  - `src/application/outlook/useOutlookController.js`
  - `src/application/family-fit/useFamilyFitController.js`

### 6.3 Presentation Isolation

- `src/components/CityMapPage.jsx` split into:
  - presentational map view component,
  - view-model hook using `platform/maps` outputs.
- `src/components/familyComparisonTables.jsx` and related compare panels consume only application controllers, never raw data modules.

## 7. Phased Refactor Plan (Concrete)

## Phase 0 (1-2 weeks): Boundary Freeze and Safety Harness

Deliverables:

- Create `src/platform`, `src/application`, `src/presentation` directories.
- Add contract typedefs for all interfaces above.
- Add compatibility adapters so old imports remain valid.
- Add unit tests for current orchestration behavior before moving files.

Exit criteria:

- `npm run dashboard:test` green,
- `npm run dashboard:build` green,
- zero UI behavior change.

## Phase 1 (2-4 weeks): Spatial and Mobility Foundation

Deliverables:

- Extract graph contracts and validators from existing mobility schema.
- Introduce cluster and region relationships in domain catalog.
- Replace map travel heuristics direct usage with `platform/maps` APIs.
- Add Strategic Atlas as default landing mode in shell navigation.

Exit criteria:

- atlas mode renders mobility graph overlays from package API,
- existing map page still functional through adapter layer.

## Phase 2 (3-5 weeks): Temporal Intelligence and Outlook

Deliverables:

- Introduce `forecasting` package with timeline contract.
- Add indicator timeline outputs for top 10 relocation indicators.
- Implement Future Outlook page mode with confidence ranges.

Exit criteria:

- temporal outputs available for compare and narratives,
- forecast confidence included in UI payloads.

## Phase 3 (3-5 weeks): Simulation and Resilience

Deliverables:

- Replace budget-only modifiers with event-driven simulation contract.
- Implement initial shocks: inflationWave, railStrike, heatwave.
- Produce city-level survivability and recovery metrics.

Exit criteria:

- simulation affects spatial and affordability outputs,
- every simulation output includes confidence and assumptions.

## Phase 4 (2-4 weeks): Strategic Positioning and Narratives

Deliverables:

- Replace rank-first outputs with strategic positioning output.
- Build deterministic narrative input payload.
- Add citation map and confidence-aware narrative rendering.

Exit criteria:

- each narrative sentence traceable to structured claims,
- no narrative generated without source references.

## Phase 5 (parallel track): App/Package Monorepo Extraction

Deliverables:

- Move web app into `/apps/web` once platform APIs stabilize.
- Introduce `/apps/admin` for analyst confidence and event overrides.
- Introduce `/apps/worker` for ingestion and enrichment jobs.

Exit criteria:

- package APIs consumed by web and admin without deep relative imports,
- CI builds all apps from shared package graph.

## 8. Contract Enforcement and Governance

### 8.1 Dependency Rule Matrix

- `presentation` may depend on `application` and `ui` only.
- `application` may depend on `platform/*` and contexts.
- `platform/narratives` may depend on deterministic packages only.
- No package may import from `src/components`.

### 8.2 CI Gate Additions

Add checks:

- import boundary lint for forbidden cross-layer imports,
- contract schema tests for graph, forecast, verification, simulation payloads,
- snapshot tests for explainability output shape.

### 8.3 Definition of Done for Each Migration PR

- old imports deprecated but still adapter-compatible,
- tests added for package public API,
- no uncontrolled changes in score outputs unless flagged in PR notes,
- confidence and source references preserved.

## 9. Minimal First PR Sequence

PR-1: Create structural folders and move mobility schema/contracts.

PR-2: Split `relocationData.js` into domain assembly and scoring engine wrappers.

PR-3: Move map heuristics to `platform/maps` and adapt `CityMapPage` to consume package API.

PR-4: Introduce forecast contracts and seed timelines for top indicators.

PR-5: Introduce strategic positioning output and narrative input envelope.

## 10. Migration Risk Controls

- Keep existing export payload contract stable until Phase 4.
- Maintain route hash compatibility while mode controllers are split.
- Preserve verification window semantics from `dashboardConfig` during all phases.
- Avoid framework migration during domain extraction; defer Next.js migration until package APIs stabilize.

## 11. Success Criteria

Technical success:

- deterministic intelligence packages are testable without React rendering,
- new modes consume package APIs with no direct raw dataset coupling,
- confidence and evidence contracts are enforced in code and UI.

Product success:

- map-first exploration is primary entry,
- strategic positioning replaces rank-first interpretation,
- temporal and resilience views become first-class decision surfaces.
