-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_folder_id uuid,
  is_group boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug text NOT NULL,
  is_system boolean DEFAULT false,
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.link_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  is_auto_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT link_tags_pkey PRIMARY KEY (id),
  CONSTRAINT link_tags_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id),
  CONSTRAINT link_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_id uuid,
  url text NOT NULL,
  title text,
  description text,
  screenshot_url text,
  original_image_url text,
  image_format text,
  content_type text,
  is_duplicate boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT links_pkey PRIMARY KEY (id),
  CONSTRAINT links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT links_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.share_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL,
  accessed_by uuid,
  accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT share_access_pkey PRIMARY KEY (id),
  CONSTRAINT share_access_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.shares(id),
  CONSTRAINT share_access_accessed_by_fkey FOREIGN KEY (accessed_by) REFERENCES public.users(id)
);
CREATE TABLE public.shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL,
  shared_by uuid NOT NULL,
  shared_with_email text,
  share_token text UNIQUE,
  permission text NOT NULL DEFAULT 'view'::text CHECK (permission = ANY (ARRAY['view'::text, 'edit'::text])),
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id),
  CONSTRAINT shares_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id),
  CONSTRAINT shares_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  stripe_event_id text UNIQUE,
  amount integer,
  currency text DEFAULT 'eur'::text,
  status text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_events_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
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
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  trial_ends_at timestamp with time zone,
  is_beta_user boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  usage_type text CHECK (usage_type IS NULL OR usage_type = ANY (ARRAY['personal'::text, 'professional'::text, 'mixed'::text])),
  domain text[],
  discovery_source text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);