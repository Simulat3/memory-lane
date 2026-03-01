"use client";

import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import type { Category } from "../lib/types";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "key-event", label: "Key Event", color: "#cc0000" },
  { value: "memory", label: "Memory", color: "#0054e3" },
  { value: "birthday", label: "Birthday", color: "#e6a800" },
  { value: "music", label: "Music", color: "#8b00cc" },
  { value: "movie-tv", label: "Movie / TV", color: "#00994d" },
  { value: "gaming", label: "Gaming", color: "#e65c00" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface SubmitEventModalProps {
  onClose: () => void;
  onSubmitted: () => void;
  defaultDate?: string;
}

export default function SubmitEventModal({ onClose, onSubmitted, defaultDate }: SubmitEventModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [category, setCategory] = useState<Category>("memory");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">
          <h3>Submit a Memory</h3>
          <div className="submit-auth-prompt">
            <p>Sign in to submit cultural moments for the calendar.</p>
          </div>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Please select a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("Image must be under 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("submission-images")
      .upload(fileName, file, { contentType: file.type });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("submission-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async function handleSubmit() {
    if (!title.trim() || !date) {
      alert("Please fill in at least a title and date!");
      return;
    }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    let image_url = "";
    if (imageFile) {
      try {
        image_url = await uploadImage(imageFile);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Image upload failed.");
        setSubmitting(false);
        return;
      }
    }

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), date, category, url: url.trim(), image_url }),
    });

    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
      onSubmitted();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to submit memory.");
    }
  }

  if (submitted) {
    return (
      <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">
          <h3>Submit a Memory</h3>
          <div className="submit-success">
            <p>Your memory has been submitted for review!</p>
            <p>An admin will approve it before it appears on the calendar.</p>
          </div>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>Submit a Memory</h3>
        <div className="form-group">
          <label>Category *</label>
          <div className="category-selector">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-option${category === cat.value ? " selected" : ""}`}
                style={{ borderColor: cat.color, ...(category === cat.value ? { backgroundColor: cat.color, color: "#fff" } : {}) }}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pokémon Red & Blue Released" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell the story..." />
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Image (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          {imagePreview ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 4 }} />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: "absolute", top: 4, right: 4,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", borderRadius: "50%", width: 24, height: 24,
                  cursor: "pointer", fontSize: 14, lineHeight: "24px", padding: 0,
                }}
              >
                X
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "8px 16px", border: "1px dashed #999",
                background: "transparent", borderRadius: 4, cursor: "pointer",
                color: "#666", width: "100%",
              }}
            >
              Click to select an image (max 5MB)
            </button>
          )}
        </div>
        <div className="form-group">
          <label>Link (optional)</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. https://en.wikipedia.org/wiki/..." />
        </div>
        <div className="form-actions">
          <button className="btn-save" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
