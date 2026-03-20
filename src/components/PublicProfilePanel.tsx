"use client";

import { useState, useEffect } from "react";
import type { PublicProfile } from "../lib/types";

interface PublicProfilePanelProps {
  userId: string | null;
  onClose: () => void;
}

export default function PublicProfilePanel({ userId, onClose }: PublicProfilePanelProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(false);
    fetch(`/api/users/${userId}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="profile-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-panel">
        <div className="profile-titlebar">
          <span>&#128100; User Profile</span>
          <button className="modal-close-x" onClick={onClose}>&#10005;</button>
        </div>

        {loading ? (
          <div className="profile-empty">Loading profile...</div>
        ) : error || !profile ? (
          <div className="profile-empty">Could not load profile.</div>
        ) : (
          <>
            <div className="profile-toolbar">
              <span className="profile-toolbar-path">
                C:\Users\{profile.display_name}\
              </span>
            </div>

            <div className="profile-info">
              <div className="profile-avatar-section">
                <div className="profile-avatar" style={{ cursor: "default" }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-details">
                <div className="profile-name-display">
                  <h3>{profile.display_name}</h3>
                </div>
                <div className="profile-meta">
                  <span>Member since {memberSince}</span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="public-profile-bio">
                <div className="public-profile-bio-label">About</div>
                <p>{profile.bio}</p>
              </div>
            )}

            <div className="public-profile-stats-section">
              <div className="stats-cards">
                <div className="stats-card">
                  <div className="stats-card-value">{profile.publicStats.totalApprovedSubmissions}</div>
                  <div className="stats-card-label">Memories</div>
                </div>
                <div className="stats-card">
                  <div className="stats-card-value">{profile.publicStats.totalUpvotesReceived}</div>
                  <div className="stats-card-label">Upvotes</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
