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

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("memory_id", memoryId)
    .eq("memory_type", memoryType)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user info
  const userIds = [...new Set((comments || []).map((c: { user_id: string }) => c.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, display_name, email, avatar_url").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: { id: string }) => [u.id, u]));
  const enriched = (comments || []).map((c: { user_id: string }) => ({
    ...c,
    users: userMap.get(c.user_id) || null,
  }));

  return NextResponse.json(enriched);
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
  const { memory_id, memory_type, content } = body;

  if (!memory_id || !memory_type || !content?.trim()) {
    return NextResponse.json({ error: "memory_id, memory_type, and content are required" }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: "Comment must be 500 characters or less" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      memory_id,
      memory_type,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user info
  const { data: userInfo } = await supabase
    .from("users")
    .select("id, display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ ...data, users: userInfo }, { status: 201 });
}
