import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // Check comment exists
  const { data: comment } = await supabase
    .from("comments")
    .select("id")
    .eq("id", id)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check if user already flagged this comment
  const { data: existing } = await supabase
    .from("comment_flags")
    .select("id")
    .eq("comment_id", id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You have already flagged this comment" }, { status: 409 });
  }

  const body = await request.json();
  const reason = body.reason?.trim() || "Inappropriate content";

  const { data, error } = await supabase
    .from("comment_flags")
    .insert({
      comment_id: id,
      user_id: user.id,
      reason,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
