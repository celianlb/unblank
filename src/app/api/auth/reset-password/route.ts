import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This is a secret key, never expose to client
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Check if we have the service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[API Reset Password] SUPABASE_SERVICE_ROLE_KEY not configured');
      // Fallback: just send the reset email without checking OAuth
      const { supabase } = await import('@/infra/db/supabase');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (resetError) {
        console.error('[API Reset Password] Error sending reset email:', resetError);
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi de l\'email' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Un email de réinitialisation a été envoyé si un compte existe avec cet email.' },
        { status: 200 }
      );
    }

    // Check if user exists and how they signed up
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('[API Reset Password] Error listing users:', listError);
      // Ne pas révéler si l'utilisateur existe ou non pour des raisons de sécurité
      return NextResponse.json(
        { success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' },
        { status: 200 }
      );
    }

    // Find the user by email
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Ne pas révéler que l'utilisateur n'existe pas (sécurité)
      return NextResponse.json(
        { success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' },
        { status: 200 }
      );
    }

    console.log('[API Reset Password] User found:', {
      email: user.email,
      identities: user.identities,
      app_metadata: user.app_metadata,
    });

    // Check if user signed up with OAuth (Google, Pinterest, etc.)
    // Supabase stores OAuth providers in app_metadata.providers
    const providers = (user.app_metadata?.providers as string[]) || [];
    const oauthProviders = providers.filter(p => p !== 'email');

    console.log('[API Reset Password] OAuth check:', {
      allProviders: providers,
      oauthProviders: oauthProviders,
    });

    if (oauthProviders.length > 0) {
      console.log('[API Reset Password] Blocking OAuth user, providers:', oauthProviders);
      
      // Ne pas envoyer d'email et retourner le même message générique pour la sécurité
      return NextResponse.json(
        { success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' },
        { status: 200 }
      );
    }

    // User exists and uses email/password, send reset email
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (resetError) {
      console.error('[API Reset Password] Error sending reset email:', resetError);
      // Message générique même en cas d'erreur pour ne pas révéler d'infos
      return NextResponse.json(
        { success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[API Reset Password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    );
  }
}

