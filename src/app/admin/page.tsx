"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase/client";
import type { Submission } from "../../lib/types";

export default function AdminPage() {
  const { user, profile, isAdmin, loading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Admin: No session found");
        setFetching(false);
        return;
      }

      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      } else {
        const err = await res.json();
        console.error("Admin fetch error:", res.status, err);
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
            <p>Review submitted events — {profile?.display_name}</p>
          </div>
        </header>

        <div className="window-body">
          <div className="admin-header">
            <h2>Pending Submissions ({submissions.length})</h2>
            <a href="/" className="admin-back-link">Back to Calendar</a>
          </div>

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
        </div>

        <footer>Revive Culture — Admin Portal</footer>
      </div>
    </div>
  );
}
