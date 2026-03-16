import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

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

  // Verify the user owns this submission and it's editable (private or pending)
  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select("user_id, is_public, status")
    .eq("id", id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (submission.is_public && submission.status === "rejected") {
    return NextResponse.json({ error: "Cannot edit rejected submissions" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, date, category, url, image_url } = body;

  const editFields: Record<string, unknown> = {};
  if (title !== undefined) editFields.title = title;
  if (description !== undefined) editFields.description = description;
  if (date !== undefined) editFields.date = date;
  if (category !== undefined) editFields.category = category;
  if (url !== undefined) editFields.url = url;
  if (image_url !== undefined) editFields.image_url = image_url;

  if (Object.keys(editFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // If the submission is approved and public, store edits as pending_edit for admin review
  if (submission.is_public && submission.status === "approved") {
    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .update({ pending_edit: editFields })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, edit_pending: true });
  }

  // Otherwise (private or pending), update directly
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .update(editFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  // Verify the user owns this submission and it's private
  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select("user_id, is_public")
    .eq("id", id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (submission.is_public) {
    return NextResponse.json({ error: "Cannot delete public submissions" }, { status: 403 });
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
