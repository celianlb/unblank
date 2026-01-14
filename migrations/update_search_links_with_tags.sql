-- Migration: Ajouter la recherche dans les tags à la fonction search_links
-- Date: 2025-01-14
-- Description: Modifie la fonction search_links pour inclure les noms des tags dans la recherche textuelle

CREATE OR REPLACE FUNCTION public.search_links(
  p_user_id uuid,
  p_query text DEFAULT NULL,
  p_tag_names text[] DEFAULT NULL,
  p_folder_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  folder_id uuid,
  url text,
  title text,
  description text,
  screenshot_url text,
  original_image_url text,
  image_format text,
  content_type text,
  is_duplicate boolean,
  "position" integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  folder_name text,
  tags json
)
LANGUAGE plpgsql
AS $$
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
        f.name ILIKE '%' || p_query || '%' OR
        -- NOUVEAU: Recherche dans les noms des tags
        EXISTS (
          SELECT 1 FROM public.link_tags lt_search
          JOIN public.tags t_search ON lt_search.tag_id = t_search.id
          WHERE lt_search.link_id = l.id
            AND t_search.name ILIKE '%' || p_query || '%'
        )
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
        f.name ILIKE '%' || p_query || '%' OR
        -- NOUVEAU: Recherche dans les noms des tags
        EXISTS (
          SELECT 1 FROM public.link_tags lt_search
          JOIN public.tags t_search ON lt_search.tag_id = t_search.id
          WHERE lt_search.link_id = l.id
            AND t_search.name ILIKE '%' || p_query || '%'
        )
      ))
      AND (p_folder_id IS NULL OR l.folder_id = p_folder_id)
    GROUP BY l.id, f.name
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$$;
