import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

export async function PATCH(request: NextRequest) {
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
  const { notification_ids, all } = body;

  if (all) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  } else if (notification_ids && Array.isArray(notification_ids)) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", notification_ids);
  } else {
    return NextResponse.json({ error: "Provide notification_ids or all: true" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
