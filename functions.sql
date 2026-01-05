| schema_name | function_name                              | arguments                                                                                                                                                                             | return_type                                                                                                                                                                                                                                                                                                               | volatility | function_type | language | source_code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public      | auto_generate_folder_slug                  |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Si le slug est déjà fourni, ne rien faire
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Générer le slug de base depuis le nom
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.name),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  
  -- Enlever les tirets au début et à la fin
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  -- Vérifier les conflits et ajouter un suffixe si nécessaire
  WHILE EXISTS (
    SELECT 1 FROM folders 
    WHERE user_id = NEW.user_id 
      AND slug = final_slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public      | auto_share_folder_with_creator             |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  |
DECLARE
  parent_owner_id uuid;
BEGIN
  -- Si le dossier a un parent (groupe)
  IF NEW.parent_folder_id IS NOT NULL THEN
    -- Récupérer le propriétaire du parent
    SELECT user_id INTO parent_owner_id
    FROM folders
    WHERE id = NEW.parent_folder_id;

    -- Si le créateur du dossier n'est PAS le propriétaire du groupe parent
    -- Créer un partage 'edit' pour permettre au propriétaire du groupe de voir ce dossier
    IF parent_owner_id IS NOT NULL AND parent_owner_id != NEW.user_id THEN
      INSERT INTO shares (
        folder_id,
        shared_by,
        shared_with_email,
        share_token,
        permission,
        is_active
      )
      SELECT
        NEW.id,
        NEW.user_id,
        (SELECT email FROM auth.users WHERE id = parent_owner_id),
        gen_random_uuid()::text,
        'edit',
        true
      WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = parent_owner_id);
    END IF;
  END IF;

  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| public      | ensure_unique_folder_slug                  |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  |
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INT := 1;
  parent_id UUID;
BEGIN
  base_slug := NEW.slug;
  new_slug := base_slug;
  parent_id := COALESCE(NEW.parent_folder_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Check if slug exists in same context (user + parent)
  WHILE EXISTS (
    SELECT 1 FROM folders
    WHERE user_id = NEW.user_id
    AND COALESCE(parent_folder_id, '00000000-0000-0000-0000-000000000000'::uuid) = parent_id
    AND slug = new_slug
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | check_duplicate_url                        | p_user_id uuid, p_url text                                                                                                                                                            | TABLE(link_exists boolean, link_id uuid, folder_name text, folder_id uuid)                                                                                                                                                                                                                                                | VOLATILE   | FUNCTION      | plpgsql  | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | cleanup_orphan_tags                        | p_user_id uuid                                                                                                                                                                        | integer                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.tags
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT DISTINCT tag_id FROM public.link_tags
    );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | cleanup_orphan_tags_trigger                |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  -- Supprimer le tag s'il n'a plus de link_tags associés
  DELETE FROM public.tags
  WHERE id = OLD.tag_id
    AND NOT EXISTS (
      SELECT 1 FROM public.link_tags WHERE tag_id = OLD.tag_id
    );
  
  RETURN OLD;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public      | delete_user                                | p_user_id uuid                                                                                                                                                                        | void                                                                                                                                                                                                                                                                                                                      | VOLATILE   | FUNCTION      | plpgsql  | 
DECLARE
  v_user_id uuid;
  v_avatar_path text;
  service_role_key text;
  delete_url text;
BEGIN
  -- Si p_user_id n'est pas fourni, utiliser l'utilisateur courant
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Vérifier que l'utilisateur supprime bien son propre compte
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Récupérer le path de l'avatar depuis public.users
  SELECT avatar_url INTO v_avatar_path
  FROM public.users
  WHERE id = v_user_id;

  -- Supprimer l'avatar du storage si existe
  IF v_avatar_path IS NOT NULL AND v_avatar_path NOT LIKE 'http%' THEN
    -- Récupérer la clé service role depuis Vault
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key';

    -- Construire l'URL de suppression
    delete_url := 'https://ysjufgwnyoaidhjhnqqi.supabase.co/storage/v1/object/avatars/' || v_avatar_path;

    -- Appeler l'API Storage pour supprimer l'avatar
    PERFORM net.http_delete(
      url := delete_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key
      )
    );
  END IF;

  -- Définir une variable de session pour indiquer qu'on supprime un utilisateur
  PERFORM set_config('app.deleting_user', 'true', true);

  -- Supprimer manuellement les données dans l'ordre pour éviter les triggers
  -- 1. Supprimer les link_tags
  DELETE FROM public.link_tags
  WHERE link_id IN (SELECT id FROM public.links WHERE user_id = v_user_id);

  -- 2. Supprimer les tags
  DELETE FROM public.tags WHERE user_id = v_user_id;

  -- 3. Supprimer les liens
  DELETE FROM public.links WHERE user_id = v_user_id;

  -- 4. Supprimer les share_access
  DELETE FROM public.share_access
  WHERE share_id IN (SELECT id FROM public.shares WHERE shared_by = v_user_id);

  -- 5. Supprimer les shares
  DELETE FROM public.shares WHERE shared_by = v_user_id;

  -- 6. Supprimer tous les dossiers (y compris les dossiers système)
  DELETE FROM public.folders WHERE user_id = v_user_id;

  -- Réinitialiser la variable de session
  PERFORM set_config('app.deleting_user', NULL, true);

  -- 7. Supprimer l'utilisateur de public.users
  DELETE FROM public.users WHERE id = v_user_id;

  -- 8. Supprimer l'utilisateur de auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | generate_slug                              | name text                                                                                                                                                                             | text                                                                                                                                                                                                                                                                                                                      | VOLATILE   | FUNCTION      | plpgsql  | 
DECLARE
  slug text;
BEGIN
  -- Convertir en minuscules, enlever les accents, remplacer les espaces par des tirets
  slug := lower(
    regexp_replace(
      unaccent(name),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  
  -- Enlever les tirets au début et à la fin
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');
  
  RETURN slug;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| public      | get_folder_by_slug_with_count              | p_user_id uuid, p_slug text                                                                                                                                                           | TABLE(id uuid, name text, slug text, user_id uuid, parent_folder_id uuid, is_group boolean, is_system boolean, "position" integer, created_at timestamp with time zone, updated_at timestamp with time zone, link_count bigint)                                                                                           | VOLATILE   | FUNCTION      | sql      | 
  SELECT 
    f.id,
    f.name,
    f.slug,
    f.user_id,
    f.parent_folder_id,
    f.is_group,
    f.is_system,
    f."position",
    f.created_at,
    f.updated_at,
    COUNT(l.id) as link_count
  FROM folders f
  LEFT JOIN links l ON l.folder_id = f.id
  WHERE f.slug = p_slug
    AND (
      -- Cas 1: L'utilisateur possède le folder
      f.user_id = p_user_id
      OR
      -- Cas 2: Le folder est partagé avec l'utilisateur
      EXISTS (
        SELECT 1 FROM shares s
        WHERE s.folder_id = f.id
          AND s.is_active = true
          AND s.shared_with_email = (
            SELECT email FROM auth.users WHERE id = p_user_id
          )
          AND (s.expires_at IS NULL OR s.expires_at > now())
      )
    )
  GROUP BY f.id
  LIMIT 1;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | get_group_folders_with_counts              | p_group_id uuid                                                                                                                                                                       | TABLE(id uuid, name text, slug text, user_id uuid, parent_folder_id uuid, is_group boolean, is_system boolean, "position" integer, created_at timestamp with time zone, updated_at timestamp with time zone, link_count bigint)                                                                                           | STABLE     | FUNCTION      | sql      | 
  SELECT 
    f.id,
    f.name,
    f.slug,
    f.user_id,
    f.parent_folder_id,
    f.is_group,
    f.is_system,                         -- ✅ Ajouté
    f."position",                        -- ✅ Guillemets
    f.created_at,
    f.updated_at,
    COUNT(l.id) as link_count
  FROM folders f
  LEFT JOIN links l ON l.folder_id = f.id
  WHERE f.parent_folder_id = p_group_id
  GROUP BY f.id
  ORDER BY f."position" ASC;             -- ✅ Guillemets
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public      | get_tag_suggestions                        | p_user_id uuid, p_search_term text, p_limit integer DEFAULT 10                                                                                                                        | TABLE(id uuid, user_id uuid, name text, created_at timestamp with time zone, usage_count integer, link_count integer, last_used_at timestamp with time zone)                                                                                                                                                              | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.name,
    t.created_at,
    COUNT(lt.id)::integer as usage_count,
    COUNT(DISTINCT lt.link_id)::integer as link_count,
    MAX(lt.created_at) as last_used_at
  FROM public.tags t
  LEFT JOIN public.link_tags lt ON t.id = lt.tag_id
  WHERE (t.user_id = p_user_id
    OR EXISTS (
      -- Inclure les tags accessibles via shares
      SELECT 1
      FROM public.link_tags lt2
      JOIN public.links l ON lt2.link_id = l.id
      JOIN public.shares s ON s.folder_id = l.folder_id
      WHERE lt2.tag_id = t.id
        AND s.is_active = true
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND (s.share_token IS NOT NULL OR s.shared_with_email = (SELECT auth.jwt()->>'email'))
    ))
    AND LOWER(t.name) LIKE LOWER(p_search_term) || '%'
  GROUP BY t.id, t.user_id, t.name, t.created_at
  ORDER BY usage_count DESC, t.name ASC
  LIMIT p_limit;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | get_tag_usage_stats                        | p_user_id uuid                                                                                                                                                                        | TABLE(id uuid, user_id uuid, name text, created_at timestamp with time zone, usage_count integer, link_count integer, last_used_at timestamp with time zone)                                                                                                                                                              | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.name,
    t.created_at,
    COUNT(lt.id)::integer as usage_count,
    COUNT(DISTINCT lt.link_id)::integer as link_count,
    MAX(lt.created_at) as last_used_at
  FROM public.tags t
  LEFT JOIN public.link_tags lt ON t.id = lt.tag_id
  WHERE t.user_id = p_user_id
    OR EXISTS (
      -- Inclure les tags accessibles via shares (view ou edit)
      SELECT 1
      FROM public.link_tags lt2
      JOIN public.links l ON lt2.link_id = l.id
      JOIN public.shares s ON s.folder_id = l.folder_id
      WHERE lt2.tag_id = t.id
        AND s.is_active = true
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND (s.share_token IS NOT NULL OR s.shared_with_email = (SELECT auth.jwt()->>'email'))
    )
  GROUP BY t.id, t.user_id, t.name, t.created_at
  HAVING COUNT(lt.id) > 0 OR t.user_id = p_user_id
  ORDER BY usage_count DESC, t.name ASC;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public      | get_user_folders_with_counts               | p_user_id uuid                                                                                                                                                                        | TABLE(id uuid, name text, slug text, user_id uuid, parent_folder_id uuid, is_group boolean, is_system boolean, "position" integer, created_at timestamp with time zone, updated_at timestamp with time zone, link_count bigint)                                                                                           | STABLE     | FUNCTION      | sql      | 
  SELECT 
    f.id,
    f.name,
    f.slug,
    f.user_id,
    f.parent_folder_id,
    f.is_group,
    f.is_system,                         -- ✅ Ajouté
    f."position",                        -- ✅ Guillemets
    f.created_at,
    f.updated_at,
    COUNT(l.id) as link_count
  FROM folders f
  LEFT JOIN links l ON l.folder_id = f.id
  WHERE f.user_id = p_user_id
    AND f.is_group = false
    AND f.parent_folder_id IS NULL
  GROUP BY f.id
  ORDER BY f."position" ASC;             -- ✅ Guillemets
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public      | get_user_groups_with_counts                | p_user_id uuid                                                                                                                                                                        | TABLE(id uuid, name text, slug text, user_id uuid, parent_folder_id uuid, is_group boolean, is_system boolean, "position" integer, created_at timestamp with time zone, updated_at timestamp with time zone, link_count bigint)                                                                                           | STABLE     | FUNCTION      | sql      | 
  SELECT 
    g.id,
    g.name,
    g.slug,
    g.user_id,
    g.parent_folder_id,
    g.is_group,
    g.is_system,                         -- ✅ Ajouté
    g."position",                        -- ✅ Guillemets
    g.created_at,
    g.updated_at,
    COUNT(l.id) as link_count
  FROM folders g
  LEFT JOIN folders sub ON sub.parent_folder_id = g.id
  LEFT JOIN links l ON l.folder_id = sub.id
  WHERE g.user_id = p_user_id
    AND g.is_group = true
    AND g.parent_folder_id IS NULL
  GROUP BY g.id
  ORDER BY g."position" ASC;             -- ✅ Guillemets
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public      | handle_new_user                            |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
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

  INSERT INTO public.users (id, username, avatar_url, created_at)
  VALUES (NEW.id, v_username, v_avatar_url, now())
  RETURNING id INTO v_user_id;

  -- Créer le dossier "Récents" avec le slug correct
  INSERT INTO public.folders (user_id, name, slug, is_group, is_system, position)
  VALUES (v_user_id, 'Récents', 'recents', false, true, 0);

  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | merge_tags                                 | p_source_tag_ids uuid[], p_target_tag_id uuid                                                                                                                                         | void                                                                                                                                                                                                                                                                                                                      | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  -- Vérifier que le tag cible existe
  IF NOT EXISTS (SELECT 1 FROM public.tags WHERE id = p_target_tag_id) THEN
    RAISE EXCEPTION 'Target tag does not exist';
  END IF;

  -- Vérifier que les tags sources existent
  IF (SELECT COUNT(*) FROM public.tags WHERE id = ANY(p_source_tag_ids)) != array_length(p_source_tag_ids, 1) THEN
    RAISE EXCEPTION 'One or more source tags do not exist';
  END IF;

  -- Reassigner tous les link_tags des sources vers la cible
  -- Gérer les doublons potentiels (un link pourrait avoir plusieurs tags à fusionner)
  UPDATE public.link_tags
  SET tag_id = p_target_tag_id
  WHERE tag_id = ANY(p_source_tag_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.link_tags lt2
      WHERE lt2.link_id = link_tags.link_id
        AND lt2.tag_id = p_target_tag_id
    );

  -- Supprimer les doublons créés
  DELETE FROM public.link_tags
  WHERE tag_id = ANY(p_source_tag_ids);

  -- Supprimer les tags sources
  DELETE FROM public.tags
  WHERE id = ANY(p_source_tag_ids);
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | move_links_to_recents_before_folder_delete |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
DECLARE
  v_recents_folder_id uuid;
BEGIN
  -- NE PAS bloquer la suppression des dossiers système
  -- (nécessaire pour la suppression de compte)

  -- Si c'est le dossier "Récents" lui-même, on ne fait rien
  IF OLD.name = 'Récents' THEN
    RETURN OLD;
  END IF;

  -- Chercher le dossier "Récents"
  SELECT id INTO v_recents_folder_id
  FROM public.folders
  WHERE user_id = OLD.user_id
    AND name = 'Récents'
  LIMIT 1;

  -- Créer le dossier avec le slug explicite si non trouvé
  IF v_recents_folder_id IS NULL THEN
    INSERT INTO public.folders (user_id, name, slug, is_group, is_system, position)
    VALUES (OLD.user_id, 'Récents', 'recents', false, true, 0)
    RETURNING id INTO v_recents_folder_id;
  END IF;

  -- Déplacer tous les liens vers le dossier "Récents"
  UPDATE public.links
  SET folder_id = v_recents_folder_id
  WHERE folder_id = OLD.id;

  RETURN OLD;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | prevent_system_folder_grouping             |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | queue_avatar_sync                          |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | record_share_access                        | p_share_token text                                                                                                                                                                    | boolean                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | search_links                               | p_user_id uuid, p_query text DEFAULT NULL::text, p_tag_names text[] DEFAULT NULL::text[], p_folder_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0 | TABLE(id uuid, user_id uuid, folder_id uuid, url text, title text, description text, screenshot_url text, original_image_url text, image_format text, content_type text, is_duplicate boolean, "position" integer, created_at timestamp with time zone, updated_at timestamp with time zone, folder_name text, tags json) | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  -- If tag filtering is requested, use a subquery to filter links that have ALL required tags
  IF p_tag_names IS NOT NULL AND array_length(p_tag_names, 1) > 0 THEN
    RETURN QUERY
    SELECT
      l.id,
      l.user_id,
      l.folder_id,
      l.url,
      l.title,
      l.description,
      l.screenshot_url,
      l.original_image_url,
      l.image_format,
      l.content_type,
      l.is_duplicate,
      l."position",
      l.created_at,
      l.updated_at,
      f.name as folder_name,
      COALESCE(
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
          ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
      ) as tags
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
      AND (p_folder_id IS NULL OR l.folder_id = p_folder_id)
      -- Filter to only links that have ALL the requested tags
      AND l.id IN (
        SELECT lt2.link_id
        FROM public.link_tags lt2
        JOIN public.tags t2 ON lt2.tag_id = t2.id
        WHERE t2.name = ANY(p_tag_names)
        GROUP BY lt2.link_id
        HAVING COUNT(DISTINCT t2.name) = array_length(p_tag_names, 1)
      )
    GROUP BY l.id, f.name
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSE
    -- No tag filtering - simpler query
    RETURN QUERY
    SELECT
      l.id,
      l.user_id,
      l.folder_id,
      l.url,
      l.title,
      l.description,
      l.screenshot_url,
      l.original_image_url,
      l.image_format,
      l.content_type,
      l.is_duplicate,
      l."position",
      l.created_at,
      l.updated_at,
      f.name as folder_name,
      COALESCE(
        json_agg(
          json_build_object('id', t.id, 'name', t.name)
          ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
      ) as tags
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
      AND (p_folder_id IS NULL OR l.folder_id = p_folder_id)
    GROUP BY l.id, f.name
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
 |
| public      | update_updated_at                          |                                                                                                                                                                                       | trigger                                                                                                                                                                                                                                                                                                                   | VOLATILE   | FUNCTION      | plpgsql  | 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public      | user_has_edit_permission_on_folder         | folder_id uuid, user_email text                                                                                                                                                       | boolean                                                                                                                                                                                                                                                                                                                   | STABLE     | FUNCTION      | plpgsql  | 
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM shares
    WHERE shares.folder_id = user_has_edit_permission_on_folder.folder_id
      AND shares.is_active = true
      AND shares.permission = 'edit'
      AND (shares.expires_at IS NULL OR shares.expires_at > now())
      AND shares.shared_with_email = user_email
  );
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |