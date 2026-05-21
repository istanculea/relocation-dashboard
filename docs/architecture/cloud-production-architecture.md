# Cloud Production Architecture

## Objective
Deploy a production-grade European Strategic Mobility Intelligence Platform with high availability, confidence-aware data flows, and deterministic analytics.

## Platform Topology

1. Edge Layer
- Global DNS latency routing across two EU regions.
- CDN for static assets, map style bundles, and exports.
- WAF and rate limiting before API gateway.

2. Application Layer
- Web app: Next.js App Router service.
- API gateway: request shaping, authn/authz, route-level throttling.
- Domain services:
  - ingestion-service
  - spatial-intelligence-service
  - forecast-service
  - simulation-service
  - narrative-service
  - export-service
  - candidate-set-service

3. Data Layer
- PostgreSQL with PostGIS as the system of record.
- Redis cluster for low-latency cache, session state, and query signatures.
- Object storage for source snapshots, model artifacts, and generated exports.
- Analytical compute runners using DuckDB for mart builds and feature snapshots.

4. Event and Worker Layer
- Queue-based orchestration for ETL, forecast refresh, simulation runs, export generation.
- Priority classes:
  - interactive-high
  - scheduled-medium
  - batch-low

5. Observability and Governance Layer
- Distributed tracing across all service boundaries.
- Metrics for latency, error rates, cache hit ratio, simulation queue depth, confidence drift.
- Structured logs with request_id and lineage_id propagation.
- Audit stream for data overrides and narrative overrides.

## High-Level Request Flow

1. User request enters via CDN and API gateway.
2. Gateway resolves subject signatures and cache keys.
3. If cache miss:
- spatial-intelligence-service computes corridor and reachability metrics
- forecast-service loads or computes horizon trajectories
- narrative-service builds deterministic context envelope
4. Response assembled with confidence surfaces and evidence pointers.
5. Response cached with signature and TTL policy.

## Regional Strategy

1. Region A (primary)
- Full read/write service stack.
- Primary Postgres + PostGIS.

2. Region B (hot standby + read)
- Read replicas and warm service pool.
- Asynchronous replication for object and queue metadata.

3. Disaster Recovery Targets
- RPO: <= 5 minutes
- RTO: <= 60 minutes

## Scaling Targets

## User and Traffic Envelope
- Daily active users: 25,000
- Peak concurrent users: 3,500
- API peak: 1,200 QPS
- Atlas map/layer edge requests: 6,000 RPS

## Service SLO Targets
- Atlas layer query P95: <= 350 ms
- Subject snapshot P95: <= 250 ms
- Compare (up to 8 subjects) P95: <= 700 ms
- Forecast query (up to 20 series) P95: <= 900 ms

## Autoscaling Baselines
- Web app: min 6, max 60 pods
- API gateway: min 8, max 80 pods
- Spatial service: min 4, max 40 pods
- Forecast service: min 3, max 30 pods
- Narrative service: min 3, max 20 pods
- Simulation workers: min 2, burst to 100 workers

## Data Throughput Baselines
- PostgreSQL storage: start 2 TB, autoscale enabled
- IOPS baseline: 15,000 with burst to 60,000
- Redis target cache hit: >= 85% for atlas and compare queries

## Security Model

1. Identity and Access
- Service identities with least privilege.
- Short-lived workload identity tokens.
- RBAC with policy-as-code.

2. Data Protection
- Encryption at rest and in transit.
- mTLS for east-west service traffic.
- Signed source ingestion artifacts with checksum verification.

3. Runtime Controls
- Network segmentation by service domain.
- Secret manager for all credentials and keys.
- Image signing and admission checks in CI/CD.

## CI/CD and Release Strategy

1. Branch strategy
- Trunk-based with protected main branch.

2. Pipeline gates
- Unit and integration tests
- API contract linting
- Migration safety checks
- Security scan and dependency audit
- Visual regression for web modes

3. Rollout approach
- Web and gateway: blue/green
- Compute services: canary by traffic weight
- Model bundles: staged rollout with shadow evaluation

## Operational Runbooks

1. Incident classes
- Latency regression
- Data freshness breach
- Confidence drift anomaly
- Simulation queue saturation
- Regional failover event

2. Mandatory runbooks
- Cache bypass procedure
- Read replica promotion
- Queue draining and replay
- Model rollback
- Narrative fallback template mode
