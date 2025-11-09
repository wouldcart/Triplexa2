-- Minimal core schema to satisfy early triggers and profile↔agent sync
-- Creates public.profiles and public.agents with required columns used by triggers

-- Ensure pgcrypto for gen_random_uuid() is available (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create profiles table (minimal columns used in triggers and app)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  role text DEFAULT ''::text,
  company_name text,
  phone text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Create agents table (minimal columns referenced by triggers)
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'inactive'::text,
  name text,
  email text,
  business_phone text,
  agency_name text,
  source_type text,
  source_details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Helpful indexes (optional but safe)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_agents_email ON public.agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);