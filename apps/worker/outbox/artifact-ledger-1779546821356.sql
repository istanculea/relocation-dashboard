create table if not exists esmip_artifact_ledger (
  artifact_id text primary key,
  artifact_type text not null,
  reference_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
