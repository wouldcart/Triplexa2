-- =====================================================
-- COMPREHENSIVE PRICING CONFIGURATION SYSTEM
-- Supports: General/Slabs, Countries, Export Control, Tax, Advanced, Calculator
-- =====================================================

-- 1. Main pricing configurations table
create table public.pricing_configurations (
  id uuid not null default gen_random_uuid (),
  country_name text not null,
  currency text not null,
  currency_symbol text not null,
  tax_type text not null default 'NONE'::text,
  tax_enabled boolean not null default true,
  tds_enabled boolean not null default false,
  tds_rate numeric(5, 2) null default 0,
  tds_threshold numeric(12, 2) null default 0,
  tds_exemption_limit numeric(12, 2) null default 0,
  tds_company_registration text null,
  base_markup_percentage numeric(5, 2) not null default 10,
  slab_markup_enabled boolean not null default false,
  tier_multiplier numeric(5, 2) null default 1.0,
  seasonal_adjustment numeric(5, 2) null default 0,
  minimum_markup numeric(5, 2) null,
  maximum_markup numeric(5, 2) null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  default_markup_percentage numeric(5, 2) not null default 7.00,
  use_slab_pricing boolean not null default false,
  slab_application_mode text not null default 'per-person'::text,
  enable_country_based_pricing boolean not null default false,
  default_country text null default 'TH'::text,
  base_currency text not null default 'USD'::text,
  auto_update_rates boolean not null default false,
  update_frequency text not null default 'daily'::text,
  config_name text not null default 'Default Configuration'::text,
  show_pricing_to_agents boolean not null default true,
  show_pricing_to_staff boolean not null default true,
  allow_staff_pricing_edit boolean not null default true,
  show_cost_breakdown boolean not null default false,
  hide_markup_from_agents boolean not null default true,
  minimum_markup_amount numeric(12, 2) null default 0,
  maximum_markup_percentage numeric(5, 2) null,
  round_final_price boolean not null default true,
  rounding_method text not null default 'nearest'::text,
  rounding_increment numeric(12, 2) not null default 1.00,
  apply_tax_after_markup boolean not null default true,
  tax_inclusive_pricing boolean not null default false,
  constraint pricing_configurations_pkey primary key (id),
  constraint pricing_configurations_created_by_fkey foreign KEY (created_by) references profiles (id),
  constraint pricing_configurations_updated_by_fkey foreign KEY (updated_by) references profiles (id),
  constraint pricing_configurations_slab_mode_check check (
    (
      slab_application_mode = any (array['per-person'::text, 'total'::text])
    )
  ),
  constraint pricing_configurations_tax_type_check check (
    (
      tax_type = any (
        array[
          'GST'::text,
          'VAT'::text,
          'SALES_TAX'::text,
          'NONE'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pricing_configurations_active on public.pricing_configurations using btree (is_active) TABLESPACE pg_default;

create trigger update_pricing_configurations_updated_at BEFORE
update on pricing_configurations for EACH row
execute FUNCTION update_updated_at_column ();

-- 2. Markup Slabs (enhanced version)


create table public.markup_slabs (
  id uuid not null default gen_random_uuid (),
  config_id uuid not null,
  min_amount numeric(12, 2) not null,
  max_amount numeric(12, 2) not null,
  additional_percentage numeric(5, 2) not null,
  fixed_amount numeric(12, 2) null default 0,
  description text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  markup_type text not null default 'percentage'::text,
  slab_name text null,
  priority integer not null default 1,
  application_mode_override text null,
  constraint markup_slabs_pkey primary key (id),
  constraint markup_slabs_config_id_fkey foreign KEY (config_id) references pricing_configurations (id) on delete CASCADE,
  constraint markup_slabs_amount_check check ((max_amount > min_amount))
) TABLESPACE pg_default;

create index IF not exists idx_markup_slabs_config on public.markup_slabs using btree (config_id) TABLESPACE pg_default;

create trigger update_markup_slabs_updated_at BEFORE
update on markup_slabs for EACH row
execute FUNCTION update_updated_at_column ();

-- 3. Country Pricing Rules
create table public.country_pricing_rules (
  id uuid not null default gen_random_uuid (),
  config_id uuid not null,
  country_code text not null,
  country_name text not null,
  currency text not null,
  currency_symbol text not null,
  pricing_currency text null,
  pricing_currency_symbol text null,
  default_markup numeric(5, 2) not null default 8.00,
  markup_type text not null default 'percentage'::text,
  tier text not null default 'standard'::text,
  tier_multiplier numeric(5, 2) not null default 1.00,
  region text null,
  conversion_margin numeric(5, 2) not null default 2.00,
  seasonal_adjustment numeric(5, 2) null,
  is_active boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint country_pricing_rules_pkey primary key (id),
  constraint country_pricing_rules_config_id_country_code_key unique (config_id, country_code),
  constraint country_pricing_rules_config_id_fkey foreign KEY (config_id) references pricing_configurations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_country_pricing_rules_config on public.country_pricing_rules using btree (config_id, is_active) TABLESPACE pg_default;


-- 4. Tax Configurations
create table public.tax_configurations (
  id uuid not null default gen_random_uuid (),
  config_id uuid not null,
  country_code text not null,
  region_code text null,
  tax_type text not null,
  tax_name text not null,
  default_rate numeric(5, 2) not null default 0,
  hotel_rate numeric(5, 2) null,
  transport_rate numeric(5, 2) null,
  sightseeing_rate numeric(5, 2) null,
  restaurant_rate numeric(5, 2) null,
  activity_rate numeric(5, 2) null,
  tds_applicable boolean not null default false,
  tds_rate numeric(5, 2) null default 0,
  tds_threshold numeric(12, 2) null,
  tds_exemption_limit numeric(12, 2) null,
  is_inclusive boolean not null default false,
  compound_tax boolean not null default false,
  tax_registration_number text null,
  company_registration text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tax_configurations_pkey primary key (id),
  constraint tax_configurations_unique unique (config_id, country_code, region_code),
  constraint tax_configurations_config_id_fkey foreign KEY (config_id) references pricing_configurations (id) on delete CASCADE,
  constraint tax_configurations_tax_type_check check (
    (
      tax_type = any (
        array[
          'GST'::text,
          'VAT'::text,
          'SALES_TAX'::text,
          'SERVICE_TAX'::text,
          'NONE'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- 5. Regional Pricing Templates
create table public.regional_pricing_templates (
  id uuid not null default gen_random_uuid (),
  config_id uuid not null,
  template_name text not null,
  region text not null,
  description text null,
  default_markup numeric(5, 2) not null default 8.00,
  markup_type text not null default 'percentage'::text,
  countries jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint regional_pricing_templates_pkey primary key (id),
  constraint regional_pricing_templates_config_id_fkey foreign KEY (config_id) references pricing_configurations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_regional_templates_config on public.regional_pricing_templates using btree (config_id, is_active) TABLESPACE pg_default;

-- 6. Pricing Permissions (Export Control)
CREATE TABLE IF NOT EXISTS public.pricing_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL,
  
  -- Role-Based Permissions
  create table public.pricing_permissions (
  id uuid not null default gen_random_uuid (),
  config_id uuid not null,
  role text not null,
  can_view_cost boolean not null default false,
  can_view_markup boolean not null default false,
  can_view_profit boolean not null default false,
  can_view_breakdown boolean not null default true,
  can_edit_pricing boolean not null default false,
  can_override_markup boolean not null default false,
  can_apply_discounts boolean not null default false,
  max_discount_percentage numeric(5, 2) null,
  can_export_pricing boolean not null default false,
  can_share_externally boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pricing_permissions_pkey primary key (id),
  constraint pricing_permissions_config_id_role_key unique (config_id, role),
  constraint pricing_permissions_config_id_fkey foreign KEY (config_id) references pricing_configurations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pricing_permissions_config on public.pricing_permissions using btree (config_id, role) TABLESPACE pg_default;