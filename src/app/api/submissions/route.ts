import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user info separately
  const userIds = [...new Set(submissions.map((s: { user_id: string }) => s.user_id))];
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, date, category, url, image_url } = body;

  if (!title || !date || !category) {
    return NextResponse.json({ error: "Title, date, and category are required" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .insert({
      user_id: user.id,
      title,
      description: description || "",
      date,
      category,
      url: url || "",
      image_url: image_url || "",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
