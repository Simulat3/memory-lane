"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../lib/types";

interface XPLoginScreenProps {
  onEnter: () => void;
  onSignIn?: () => void;
  loggedInProfile?: UserProfile | null;
}

export default function XPLoginScreen({ onEnter, onSignIn, loggedInProfile }: XPLoginScreenProps) {
  const { signIn, signUp } = useAuth();
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function handleSignIn() {
    setError("");
    setSubmitting(true);
    const err = await signIn(email, password);
    if (err) setError(err);
    else { onSignIn?.(); }
    setSubmitting(false);
  }

  async function handleSignUp() {
    setError("");
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setSubmitting(true);
    const err = await signUp(email, password, displayName.trim());
    if (err) setError(err);
    else setSignUpSuccess(true);
    setSubmitting(false);
  }

  return (
    <div className="xp-login">
      <div className="xp-login-content">
        <div className="xp-login-left">
          <Image src="/logo.png" alt="Y2K Logo" width={80} height={80} style={{ filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))" }} />
          <h1>Nostalgia Rewind</h1>
        </div>

        <div className="xp-login-divider" />

        <div className="xp-login-accounts">
          {!showSignInForm ? (
            <>
              {loggedInProfile && (
                <button className="xp-account-btn" onClick={onEnter}>
                  <div className="xp-account-avatar">
                    {loggedInProfile.avatar_url ? (
                      <img src={loggedInProfile.avatar_url} alt="" width={48} height={48} style={{ borderRadius: 4, objectFit: "cover" }} />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect width="48" height="48" rx="4" fill="#3A6EA5" />
                        <circle cx="24" cy="18" r="9" fill="#fff" />
                        <ellipse cx="24" cy="40" rx="14" ry="12" fill="#fff" />
                      </svg>
                    )}
                  </div>
                  <span className="xp-account-name">{loggedInProfile.display_name}</span>
                </button>
              )}

              {!loggedInProfile && (
                <button className="xp-account-btn" onClick={() => setShowSignInForm(true)}>
                  <div className="xp-account-avatar">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect width="48" height="48" rx="4" fill="#3A6EA5" />
                      <circle cx="24" cy="18" r="9" fill="#fff" />
                      <ellipse cx="24" cy="40" rx="14" ry="12" fill="#fff" />
                    </svg>
                  </div>
                  <span className="xp-account-name">Sign In</span>
                </button>
              )}

              <button className="xp-account-btn" onClick={onEnter}>
                <div className="xp-account-avatar">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="4" fill="#808080" />
                    <circle cx="24" cy="18" r="9" fill="#ccc" />
                    <ellipse cx="24" cy="40" rx="14" ry="12" fill="#ccc" />
                  </svg>
                </div>
                <span className="xp-account-name">Guest</span>
              </button>
            </>
          ) : (
            <div className="xp-login-form">
              {signUpSuccess ? (
                <div className="xp-login-success">
                  <p>Account created! Check your email to verify, then sign in.</p>
                  <button className="xp-login-btn" onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h3>{isSignUp ? "Create Account" : "Sign In"}</h3>
                  {isSignUp && (
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="xp-login-input"
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="xp-login-input"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="xp-login-input"
                    onKeyDown={(e) => { if (e.key === "Enter") isSignUp ? handleSignUp() : handleSignIn(); }}
                  />
                  {error && <p className="xp-login-error">{error}</p>}
                  <div className="xp-login-actions">
                    <button
                      className="xp-login-btn"
                      disabled={submitting}
                      onClick={isSignUp ? handleSignUp : handleSignIn}
                    >
                      {submitting ? "..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>
                    <button className="xp-login-btn xp-login-btn-secondary" onClick={() => setShowSignInForm(false)}>
                      Back
                    </button>
                  </div>
                  <p className="xp-login-toggle">
                    {isSignUp ? (
                      <>Already have an account? <button className="xp-login-link" onClick={() => { setIsSignUp(false); setError(""); }}>Sign In</button></>
                    ) : (
                      <>No account? <button className="xp-login-link" onClick={() => { setIsSignUp(true); setError(""); }}>Create one</button></>
                    )}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="xp-login-bottom-bar">
        <div className="marquee-inner">
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
          <span className="marquee-segment">Welcome to the Renaissance - Where Nostalgia Fuels the Future&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
