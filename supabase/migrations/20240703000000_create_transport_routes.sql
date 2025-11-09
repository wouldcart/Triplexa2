create table public.transport_routes (
  id uuid not null default gen_random_uuid (),
  route_code character varying(100) not null,
  route_name character varying(255) not null,
  country text null,
  transfer_type character varying(50) not null,
  start_location character varying(100) not null,
  start_location_full_name character varying(255) null,
  start_coordinates jsonb null,
  end_location character varying(100) not null,
  end_location_full_name character varying(255) null,
  end_coordinates jsonb null,
  distance integer null,
  duration character varying(100) null,
  notes text null,
  status character varying(20) not null default 'active'::character varying,
  enable_sightseeing boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null default ''::text,
  vehicle_types json null,
  constraint transport_routes_pkey primary key (id),
  constraint transport_routes_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'inactive'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint transport_routes_transfer_type_check check (
    (
      (transfer_type)::text = any (
        (
          array[
            'One-Way'::character varying,
            'Round-Trip'::character varying,
            'Multi-Stop'::character varying,
            'en route'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create trigger set_updated_at_transport_routes BEFORE
update on transport_routes for EACH row
execute FUNCTION set_updated_at ();