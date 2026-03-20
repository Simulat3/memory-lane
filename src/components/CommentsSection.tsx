"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import type { Comment } from "../lib/types";

interface CommentsSectionProps {
  memoryId: string | number;
  memoryType: "preset" | "submission";
  onViewProfile?: (userId: string) => void;
}

export default function CommentsSection({ memoryId, memoryType, onViewProfile }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?memory_id=${memoryId}&memory_type=${memoryType}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [memoryId, memoryType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit() {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memory_id: String(memoryId),
          memory_type: memoryType,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  async function handleFlag(commentId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/comments/${commentId}/flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ reason: flagReason.trim() || "Inappropriate content" }),
    });

    if (res.ok) {
      alert("Comment flagged for review. Thank you.");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to flag comment");
    }

    setFlaggingId(null);
    setFlagReason("");
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        &#128172; Discussion ({comments.length})
      </div>

      {loading ? (
        <div className="comments-loading">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {comments.length === 0 && (
            <div className="comments-empty">No comments yet. Be the first!</div>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.users?.avatar_url ? (
                  <img src={comment.users.avatar_url} alt="" />
                ) : (
                  <span>{(comment.users?.display_name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author clickable-username" onClick={() => { if (onViewProfile) onViewProfile(comment.user_id); }}>
                    {comment.users?.display_name || "Anonymous"}
                  </span>
                  <span className="comment-time">{timeAgo(comment.created_at)}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-actions">
                  {user && user.id !== comment.user_id && (
                    <>
                      {flaggingId === comment.id ? (
                        <div className="comment-flag-form">
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={flagReason}
                            onChange={(e) => setFlagReason(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleFlag(comment.id)}
                          />
                          <button onClick={() => handleFlag(comment.id)}>Submit</button>
                          <button onClick={() => { setFlaggingId(null); setFlagReason(""); }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="comment-flag-btn"
                          onClick={() => setFlaggingId(comment.id)}
                          title="Flag as inappropriate"
                        >
                          &#9873; Flag
                        </button>
                      )}
                    </>
                  )}
                  {user && user.id === comment.user_id && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => handleDelete(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <div className="comment-input-area">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="comment-input-footer">
            <span className="comment-char-count">{newComment.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-signin-prompt">
          Sign in to join the discussion
        </div>
      )}
    </div>
  );
}
