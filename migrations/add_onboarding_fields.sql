-- Migration: Ajout des champs d'onboarding pour les nouveaux utilisateurs
-- Description: Permet de collecter des données lors de l'inscription (usage, domaine, source de découverte)
-- Date: 2025-01-12

-- 1. Ajouter les nouveaux champs à la table users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_type TEXT CHECK (usage_type IS NULL OR usage_type = ANY (ARRAY['personal'::text, 'professional'::text, 'mixed'::text])),
ADD COLUMN IF NOT EXISTS domain TEXT[],
ADD COLUMN IF NOT EXISTS discovery_source TEXT;

-- 2. Commentaires pour documentation
COMMENT ON COLUMN public.users.onboarding_completed IS 'Indique si l''utilisateur a complété le questionnaire d''onboarding';
COMMENT ON COLUMN public.users.usage_type IS 'Type d''utilisation: personal, professional, ou mixed';
COMMENT ON COLUMN public.users.domain IS 'Domaine(s) d''activité de l''utilisateur (graphisme, motion_design, etc.)';
COMMENT ON COLUMN public.users.discovery_source IS 'Comment l''utilisateur a découvert Unblank (twitter, instagram, google, etc.)';

-- 3. Créer un index pour les statistiques d'acquisition
CREATE INDEX IF NOT EXISTS idx_users_discovery_source
ON public.users (discovery_source)
WHERE discovery_source IS NOT NULL;

-- 4. Créer un index pour le domaine (GIN pour les arrays)
CREATE INDEX IF NOT EXISTS idx_users_domain
ON public.users USING GIN (domain)
WHERE domain IS NOT NULL;
