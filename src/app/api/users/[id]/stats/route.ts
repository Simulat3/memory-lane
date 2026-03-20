import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";
import type { Category, UserStats } from "../../../../../lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run queries in parallel
    const [submissionsRes, upvotesGivenRes, commentsMadeRes] = await Promise.all([
      supabase
        .from("submissions")
        .select("id, title, date, category, is_public, status")
        .eq("user_id", userId),
      supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const submissions = submissionsRes.data || [];
    const submissionIds = submissions.map((s) => s.id);

    // Get reactions on user's submissions
    let upvotesReceived = 0;
    let reactionsBySubmission: Record<string, number> = {};

    if (submissionIds.length > 0) {
      const { data: reactions } = await supabase
        .from("reactions")
        .select("memory_id")
        .eq("memory_type", "submission")
        .in("memory_id", submissionIds);

      if (reactions) {
        upvotesReceived = reactions.length;
        for (const r of reactions) {
          reactionsBySubmission[r.memory_id] = (reactionsBySubmission[r.memory_id] || 0) + 1;
        }
      }
    }

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    let approved = 0, rejected = 0, pending = 0, publicCount = 0, privateCount = 0;

    for (const s of submissions) {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      if (s.status === "approved") approved++;
      else if (s.status === "rejected") rejected++;
      else if (s.status === "pending") pending++;
      if (s.is_public) publicCount++;
      else privateCount++;
    }

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category: category as Category, count }))
      .sort((a, b) => b.count - a.count);

    // Top memory
    let topMemory: UserStats["topMemory"] = null;
    if (Object.keys(reactionsBySubmission).length > 0) {
      const topId = Object.entries(reactionsBySubmission).sort((a, b) => b[1] - a[1])[0];
      const topSub = submissions.find((s) => s.id === topId[0]);
      if (topSub) {
        topMemory = {
          id: topSub.id,
          title: topSub.title,
          date: topSub.date,
          category: topSub.category as Category,
          upvoteCount: topId[1],
        };
      }
    }

    const stats: UserStats = {
      totalSubmissions: submissions.length,
      totalUpvotesReceived: upvotesReceived,
      totalUpvotesGiven: upvotesGivenRes.count || 0,
      totalCommentsMade: commentsMadeRes.count || 0,
      categoryBreakdown,
      topMemory,
      approvalRate: { approved, rejected, pending, total: publicCount },
      publicPrivateRatio: { publicCount, privateCount },
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
