create table public.sightseeing_options (
  id uuid not null default gen_random_uuid (),
  route_id uuid not null,
  location character varying(255) not null,
  description text null,
  adult_price numeric(10, 2) not null,
  child_price numeric(10, 2) not null,
  additional_charges numeric(10, 2) null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sightseeing_options_pkey primary key (id),
  constraint sightseeing_options_route_id_fkey foreign KEY (route_id) references transport_routes (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at_sightseeing_options BEFORE
update on sightseeing_options for EACH row
execute FUNCTION set_updated_at ();