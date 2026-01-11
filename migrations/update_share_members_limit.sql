-- Migration: Update share members limits
-- Remove Team plan, update Free to 15, Pro to 30

CREATE OR REPLACE FUNCTION check_share_members_limit()
RETURNS trigger AS $$
DECLARE
  user_plan text;
  max_members integer;
  current_members integer;
  folder_owner_id uuid;
BEGIN
  -- Récupérer le propriétaire du dossier
  SELECT user_id INTO folder_owner_id
  FROM public.folders
  WHERE id = NEW.folder_id;

  -- Récupérer le plan du propriétaire
  SELECT subscription_plan INTO user_plan
  FROM public.users
  WHERE id = folder_owner_id;

  -- Définir limite selon le plan (Team supprimé, nouvelles limites)
  max_members := CASE
    WHEN user_plan = 'free' THEN 15
    WHEN user_plan = 'pro' THEN 30
    ELSE 15 -- Fallback au plan free
  END;

  -- Compter membres actuels (actifs)
  SELECT COUNT(*)
  INTO current_members
  FROM public.shares
  WHERE folder_id = NEW.folder_id
    AND is_active = true;

  -- Vérifier limite
  IF current_members >= max_members THEN
    RAISE EXCEPTION 'Share members limit reached for % plan. Current: %, Max: %', user_plan, current_members, max_members;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
