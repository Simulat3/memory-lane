import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  // Fetch public approved submissions
  const { data: publicSubmissions, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", "approved")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let allSubmissions = publicSubmissions || [];

  // If user_id provided, also fetch all of their own submissions (any status)
  if (userId) {
    const { data: userSubmissions } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (userSubmissions) {
      // Merge without duplicates (public approved ones may already be in the list)
      const existingIds = new Set(allSubmissions.map((s: { id: string }) => s.id));
      const newOnes = userSubmissions.filter((s: { id: string }) => !existingIds.has(s.id));
      allSubmissions = [...allSubmissions, ...newOnes];
    }
  }

  // Fetch user info separately
  const userIds = [...new Set(allSubmissions.map((s: { user_id: string }) => s.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, display_name, email, avatar_url").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: { id: string; display_name: string; email: string; avatar_url: string }) => [u.id, u]));
  const enriched = allSubmissions.map((s: { user_id: string }) => ({
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
  const { title, description, date, category, url, image_url, is_public } = body;
  const isPublic = is_public !== false;

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
      is_public: isPublic,
      status: isPublic ? "pending" : "approved",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
