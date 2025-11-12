-- Reset usage_count daily for all providers
-- Schedule this with Supabase Scheduled Functions or any cron runner
-- Example: run at 00:00 UTC daily

update public.api_integrations
set usage_count = 0,
    updated_at = now()
where usage_count > 0;