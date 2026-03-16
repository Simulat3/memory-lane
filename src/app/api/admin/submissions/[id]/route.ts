import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status, approve_edit, title, description, date, category, url, image_url } = body;

  // Handle pending edit approval/rejection
  if (approve_edit !== undefined) {
    const { data: submission } = await getSupabaseAdmin()
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (!submission?.pending_edit) {
      return NextResponse.json({ error: "No pending edit to review" }, { status: 400 });
    }

    let updatePayload: Record<string, unknown>;
    let message: string;

    if (approve_edit) {
      // Apply the pending edits to main fields
      updatePayload = { ...submission.pending_edit, pending_edit: null };
      message = `Your edit to "${submission.title}" has been approved!`;
    } else {
      // Reject — just clear pending_edit
      updatePayload = { pending_edit: null };
      message = `Your edit to "${submission.title}" was not approved.`;
    }

    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await getSupabaseAdmin()
      .from("notifications")
      .insert({
        user_id: data.user_id,
        type: approve_edit ? "submission_approved" : "submission_rejected",
        submission_id: id,
        actor_id: user.id,
        message,
      });

    return NextResponse.json(data);
  }

  // Build the update payload
  const updateFields: Record<string, unknown> = {};

  // Status change (approve/reject)
  if (status !== undefined) {
    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
    }
    updateFields.status = status;
    updateFields.reviewed_at = new Date().toISOString();
    updateFields.reviewed_by = user.id;
  }

  // Field updates (admin inline edit)
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (date !== undefined) updateFields.date = date;
  if (category !== undefined) updateFields.category = category;
  if (url !== undefined) updateFields.url = url;
  if (image_url !== undefined) updateFields.image_url = image_url;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification for approval/rejection
  if (status === "approved" || status === "rejected") {
    const message = status === "approved"
      ? `Your memory "${data.title}" has been approved and is now live!`
      : `Your memory "${data.title}" was not approved.`;

    await getSupabaseAdmin()
      .from("notifications")
      .insert({
        user_id: data.user_id,
        type: `submission_${status}`,
        submission_id: id,
        actor_id: user.id,
        message,
      });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await getSupabaseAdmin()
    .from("submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
