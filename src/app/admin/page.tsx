"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase/client";
import type { Submission, FlaggedComment } from "../../lib/types";

export default function AdminPage() {
  const { user, profile, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"submissions" | "pending_edits" | "approved" | "comments">("submissions");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingEdits, setPendingEdits] = useState<Submission[]>([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFetching(false);
        return;
      }

      const [subsRes, editsRes, approvedRes, commentsRes] = await Promise.all([
        fetch("/api/admin/submissions", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch("/api/admin/submissions?status=pending_edits", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch("/api/admin/submissions?status=approved", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch("/api/admin/comments", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (subsRes.ok) {
        setSubmissions(await subsRes.json());
      }
      if (editsRes.ok) {
        setPendingEdits(await editsRes.json());
      }
      if (approvedRes.ok) {
        setApprovedSubmissions(await approvedRes.json());
      }
      if (commentsRes.ok) {
        setFlaggedComments(await commentsRes.json());
      }
    } catch (e) {
      console.error("Admin fetch exception:", e);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!loading && isAdmin) fetchPending();
    else if (!loading) setFetching(false);
  }, [loading, isAdmin, fetchPending]);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setActioningId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setSubmissions(submissions.filter((s) => s.id !== id));
    }
    setActioningId(null);
  }

  async function handleEditAction(id: string, approve: boolean) {
    setActioningId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ approve_edit: approve }),
    });

    if (res.ok) {
      setPendingEdits(pendingEdits.filter((s) => s.id !== id));
    }
    setActioningId(null);
  }

  async function handleDeleteComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    setActioningId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/comments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setFlaggedComments(flaggedComments.filter((c) => c.id !== id));
    }
    setActioningId(null);
  }

  async function handleDismissFlags(id: string) {
    setActioningId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setFlaggedComments(flaggedComments.filter((c) => c.id !== id));
    }
    setActioningId(null);
  }

  if (loading || fetching) {
    return (
      <div className="xp-desktop">
        <div className="container">
          <header>
            <Image src="/logo.png" alt="Y2K Logo" width={40} height={40} />
            <div className="header-text">
              <h1>Admin Dashboard</h1>
              <p>Loading...</p>
            </div>
          </header>
          <div className="window-body">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="xp-desktop">
        <div className="container">
          <header>
            <Image src="/logo.png" alt="Y2K Logo" width={40} height={40} />
            <div className="header-text">
              <h1>Access Denied</h1>
              <p>Admin access required</p>
            </div>
          </header>
          <div className="window-body">
            <div className="admin-denied">
              <p>You do not have permission to access this page.</p>
              <a href="/" className="admin-back-link">Back to Calendar</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xp-desktop">
      <div className="container">
        <header>
          <Image src="/logo.png" alt="Y2K Logo" width={40} height={40} />
          <div className="header-text">
            <h1>Admin Dashboard</h1>
            <p>Review submissions &amp; flagged comments — {profile?.display_name}</p>
          </div>
        </header>

        <div className="window-body">
          <div className="admin-header">
            <div className="admin-tabs">
              <button
                className={`admin-tab${activeTab === "submissions" ? " active" : ""}`}
                onClick={() => setActiveTab("submissions")}
              >
                Submissions ({submissions.length})
              </button>
              <button
                className={`admin-tab${activeTab === "pending_edits" ? " active" : ""}`}
                onClick={() => setActiveTab("pending_edits")}
              >
                Pending Edits ({pendingEdits.length})
                {pendingEdits.length > 0 && <span className="admin-tab-badge">!</span>}
              </button>
              <button
                className={`admin-tab${activeTab === "approved" ? " active" : ""}`}
                onClick={() => setActiveTab("approved")}
              >
                Approved ({approvedSubmissions.length})
              </button>
              <button
                className={`admin-tab${activeTab === "comments" ? " active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                Flagged Comments ({flaggedComments.length})
                {flaggedComments.length > 0 && <span className="admin-tab-badge">!</span>}
              </button>
            </div>
            <a href="/" className="admin-back-link">Back to Calendar</a>
          </div>

          {/* Submissions Tab */}
          {activeTab === "submissions" && (
            <>
              {submissions.length === 0 ? (
                <div className="admin-empty">
                  <p>No pending submissions. All caught up!</p>
                </div>
              ) : (
                <div className="admin-list">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="admin-card">
                      <div className="admin-card-header">
                        <span className="admin-card-user">
                          {sub.users?.display_name || sub.users?.email || "unknown"}
                        </span>
                        <span className="admin-card-date">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="admin-card-body">
                        <span className="status-badge status-pending">Pending</span>
                        <h4>{sub.title}</h4>
                        <div className="admin-card-meta">
                          <span>Date: {sub.date}</span>
                          <span>Category: {sub.category}</span>
                        </div>
                        {sub.description && <p>{sub.description}</p>}
                        {sub.image_url && (
                          <div className="admin-card-image">
                            <img src={sub.image_url} alt={sub.title} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 4, marginTop: 8 }} />
                          </div>
                        )}
                        {sub.url && (
                          <a href={sub.url} target="_blank" rel="noopener noreferrer" className="memory-link">
                            {sub.url}
                          </a>
                        )}
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="btn-approve"
                          disabled={actioningId === sub.id}
                          onClick={() => handleAction(sub.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          disabled={actioningId === sub.id}
                          onClick={() => handleAction(sub.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending Edits Tab */}
          {activeTab === "pending_edits" && (
            <>
              {pendingEdits.length === 0 ? (
                <div className="admin-empty">
                  <p>No pending edits to review.</p>
                </div>
              ) : (
                <div className="admin-list">
                  {pendingEdits.map((sub) => {
                    const edit = sub.pending_edit as Record<string, string> | null;
                    if (!edit) return null;
                    return (
                      <div key={sub.id} className="admin-card">
                        <div className="admin-card-header">
                          <span className="admin-card-user">
                            {sub.users?.display_name || sub.users?.email || "unknown"}
                          </span>
                          <span className="admin-card-date">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="admin-card-body">
                          <span className="status-badge status-pending">Edit Pending</span>
                          <h4>{sub.title}</h4>
                          <div className="admin-edit-diff">
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Proposed changes:</p>
                            {edit.title && edit.title !== sub.title && (
                              <div className="edit-diff-row">
                                <span className="diff-label">Title:</span>
                                <span className="diff-old">{sub.title}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.title}</span>
                              </div>
                            )}
                            {edit.description !== undefined && edit.description !== sub.description && (
                              <div className="edit-diff-row">
                                <span className="diff-label">Description:</span>
                                <span className="diff-old">{sub.description || "(empty)"}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.description || "(empty)"}</span>
                              </div>
                            )}
                            {edit.date && edit.date !== sub.date && (
                              <div className="edit-diff-row">
                                <span className="diff-label">Date:</span>
                                <span className="diff-old">{sub.date}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.date}</span>
                              </div>
                            )}
                            {edit.category && edit.category !== sub.category && (
                              <div className="edit-diff-row">
                                <span className="diff-label">Category:</span>
                                <span className="diff-old">{sub.category}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.category}</span>
                              </div>
                            )}
                            {edit.url !== undefined && edit.url !== sub.url && (
                              <div className="edit-diff-row">
                                <span className="diff-label">URL:</span>
                                <span className="diff-old">{sub.url || "(empty)"}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.url || "(empty)"}</span>
                              </div>
                            )}
                            {edit.image_url !== undefined && edit.image_url !== sub.image_url && (
                              <div className="edit-diff-row">
                                <span className="diff-label">Image:</span>
                                <span className="diff-old">{sub.image_url || "(empty)"}</span>
                                <span className="diff-arrow">&rarr;</span>
                                <span className="diff-new">{edit.image_url || "(empty)"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="admin-card-actions">
                          <button
                            className="btn-approve"
                            disabled={actioningId === sub.id}
                            onClick={() => handleEditAction(sub.id, true)}
                          >
                            Approve Edit
                          </button>
                          <button
                            className="btn-reject"
                            disabled={actioningId === sub.id}
                            onClick={() => handleEditAction(sub.id, false)}
                          >
                            Reject Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Approved Tab */}
          {activeTab === "approved" && (
            <>
              {approvedSubmissions.length === 0 ? (
                <div className="admin-empty">
                  <p>No approved submissions yet.</p>
                </div>
              ) : (
                <div className="admin-list">
                  {approvedSubmissions.map((sub) => (
                    <div key={sub.id} className="admin-card">
                      <div className="admin-card-header">
                        <span className="admin-card-user">
                          {sub.users?.display_name || sub.users?.email || "unknown"}
                        </span>
                        <span className="admin-card-date">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="admin-card-body">
                        <span className="status-badge status-approved">Approved</span>
                        <h4>{sub.title}</h4>
                        <div className="admin-card-meta">
                          <span>Date: {sub.date}</span>
                          <span>Category: {sub.category}</span>
                        </div>
                        {sub.description && <p>{sub.description}</p>}
                        {sub.image_url && (
                          <div className="admin-card-image">
                            <img src={sub.image_url} alt={sub.title} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 4, marginTop: 8 }} />
                          </div>
                        )}
                        {sub.url && (
                          <a href={sub.url} target="_blank" rel="noopener noreferrer" className="memory-link">
                            {sub.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Flagged Comments Tab */}
          {activeTab === "comments" && (
            <>
              {flaggedComments.length === 0 ? (
                <div className="admin-empty">
                  <p>No flagged comments. Community is behaving!</p>
                </div>
              ) : (
                <div className="admin-list">
                  {flaggedComments.map((comment) => (
                    <div key={comment.id} className="admin-card admin-card-flagged">
                      <div className="admin-card-header">
                        <span className="admin-card-user">
                          {comment.users?.display_name || comment.users?.email || "unknown"}
                        </span>
                        <span className="admin-card-date">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="admin-card-body">
                        <div className="admin-comment-context">
                          <span className="admin-comment-type">
                            {comment.memory_type === "preset" ? "Preset Event" : "Community Submission"}
                          </span>
                          <span className="admin-comment-id">ID: {comment.memory_id}</span>
                        </div>
                        <div className="admin-comment-content">
                          &ldquo;{comment.content}&rdquo;
                        </div>
                        <div className="admin-flags-list">
                          <span className="admin-flags-title">
                            &#9873; {comment.flags.length} {comment.flags.length === 1 ? "flag" : "flags"}:
                          </span>
                          {comment.flags.map((flag) => (
                            <div key={flag.id} className="admin-flag-item">
                              <span className="admin-flag-user">
                                {flag.users?.display_name || flag.users?.email || "unknown"}
                              </span>
                              <span className="admin-flag-reason">{flag.reason}</span>
                              <span className="admin-flag-date">
                                {new Date(flag.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="btn-reject"
                          disabled={actioningId === comment.id}
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete Comment
                        </button>
                        <button
                          className="btn-approve"
                          disabled={actioningId === comment.id}
                          onClick={() => handleDismissFlags(comment.id)}
                        >
                          Dismiss Flags
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <footer>Revive Culture — Admin Portal</footer>
      </div>
    </div>
  );
}
