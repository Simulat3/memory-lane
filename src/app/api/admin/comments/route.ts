import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all flagged comment IDs
  const { data: flags, error: flagError } = await supabase
    .from("comment_flags")
    .select("comment_id")
    .order("created_at", { ascending: false });

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 500 });
  }

  const flaggedIds = [...new Set((flags || []).map((f: { comment_id: string }) => f.comment_id))];

  if (flaggedIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get the flagged comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .in("id", flaggedIds)
    .order("created_at", { ascending: false });

  if (!comments || comments.length === 0) {
    return NextResponse.json([]);
  }

  // Get user info for comment authors
  const commentUserIds = [...new Set(comments.map((c: { user_id: string }) => c.user_id))];
  const { data: commentUsers } = await supabase
    .from("users")
    .select("id, display_name, email, avatar_url")
    .in("id", commentUserIds);

  const userMap = new Map((commentUsers || []).map((u: { id: string }) => [u.id, u]));

  // Get all flags with flagger info
  const { data: allFlags } = await supabase
    .from("comment_flags")
    .select("*")
    .in("comment_id", flaggedIds)
    .order("created_at", { ascending: true });

  const flagUserIds = [...new Set((allFlags || []).map((f: { user_id: string }) => f.user_id))];
  const { data: flagUsers } = flagUserIds.length > 0
    ? await supabase.from("users").select("id, display_name, email").in("id", flagUserIds)
    : { data: [] };

  const flagUserMap = new Map((flagUsers || []).map((u: { id: string }) => [u.id, u]));

  // Build enriched response
  const enriched = comments.map((c: { id: string; user_id: string }) => ({
    ...c,
    users: userMap.get(c.user_id) || null,
    flags: (allFlags || [])
      .filter((f: { comment_id: string }) => f.comment_id === c.id)
      .map((f: { id: string; reason: string; created_at: string; user_id: string }) => ({
        id: f.id,
        reason: f.reason,
        created_at: f.created_at,
        users: flagUserMap.get(f.user_id) || null,
      })),
  }));

  return NextResponse.json(enriched);
}
