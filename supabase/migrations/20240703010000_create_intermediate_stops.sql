create table public.intermediate_stops (
  id uuid not null default gen_random_uuid (),
  route_id uuid not null,
  stop_order integer not null,
  location_code character varying(100) not null,
  full_name character varying(255) not null,
  coordinates jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  transfer_method_notes text null,
  constraint intermediate_stops_pkey primary key (id),
  constraint intermediate_stops_route_id_fkey foreign KEY (route_id) references transport_routes (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at_intermediate_stops BEFORE
update on intermediate_stops for EACH row
execute FUNCTION set_updated_at ();