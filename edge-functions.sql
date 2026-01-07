sync-avatar:

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, avatarUrl } = await req.json()

    if (!userId || !avatarUrl) {
      throw new Error('Missing userId or avatarUrl')
    }

    console.log(`Syncing avatar for user ${userId} from ${avatarUrl}`)

    // Créer le client Supabase avec service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Télécharger l'image depuis Google/Pinterest
    console.log('Downloading avatar from external source...')
    const imageResponse = await fetch(avatarUrl, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download avatar: ${imageResponse.status}`)
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()

    console.log(`Downloaded ${imageBuffer.byteLength} bytes, type: ${contentType}`)

    // 2. Déterminer l'extension du fichier
    let extension = 'jpg'
    if (contentType.includes('png')) extension = 'png'
    else if (contentType.includes('webp')) extension = 'webp'
    else if (contentType.includes('gif')) extension = 'gif'

    const fileName = `${userId}/avatar.${extension}`

    // 3. Uploader dans Supabase Storage (nouveau bucket public)
    console.log(`Uploading to storage: ${fileName}`)
    const { error: uploadError } = await supabase.storage
      .from('unblank-avatars')
      .upload(fileName, imageBuffer, {
        contentType,
        cacheControl: '3600', // Cache CDN 1h
        upsert: true, // Remplace si existe déjà
      })

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`)
    }

    console.log(`Avatar uploaded successfully to unblank-avatars bucket`)

    // 4. Mettre à jour public.users avec le path relatif
    // On stocke juste le path, les URLs publiques seront générées côté client
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: fileName, // On stocke le path, pas l'URL complète
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update user avatar_url:', updateError)
      // On ne throw pas, l'upload a réussi
    }

    return new Response(
      JSON.stringify({
        success: true,
        avatarPath: fileName // Le path stocké dans public.users
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error syncing avatar:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
