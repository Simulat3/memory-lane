import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch (e) {
      return NextResponse.json({ error: "Supabase not configured", details: String(e) }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profile fetch failed", details: profileError.message }, { status: 500 });
    }

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Submissions fetch failed", details: error.message }, { status: 500 });
    }

    // Fetch user info separately
    const userIds = [...new Set(submissions.map((s: { user_id: string }) => s.user_id))];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const userMap = new Map((users || []).map((u: { id: string; display_name: string; email: string }) => [u.id, u]));
      const enriched = submissions.map((s: { user_id: string }) => ({
        ...s,
        users: userMap.get(s.user_id) || null,
      }));
      return NextResponse.json(enriched);
    }

    return NextResponse.json(submissions);
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error", details: String(e) }, { status: 500 });
  }
}
