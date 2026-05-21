-- European Strategic Mobility Intelligence Platform
-- Domain schema v1 (PostgreSQL + PostGIS)

create extension if not exists postgis;

create type governance_profile as enum ('stable', 'transitional', 'stressed');
create type corridor_type as enum ('rail_spine', 'multimodal', 'maritime', 'alpine', 'metro_network');
create type node_type as enum ('city', 'airport_hub', 'rail_hub', 'healthcare_hub', 'logistics_hub');
create type node_tier as enum ('local', 'regional', 'national', 'continental');
create type mobility_mode as enum ('rail', 'road', 'ferry', 'air');
create type subject_type as enum ('city', 'region', 'corridor', 'cluster');
create type evidence_class as enum ('source_backed', 'composite', 'inferential');
create type confidence_band as enum ('high', 'medium', 'inferential');
create type horizon_type as enum ('h5', 'h10', 'long');
create type confidence_trend as enum ('improving', 'stable', 'deteriorating');
create type scenario_type as enum (
  'inflation',
  'rail_disruption',
  'fuel_crisis',
  'healthcare_overload',
  'heatwave',
  'housing_acceleration',
  'airport_disruption',
  'recession'
);
create type run_status as enum ('queued', 'running', 'completed', 'failed');
create type source_type as enum (
  'official',
  'statistical',
  'transport_operator',
  'public_health',
  'environmental_agency',
  'inferred_model'
);
create type source_reliability_tier as enum ('tier1', 'tier2', 'tier3');

create table regions (
  region_id uuid primary key,
  slug text unique not null,
  name text not null,
  country_codes text[] not null default '{}',
  geometry geometry(MultiPolygon, 4326) not null,
  centroid geometry(Point, 4326) generated always as (st_centroid(geometry)) stored,
  population bigint,
  governance_profile governance_profile not null,
  climate_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table corridors (
  corridor_id uuid primary key,
  slug text unique not null,
  name text not null,
  corridor_type corridor_type not null,
  geometry geometry(MultiLineString, 4326) not null,
  strategic_tags text[] not null default '{}',
  redundancy_index numeric(5, 2) not null default 0,
  disruption_sensitivity numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cities (
  city_id uuid primary key,
  slug text unique not null,
  name text not null,
  region_id uuid not null references regions(region_id) on delete cascade,
  population bigint,
  metro_population bigint,
  density numeric(10, 2),
  geometry geometry(MultiPolygon, 4326),
  baseline_profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clusters (
  cluster_id uuid primary key,
  region_id uuid not null references regions(region_id) on delete cascade,
  name text not null,
  accessibility_signature jsonb not null default '{}',
  family_resilience_signature jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (region_id, name)
);

create table cluster_nodes (
  cluster_id uuid not null references clusters(cluster_id) on delete cascade,
  city_id uuid not null references cities(city_id) on delete cascade,
  primary key (cluster_id, city_id)
);

create table corridor_nodes (
  corridor_id uuid not null references corridors(corridor_id) on delete cascade,
  city_id uuid not null references cities(city_id) on delete cascade,
  sequence_no integer not null,
  primary key (corridor_id, city_id),
  unique (corridor_id, sequence_no)
);

create table nodes (
  node_id uuid primary key,
  node_type node_type not null,
  city_id uuid references cities(city_id),
  name text not null,
  country_code text,
  location geometry(Point, 4326) not null,
  tier node_tier not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mobility_edges (
  edge_id uuid primary key,
  from_node_id uuid not null references nodes(node_id) on delete cascade,
  to_node_id uuid not null references nodes(node_id) on delete cascade,
  mode mobility_mode not null,
  travel_time_min_p50 integer not null,
  travel_time_min_p90 integer not null,
  reliability_score numeric(5, 2) not null,
  capacity_index numeric(5, 2) not null,
  cross_border_friction numeric(5, 2) not null default 0,
  active boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_node_id <> to_node_id)
);

create table strategic_metrics (
  metric_id uuid primary key,
  metric_key text unique not null,
  domain text not null,
  unit text not null,
  directionality text not null,
  aggregation_rule text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table metric_observations (
  observation_id uuid primary key,
  subject_type subject_type not null,
  subject_id uuid not null,
  metric_id uuid not null references strategic_metrics(metric_id) on delete cascade,
  observed_at date not null,
  value numeric(14, 4) not null,
  source_class evidence_class not null,
  confidence_score numeric(5, 4) not null,
  confidence_band confidence_band not null,
  freshness_days integer not null,
  source_diversity_score numeric(5, 4) not null,
  evidence_depth_score numeric(5, 4) not null,
  assumptions jsonb not null default '{}',
  lineage_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table forecast_series (
  forecast_id uuid primary key,
  subject_type subject_type not null,
  subject_id uuid not null,
  metric_id uuid not null references strategic_metrics(metric_id) on delete cascade,
  horizon horizon_type not null,
  model_version text not null,
  generated_at timestamptz not null,
  points jsonb not null,
  volatility_index numeric(5, 4) not null,
  confidence_trend confidence_trend not null,
  scenario_baseline boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_type, subject_id, metric_id, horizon, model_version, generated_at)
);

create table life_rhythm_profiles (
  rhythm_id uuid primary key,
  subject_type subject_type not null,
  subject_id uuid not null,
  calmness_index numeric(4, 2) not null,
  sensory_load_index numeric(4, 2) not null,
  bureaucracy_friction_index numeric(4, 2) not null,
  child_autonomy_index numeric(4, 2) not null,
  green_recovery_access_index numeric(4, 2) not null,
  social_tempo text not null,
  overstimulation_risk numeric(4, 2) not null,
  explanation_vector jsonb not null default '{}',
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table simulation_scenarios (
  scenario_id uuid primary key,
  name text not null,
  scenario_type scenario_type not null,
  scope text not null,
  intensity numeric(5, 4) not null,
  duration_weeks integer not null,
  propagation_rules jsonb not null default '{}',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table simulation_runs (
  run_id uuid primary key,
  scenario_id uuid not null references simulation_scenarios(scenario_id) on delete cascade,
  status run_status not null,
  started_at timestamptz,
  completed_at timestamptz,
  impacted_subjects integer not null default 0,
  delta_summary jsonb not null default '{}',
  model_bundle_version text not null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_sources (
  source_id uuid primary key,
  source_type source_type not null,
  title text not null,
  publisher text,
  url text not null,
  published_at date,
  retrieved_at timestamptz not null,
  reliability_tier source_reliability_tier not null,
  license text,
  checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_links (
  evidence_link_id uuid primary key,
  observation_id uuid not null references metric_observations(observation_id) on delete cascade,
  source_id uuid not null references evidence_sources(source_id) on delete cascade,
  extraction_method text not null,
  snippet text,
  trace_pointer text,
  weight numeric(5, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (observation_id, source_id)
);

create table candidate_sets (
  candidate_set_id uuid primary key,
  owner_user_id uuid not null,
  title text not null,
  subjects jsonb not null default '[]',
  annotations jsonb not null default '[]',
  scenario_snapshots jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_regions_geom on regions using gist (geometry);
create index idx_corridors_geom on corridors using gist (geometry);
create index idx_cities_geom on cities using gist (geometry);
create index idx_nodes_location on nodes using gist (location);

create index idx_metric_observations_subject_metric_date
  on metric_observations (subject_type, subject_id, metric_id, observed_at desc);

create index idx_forecast_series_subject_metric_horizon
  on forecast_series (subject_type, subject_id, metric_id, horizon, generated_at desc);

create index idx_mobility_edges_from on mobility_edges (from_node_id, mode, active);
create index idx_mobility_edges_to on mobility_edges (to_node_id, mode, active);
create index idx_evidence_links_observation on evidence_links (observation_id);
create index idx_evidence_sources_published_at on evidence_sources (published_at desc);

create index idx_candidate_sets_owner_updated_at
  on candidate_sets (owner_user_id, updated_at desc);
