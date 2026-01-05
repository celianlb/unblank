import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ShareFactory from "@/lib/shares/shareFactory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    // Get the access token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const shareService = ShareFactory.createShareService(supabase);

    const validation = await shareService.validateShareToken(token);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          isValid: false,
          reason: validation.reason
        },
        { status: 404 }
      );
    }

    // Return share info without sensitive data
    return NextResponse.json({
      isValid: true,
      share: {
        id: validation.share!.id,
        folder_id: validation.share!.folder_id,
        permission: validation.share!.permission,
        shared_with_email: validation.share!.shared_with_email,
        expires_at: validation.share!.expires_at,
      },
    });
  } catch (error) {
    console.error("Error validating share token:", error);
    return NextResponse.json(
      { error: "Failed to validate share token" },
      { status: 500 }
    );
  }
}
