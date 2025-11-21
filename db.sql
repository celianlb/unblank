-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  language text DEFAULT 'fr'::text,
  subscription_plan text DEFAULT 'free'::text CHECK (subscription_plan = ANY (ARRAY['free'::text, 'pro'::text, 'team'::text])),
  subscription_status text DEFAULT 'inactive'::text CHECK (subscription_status = ANY (ARRAY['inactive'::text, 'active'::text, 'canceled'::text])),
  subscription_expires_at timestamp with time zone,
  monthly_links_limit integer DEFAULT 50,
  monthly_links_used integer DEFAULT 0,
  last_reset_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'affiliate'::text, 'team'::text])),
  referral_code text UNIQUE,
  referred_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);