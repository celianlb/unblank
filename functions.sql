check_duplicate_url(p_user_id uuid, p_url text)
BEGIN
  RETURN QUERY
  SELECT 
    true as link_exists,
    l.id as link_id,
    f.name as folder_name,
    l.folder_id
  FROM public.links l
  LEFT JOIN public.folders f ON l.folder_id = f.id
  WHERE l.user_id = p_user_id 
    AND l.url = p_url
  LIMIT 1;
END;



delete_user(p_user_id uuid)

DECLARE
  v_user_id uuid;
BEGIN
  -- Si p_user_id n'est pas fourni, utiliser l'utilisateur courant
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Vérifier que l'utilisateur supprime bien son propre compte
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Supprimer l'utilisateur de auth.users
  -- Les CASCADE vont automatiquement tout supprimer :
  -- auth.users → public.users → folders → links → link_tags
  --                           → tags → link_tags
  --                           → shares → share_access
  DELETE FROM auth.users WHERE id = v_user_id;
END;


handle_new_user()
DECLARE
  v_username text;
  v_avatar_url text;
  v_user_id uuid;
BEGIN
  -- Extraire username
  IF NEW.raw_user_meta_data ? 'username' THEN
    v_username := NEW.raw_user_meta_data->>'username';
  ELSE
    v_username := NEW.raw_user_meta_data->>'name';
  END IF;

  IF v_username IS NULL THEN
    v_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  -- Extraire avatar_url depuis user_metadata (Google, Pinterest, etc.)
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- Créer l'utilisateur dans public.users avec l'avatar_url externe
  INSERT INTO public.users (id, username, avatar_url, created_at)
  VALUES (NEW.id, v_username, v_avatar_url, now())
  RETURNING id INTO v_user_id;

  -- Créer le dossier "Récents" directement ici
  INSERT INTO public.folders (user_id, name, is_group, is_system, position)
  VALUES (v_user_id, 'Récents', false, true, 0);

  RETURN NEW;
END;


move_links_to_recents_before_folder_delete()
DECLARE
  v_recents_folder_id uuid;
BEGIN
  -- Empêcher la suppression des dossiers système
  IF OLD.is_system = true THEN
    RAISE EXCEPTION 'Cannot delete system folder';
  END IF;
  
  -- your function body (keep public.* qualifiers)
  SELECT id INTO v_recents_folder_id
  FROM public.folders
  WHERE user_id = OLD.user_id
    AND name = 'Récents'
  LIMIT 1;
  
  IF v_recents_folder_id IS NULL THEN
    INSERT INTO public.folders (user_id, name, is_group, is_system, position)
    VALUES (OLD.user_id, 'Récents', false, true, 0)
    RETURNING id INTO v_recents_folder_id;
  END IF;
  
  UPDATE public.links
  SET folder_id = v_recents_folder_id
  WHERE folder_id = OLD.id;
  
  RETURN OLD;
END;


prevent_system_folder_grouping()
BEGIN
  -- Empêcher le groupement des dossiers système
  IF NEW.is_system = true AND NEW.parent_folder_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot move system folder to a group';
  END IF;
  
  -- Empêcher la modification de is_system sur un dossier existant
  IF OLD.is_system = true AND NEW.is_system = false THEN
    RAISE EXCEPTION 'Cannot change system folder flag';
  END IF;
  
  RETURN NEW;
END;

queue_avatar_sync()
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'avatar_url' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'avatar_url' LIKE 'http%' THEN

    function_url := 'https://ysjufgwnyoaidhjhnqqi.supabase.co/functions/v1/sync-avatar';
    
    -- Récupérer depuis Vault au lieu de hardcoder
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key';

    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'userId', NEW.id,
        'avatarUrl', NEW.raw_user_meta_data->>'avatar_url'
      ),
      timeout_milliseconds := 2000
    );

  END IF;

  RETURN NEW;
END;


record_share_access(p_share_token text)
DECLARE
  v_share_id uuid;
BEGIN
  -- Vérifier que le partage existe et est actif
  SELECT id INTO v_share_id
  FROM public.shares
  WHERE share_token = p_share_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_share_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Enregistrer l'accès
  INSERT INTO public.share_access (share_id, accessed_by)
  VALUES (v_share_id, auth.uid())
  ON CONFLICT DO NOTHING; -- Éviter les doublons si l'user accède plusieurs fois
  
  RETURN true;
END;

search_links(p_user_id uuid, p_query text, p_tag_names text[], p_folder_id uuid)
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.url,
    l.title,
    l.description,
    l.screenshot_url,
    l.original_image_url,
    l.image_format,
    l.content_type,
    f.name,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
    l.created_at
  FROM public.links l
  LEFT JOIN public.folders f ON l.folder_id = f.id
  LEFT JOIN public.link_tags lt ON l.id = lt.link_id
  LEFT JOIN public.tags t ON lt.tag_id = t.id
  WHERE l.user_id = p_user_id
    AND (p_query IS NULL OR (
      l.title ILIKE '%' || p_query || '%' OR
      l.description ILIKE '%' || p_query || '%' OR
      l.url ILIKE '%' || p_query || '%' OR
      f.name ILIKE '%' || p_query || '%'
    ))
    AND (p_tag_names IS NULL OR t.name = ANY(p_tag_names))
    AND (p_folder_id IS NULL OR l.folder_id = p_folder_id)
  GROUP BY l.id, f.name
  ORDER BY l.created_at DESC;
END;

update_updated_at()
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
