import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memoryId = searchParams.get("memory_id");
  const memoryType = searchParams.get("memory_type");

  if (!memoryId || !memoryType) {
    return NextResponse.json({ error: "memory_id and memory_type are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("memory_id", memoryId)
    .eq("memory_type", memoryType);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { memory_id, memory_type } = body;

  if (!memory_id || !memory_type) {
    return NextResponse.json({ error: "memory_id and memory_type are required" }, { status: 400 });
  }

  // Check if already reacted
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("memory_id", memory_id)
    .eq("memory_type", memory_type)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Unlike — remove reaction
    await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);

    return NextResponse.json({ action: "removed" });
  }

  // Like — add reaction
  const { data, error } = await supabase
    .from("reactions")
    .insert({
      memory_id,
      memory_type,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create upvote notification (only for submissions, not presets, and not self-upvotes)
  if (memory_type === "submission") {
    const { data: submission } = await supabase
      .from("submissions")
      .select("user_id, title")
      .eq("id", memory_id)
      .single();

    if (submission && submission.user_id !== user.id) {
      const { data: actor } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const actorName = actor?.display_name || "Someone";
      await supabase
        .from("notifications")
        .insert({
          user_id: submission.user_id,
          type: "upvote",
          submission_id: memory_id,
          actor_id: user.id,
          message: `${actorName} liked your memory "${submission.title}"`,
        });
    }
  }

  return NextResponse.json({ action: "added", reaction: data }, { status: 201 });
}
