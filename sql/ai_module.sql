

Existing tables on supabase below.
 

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
  constraint api_integrations_pkey primary key (id),
  constraint api_integrations_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint api_integrations_status_check check (
    (
      status = any (array['active'::text, 'inactive'::text])
    )
  )
) TABLESPACE pg_default;


--api_usage_logs


create table public.api_usage_logs (
  id uuid not null default gen_random_uuid (),
  provider_name text null,
  endpoint text null,
  status_code integer null,
  response_time double precision null,
  created_at timestamp with time zone null default now(),
  constraint api_usage_logs_pkey primary key (id)
) TABLESPACE pg_default;    



🧩 STEP 6: Test Connection Function

async function testConnection(api) {
  const start = performance.now();
  try {
    const res = await fetch(`${api.base_url}/models`, {
      headers: { Authorization: `Bearer ${api.api_key}` },
    });

    const responseTime = performance.now() - start;
    const success = res.ok;

    await supabase.from("api_integrations").update({
      last_tested: new Date().toISOString()
    }).eq("id", api.id);

    await supabase.from("api_usage_logs").insert({
      provider_name: api.provider_name,
      endpoint: "test-connection",
      status_code: res.status,
      response_time: responseTime
    });

    toast({
      title: success ? "✅ Connection Successful" : "❌ Connection Failed",
      description: `Response Time: ${responseTime.toFixed(1)} ms`
    });
  } catch (err) {
    toast({ title: "Error", description: err.message });
  }
}
