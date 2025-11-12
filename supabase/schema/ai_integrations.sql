-- AI Integrations and Usage Logs Schema
-- Run in Supabase SQL editor or via apply script

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- API Integrations table
create table public.api_integrations (
  id uuid not null default gen_random_uuid (),
  provider_name text not null,
  api_key text not null,
  base_url text null,
  status text null default 'inactive'::text,
  last_tested timestamp with time zone null,
  usage_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  model_name text null,
  temperature double precision null default 0.7,
  max_tokens integer null default 2048,
  priority integer null default 0,
  daily_limit integer null default 50,
  requests_per_minute_limit integer null default 60,
  tokens_per_minute_limit integer null default 30000,
  requests_per_day_limit integer null default 500,
  current_minute_requests integer null default 0,
  current_minute_tokens integer null default 0,
  current_day_requests integer null default 0,
  last_reset_minute timestamp with time zone null default now(),
  last_reset_day timestamp with time zone null default now(),
  constraint api_integrations_pkey primary key (id),
  constraint api_integrations_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint api_integrations_status_check check (
    (
      status = any (array['active'::text, 'inactive'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_api_integrations_status on public.api_integrations using btree (status) TABLESPACE pg_default;

create index IF not exists idx_api_integrations_priority on public.api_integrations using btree (priority) TABLESPACE pg_default;



-- API Usage Logs table
create table public.api_usage_logs (
  id uuid not null default gen_random_uuid (),
  provider_name text null,
  endpoint text null,
  status_code integer null,
  response_time double precision null,
  created_at timestamp with time zone null default now(),
  prompt text null,
  timestamp timestamp with time zone null default now(),
  response_time_ms integer null,
  answer text null,
  "Category" text null,
  "RPM" text null,
  "TPM" text null,
  "RPD" text null,
  model_name text null,
  prompt_tokens integer null,
  completion_tokens integer null,
  total_tokens integer null,
  fallback_reason text null,
  constraint api_usage_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_api_usage_logs_provider on public.api_usage_logs using btree (provider_name) TABLESPACE pg_default;


-- Model limits master table: per-provider, per-model configured limits
create table public.api_model_limits (
  id uuid not null default gen_random_uuid (),
  provider_name text not null,
  model_name text not null,
  category text null,
  rpm_limit integer null,
  tpm_limit bigint null,
  rpd_limit integer null,
  rpm_unlimited boolean not null default false,
  rpd_unlimited boolean not null default false,
  warn_threshold_percent integer not null default 80,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint api_model_limits_pkey primary key (id),
  constraint api_model_limits_unique unique (provider_name, model_name)
) TABLESPACE pg_default;

create index IF not exists idx_api_model_limits_provider on public.api_model_limits using btree (provider_name) TABLESPACE pg_default;

create index IF not exists idx_api_model_limits_model on public.api_model_limits using btree (model_name) TABLESPACE pg_default;