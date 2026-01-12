-- Migration: Ajout du système de Beta Trial Pro
-- Description: Offrir 30 jours d'abonnement Pro gratuit aux nouveaux inscrits pendant la bêta
-- Date: 2025-01-12

-- 1. Ajouter les nouveaux champs à la table users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT false;

-- 2. Mettre à jour le trigger handle_new_user pour activer le trial Pro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_username text;
  v_avatar_url text;
  v_user_id uuid;
  v_base_username text;
  v_counter integer := 1;
  v_username_exists boolean;
BEGIN
  IF NEW.raw_user_meta_data ? 'username' THEN
    v_base_username := NEW.raw_user_meta_data->>'username';
  ELSE
    v_base_username := NEW.raw_user_meta_data->>'name';
  END IF;

  IF v_base_username IS NULL OR v_base_username = '' THEN
    v_base_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  v_base_username := lower(regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g'));
  v_base_username := regexp_replace(v_base_username, '_+', '_', 'g');
  v_base_username := trim(both '_' from v_base_username);

  IF v_base_username = '' THEN
    v_base_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  v_username := v_base_username;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.users WHERE username = v_username) INTO v_username_exists;

    IF NOT v_username_exists THEN
      EXIT;
    END IF;

    v_username := v_base_username || '_' || v_counter;
    v_counter := v_counter + 1;

    IF v_counter > 100 THEN
      v_username := v_base_username || '_' || substr(NEW.id::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;

  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- Créer l'utilisateur avec le trial Pro activé (30 jours)
  INSERT INTO public.users (
    id,
    username,
    avatar_url,
    created_at,
    -- Beta Trial Pro: activer le plan Pro pendant 30 jours
    subscription_plan,
    subscription_status,
    monthly_links_limit,
    trial_ends_at,
    is_beta_user
  )
  VALUES (
    NEW.id,
    v_username,
    v_avatar_url,
    now(),
    -- Beta Trial Pro settings
    'pro',           -- Plan Pro activé
    'active',        -- Statut actif
    -1,              -- Liens illimités
    now() + INTERVAL '30 days',  -- Trial de 30 jours
    true             -- Marquer comme utilisateur bêta
  )
  RETURNING id INTO v_user_id;

  -- Créer le dossier "Récents" avec le slug correct
  INSERT INTO public.folders (user_id, name, slug, is_group, is_system, position)
  VALUES (v_user_id, 'Récents', 'recents', false, true, 0);

  RETURN NEW;
END;
$$;

-- 3. Créer la fonction pour expirer les beta trials
CREATE OR REPLACE FUNCTION public.expire_beta_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  -- Trouver et mettre à jour les utilisateurs dont le trial a expiré
  -- Conditions:
  -- - is_beta_user = true (c'est un utilisateur de la bêta)
  -- - trial_ends_at < now() (le trial a expiré)
  -- - subscription_plan = 'pro' (toujours en Pro, pas encore expiré)
  -- - stripe_subscription_id IS NULL (pas d'abonnement Stripe actif = n'a pas upgradé)

  UPDATE public.users
  SET
    subscription_plan = 'free',
    subscription_status = 'inactive',
    monthly_links_limit = 50
  WHERE
    is_beta_user = true
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < now()
    AND subscription_plan = 'pro'
    AND stripe_subscription_id IS NULL;  -- Important: ne pas toucher aux abonnements payants

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Logger le nombre d'expirations (visible dans les logs Supabase)
  IF v_expired_count > 0 THEN
    RAISE NOTICE '[Beta Trial] Expired % trial(s)', v_expired_count;
  END IF;

  RETURN v_expired_count;
END;
$$;

-- 4. Créer un index pour optimiser la requête d'expiration
CREATE INDEX IF NOT EXISTS idx_users_beta_trial_expiration
ON public.users (trial_ends_at)
WHERE is_beta_user = true AND subscription_plan = 'pro';

-- 5. Commentaires pour documentation
COMMENT ON COLUMN public.users.trial_ends_at IS 'Date de fin du trial Pro gratuit pour les utilisateurs bêta';
COMMENT ON COLUMN public.users.is_beta_user IS 'Indique si l''utilisateur s''est inscrit pendant la période de bêta';
COMMENT ON FUNCTION public.expire_beta_trials IS 'Fonction à exécuter quotidiennement via cron pour expirer les trials Pro des utilisateurs bêta';

-- NOTE: Pour configurer le cron job dans Supabase, aller dans:
-- Dashboard > Database > Extensions > Activer pg_cron
-- Puis exécuter:
-- SELECT cron.schedule('expire-beta-trials', '0 0 * * *', 'SELECT public.expire_beta_trials()');
-- Cela exécutera la fonction chaque jour à minuit UTC
