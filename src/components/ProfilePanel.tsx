"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import type { Category, Submission, Notification } from "../lib/types";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "key-event", label: "Key Event", color: "#cc0000" },
  { value: "memory", label: "Memory", color: "#0054e3" },
  { value: "birthday", label: "Birthday", color: "#e6a800" },
  { value: "music", label: "Music", color: "#8b00cc" },
  { value: "movie-tv", label: "Movie / TV", color: "#00994d" },
  { value: "gaming", label: "Gaming", color: "#e65c00" },
];

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  onMemoriesChanged: () => void;
  notifications?: Notification[];
  onNotificationsRead?: () => void;
}

export default function ProfilePanel({ open, onClose, onMemoriesChanged, notifications = [], onNotificationsRead }: ProfilePanelProps) {
  const { user, profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"public" | "private" | "rejected" | "notifications">("public");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memory editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: "", description: "", date: "", category: "memory" as Category, url: "", image_url: "" });

  const fetchUserSubmissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/submissions?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data: Submission[] = await res.json();
        // Filter to only this user's submissions
        setSubmissions(data.filter((s) => s.user_id === user.id));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchUserSubmissions();
      setNameValue(profile?.display_name || "");
    }
  }, [open, user, profile?.display_name, fetchUserSubmissions]);

  async function handleNameSave() {
    if (!nameValue.trim()) return;
    setNameSaving(true);
    await updateProfile({ display_name: nameValue.trim() });
    setNameSaving(false);
    setEditingName(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert("Upload failed: " + (data.error || "Unknown error"));
        return;
      }

      const updatedProfile = await res.json();
      // Update local profile state via context
      await updateProfile({ avatar_url: updatedProfile.avatar_url });
    } catch {
      alert("Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleEditSave(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    const endpoint = submission.is_public ? `/api/admin/submissions/${id}` : `/api/submissions/${id}`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(editFields),
    });

    if (res.ok) {
      setEditingId(null);
      await fetchUserSubmissions();
      onMemoriesChanged();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    const endpoint = submission.is_public ? `/api/admin/submissions/${id}` : `/api/submissions/${id}`;
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      await fetchUserSubmissions();
      onMemoriesChanged();
    }
  }

  const filtered = submissions.filter((s) => {
    if (activeTab === "public") return s.is_public && s.status !== "rejected";
    if (activeTab === "private") return !s.is_public;
    return s.status === "rejected";
  });

  async function handleMarkAllRead() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ all: true }),
    });
    onNotificationsRead?.();
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  if (!open || !user || !profile) return null;

  return (
    <div className={`profile-overlay${open ? " active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-panel">
        {/* Title bar */}
        <div className="profile-titlebar">
          <span>&#128187; My Profile</span>
          <button className="modal-close-x" onClick={onClose}>&#10005;</button>
        </div>

        {/* Toolbar */}
        <div className="profile-toolbar">
          <span className="profile-toolbar-path">
            C:\Users\{profile.display_name}\
          </span>
        </div>

        {/* Profile info section */}
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change picture"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-avatar-overlay">
                {avatarUploading ? "..." : "Edit"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-details">
            {editingName ? (
              <div className="profile-name-edit">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                />
                <button onClick={handleNameSave} disabled={nameSaving}>
                  {nameSaving ? "..." : "Save"}
                </button>
                <button onClick={() => { setEditingName(false); setNameValue(profile.display_name); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-name-display">
                <h3>{profile.display_name}</h3>
                <button onClick={() => { setNameValue(profile.display_name); setEditingName(true); }} title="Edit display name">
                  &#9998;
                </button>
              </div>
            )}
            <div className="profile-meta">
              <span>{profile.email}</span>
              <span>Member since {memberSince}</span>
              <span>{submissions.length} {submissions.length === 1 ? "memory" : "memories"} submitted</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab${activeTab === "public" ? " active" : ""}`}
            onClick={() => setActiveTab("public")}
          >
            &#127758; Public ({submissions.filter((s) => s.is_public).length})
          </button>
          <button
            className={`profile-tab${activeTab === "private" ? " active" : ""}`}
            onClick={() => setActiveTab("private")}
          >
            &#128274; Private ({submissions.filter((s) => !s.is_public).length})
          </button>
          {submissions.some((s) => s.status === "rejected") && (
            <button
              className={`profile-tab${activeTab === "rejected" ? " active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              &#10060; Rejected ({submissions.filter((s) => s.status === "rejected").length})
            </button>
          )}
          <button
            className={`profile-tab${activeTab === "notifications" ? " active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            &#128276; Notifications {notifications.filter((n) => !n.read).length > 0 && (
              <span className="notif-tab-badge">{notifications.filter((n) => !n.read).length}</span>
            )}
          </button>
        </div>

        {/* Memories / Notifications list */}
        <div className="profile-memories">
          {activeTab === "notifications" ? (
            notifications.length === 0 ? (
              <div className="profile-empty">No notifications yet.</div>
            ) : (
              <>
                {notifications.some((n) => !n.read) && (
                  <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all as read</button>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " notif-unread"}`}>
                    <span className="notif-icon">
                      {n.type === "submission_approved" ? "\u2705" : n.type === "submission_rejected" ? "\u274C" : "\uD83D\uDCDF"}
                    </span>
                    <div className="notif-content">
                      <p className="notif-message">{n.message}</p>
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                ))}
              </>
            )
          ) : loading ? (
            <div className="profile-empty">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="profile-empty">
              No {activeTab} memories yet.
            </div>
          ) : (
            filtered.map((sub) => (
              <div key={sub.id} className="profile-memory-item">
                {editingId === sub.id ? (
                  <div className="profile-memory-edit">
                    <div className="admin-edit-form">
                      <label>Title</label>
                      <input value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                      <label>Description</label>
                      <textarea value={editFields.description} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
                      <label>Date</label>
                      <input type="date" value={editFields.date} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} />
                      <label>Category</label>
                      <select value={editFields.category} onChange={(e) => setEditFields({ ...editFields, category: e.target.value as Category })}>
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <div className="admin-edit-actions">
                        <button className="admin-save-btn" onClick={() => handleEditSave(sub.id)}>Save</button>
                        <button className="admin-cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-memory-header">
                      <span
                        className="category-badge"
                        style={{ backgroundColor: CATEGORIES.find((c) => c.value === sub.category)?.color || "#0054e3" }}
                      >
                        {CATEGORIES.find((c) => c.value === sub.category)?.label || "Memory"}
                      </span>
                      {sub.is_public && (
                        <span className={`status-badge status-${sub.status}`}>
                          {sub.status}
                        </span>
                      )}
                    </div>
                    <div className="profile-memory-title">{sub.title}</div>
                    {sub.description && (
                      <div className="profile-memory-desc">{sub.description}</div>
                    )}
                    <div className="profile-memory-footer">
                      <span className="profile-memory-date">{sub.date}</span>
                      <div className="profile-memory-actions">
                        <button onClick={() => {
                          setEditingId(sub.id);
                          setEditFields({
                            title: sub.title,
                            description: sub.description || "",
                            date: sub.date,
                            category: sub.category,
                            url: sub.url || "",
                            image_url: sub.image_url || "",
                          });
                        }}>Edit</button>
                        <button className="profile-delete-btn" onClick={() => handleDelete(sub.id)}>Delete</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
