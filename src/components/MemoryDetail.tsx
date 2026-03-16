"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import CommentsSection from "./CommentsSection";
import type { Category, Memory } from "../lib/types";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "key-event", label: "Key Event", color: "#cc0000" },
  { value: "memory", label: "Memory", color: "#0054e3" },
  { value: "birthday", label: "Birthday", color: "#e6a800" },
  { value: "music", label: "Music", color: "#8b00cc" },
  { value: "movie-tv", label: "Movie / TV", color: "#00994d" },
  { value: "gaming", label: "Gaming", color: "#e65c00" },
];

interface MemoryDetailProps {
  memory: Memory;
  onBack: () => void;
  onClose: () => void;
  onSave: (memoryId: string | number, fields: { title: string; description: string; date: string; category: Category; url: string; image_url: string }) => Promise<boolean>;
  onDelete: (mem: Memory) => void;
  canEdit: boolean;
  onMemoryChanged: () => void;
}

export default function MemoryDetail({ memory, onBack, onClose, onSave, onDelete, canEdit, onMemoryChanged }: MemoryDetailProps) {
  const { user } = useAuth();
  const [reactionCount, setReactionCount] = useState(0);
  const [userReacted, setUserReacted] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPendingMsg, setEditPendingMsg] = useState(false);
  const [editFields, setEditFields] = useState({
    title: memory.title,
    description: memory.description || "",
    date: memory.date,
    category: memory.category,
    url: memory.url || "",
    image_url: memory.image || "",
  });

  const memoryType = memory.preset ? "preset" : "submission";
  const memoryId = String(memory.id);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/reactions?memory_id=${memoryId}&memory_type=${memoryType}`);
      if (res.ok) {
        const data = await res.json();
        setReactionCount(data.length);
        if (user) {
          setUserReacted(data.some((r: { user_id: string }) => r.user_id === user.id));
        }
      }
    } catch {
      // ignore
    }
  }, [memoryId, memoryType, user]);

  useEffect(() => {
    if (!memory.isPrivate) {
      fetchReactions();
    }
  }, [fetchReactions, memory.isPrivate]);

  async function handleReaction() {
    if (!user || reacting) return;
    setReacting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memory_id: memoryId,
          memory_type: memoryType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "added") {
          setReactionCount((c) => c + 1);
          setUserReacted(true);
        } else {
          setReactionCount((c) => Math.max(0, c - 1));
          setUserReacted(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setReacting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const isPending = await onSave(memory.id, editFields);
    setSaving(false);
    setEditing(false);
    if (isPending) {
      setEditPendingMsg(true);
    }
  }

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>
          <button className="detail-back-btn" onClick={onBack} title="Back to list">&#8592;</button>
          <span className="detail-title-text">{memory.title}</span>
          <button className="modal-close-x" onClick={onClose}>&#10005;</button>
        </h3>

        <div className="memory-detail-content">
          {editing ? (
            <div className="admin-edit-form">
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={editFields.description} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} rows={3} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editFields.date} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={editFields.category} onChange={(e) => setEditFields({ ...editFields, category: e.target.value as Category })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>URL</label>
                <input type="text" value={editFields.url} onChange={(e) => setEditFields({ ...editFields, url: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" value={editFields.image_url} onChange={(e) => setEditFields({ ...editFields, image_url: e.target.value })} />
              </div>
              <div className="admin-edit-actions">
                <button className="admin-save-btn" onClick={handleSave} disabled={saving}>{saving ? "..." : "Save"}</button>
                <button className="admin-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="memory-detail-meta">
                <span
                  className="category-badge"
                  style={{ backgroundColor: CATEGORIES.find(c => c.value === memory.category)?.color || "#0054e3" }}
                >
                  {CATEGORIES.find(c => c.value === memory.category)?.label || "Memory"}
                </span>
                {memory.isPrivate && (
                  <span className="private-badge">&#128274; Private</span>
                )}
                {memory.communitySubmission && memory.submittedBy && (
                  <span className="submitted-by">Submitted by {memory.submittedBy}</span>
                )}
              </div>

              <div className="memory-detail-date">Date: {memory.date}</div>

              {memory.description && <p className="memory-detail-desc">{memory.description}</p>}

              {memory.image && (
                <img src={memory.image} alt={memory.title} className="memory-detail-img" />
              )}

              {memory.url && (
                <a href={memory.url} target="_blank" rel="noopener noreferrer" className="memory-link">
                  View more info
                </a>
              )}

              {/* Reaction */}
              {!memory.isPrivate && (
                <div className="reaction-section">
                  <span className="reaction-label">Upvote:</span>
                  <button
                    className={`reaction-btn${userReacted ? " reacted" : ""}`}
                    onClick={handleReaction}
                    disabled={!user || reacting}
                    title={user ? (userReacted ? "Remove upvote" : "Upvote") : "Sign in to upvote"}
                  >
                    <span className="reaction-emoji">&#128223;</span>
                  </button>
                  <span className="reaction-count">{reactionCount}</span>
                </div>
              )}

              {/* Edit pending message */}
              {editPendingMsg && (
                <div className="edit-pending-notice">
                  Your edit has been submitted for review. The original will remain visible until approved.
                </div>
              )}

              {/* Edit/Delete */}
              {canEdit && !editPendingMsg && (
                <div className="admin-actions">
                  <button className="admin-edit-btn" onClick={() => setEditing(true)}>Edit</button>
                  <button className="admin-delete-btn" onClick={() => onDelete(memory)}>Delete</button>
                </div>
              )}

              {/* Comments */}
              {!memory.isPrivate && (
                <CommentsSection
                  memoryId={memoryId}
                  memoryType={memoryType}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
