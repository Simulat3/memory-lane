import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";
import type { PublicProfile } from "../../../../../lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", userId)
    .single();

  if (userError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get approved public submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .eq("is_public", true);

  const approvedIds = (submissions || []).map((s) => s.id);
  let totalUpvotesReceived = 0;

  if (approvedIds.length > 0) {
    const { count } = await supabase
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("memory_type", "submission")
      .in("memory_id", approvedIds);

    totalUpvotesReceived = count || 0;
  }

  const profile: PublicProfile = {
    id: userRow.id,
    display_name: userRow.display_name,
    avatar_url: userRow.avatar_url || "",
    bio: userRow.bio || "",
    created_at: userRow.created_at,
    publicStats: {
      totalApprovedSubmissions: approvedIds.length,
      totalUpvotesReceived,
    },
  };

  return NextResponse.json(profile);
}
