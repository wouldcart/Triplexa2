-- Add pricing currency fields to sightseeing table
-- This migration adds support for storing pricing currency information
-- that is automatically loaded based on the selected country

-- Add pricing_currency field to store the currency code (e.g., USD, EUR)
alter table public.sightseeing add column if not exists pricing_currency text;

-- Add pricing_currency_symbol field to store the currency symbol (e.g., $, €)
alter table public.sightseeing add column if not exists pricing_currency_symbol text;

-- Add comment to document the purpose of these fields
comment on column public.sightseeing.pricing_currency is 'Currency code for pricing (e.g., USD, EUR) - automatically loaded from countries table';
comment on column public.sightseeing.pricing_currency_symbol is 'Currency symbol for pricing (e.g., $, €) - automatically loaded from countries table';

-- Create index for pricing_currency for better query performance
create index if not exists idx_sightseeing_pricing_currency on public.sightseeing using btree (pricing_currency);