import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
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
  const updates: Record<string, string> = {};

  if (body.display_name !== undefined) {
    if (!body.display_name.trim()) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }
    updates.display_name = body.display_name.trim();
  }

  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
