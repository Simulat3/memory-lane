"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthButton() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button className="auth-btn" onClick={() => { setShowModal(true); setIsSignUp(false); setError(""); }}>
          Sign In
        </button>

        {showModal && (
          <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{isSignUp ? "Create Account" : "Sign In"}</h3>

              {signUpSuccess ? (
                <div className="submit-success">
                  <p>Account created! Check your email to confirm, then sign in.</p>
                  <button className="modal-close" onClick={() => { setShowModal(false); setSignUpSuccess(false); }}>Close</button>
                </div>
              ) : (
                <>
                  {isSignUp && (
                    <div className="form-group">
                      <label>Display Name *</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <div className="form-actions">
                    <button
                      className="btn-save"
                      disabled={submitting}
                      onClick={async () => {
                        setError("");
                        setSubmitting(true);
                        if (isSignUp) {
                          if (!displayName.trim()) { setError("Display name is required"); setSubmitting(false); return; }
                          const err = await signUp(email, password, displayName.trim());
                          if (err) setError(err);
                          else setSignUpSuccess(true);
                        } else {
                          const err = await signIn(email, password);
                          if (err) setError(err);
                          else setShowModal(false);
                        }
                        setSubmitting(false);
                      }}
                    >
                      {submitting ? "..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>
                    <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                  <div className="auth-toggle">
                    {isSignUp ? (
                      <span>Already have an account? <button className="auth-link" onClick={() => { setIsSignUp(false); setError(""); }}>Sign In</button></span>
                    ) : (
                      <span>No account? <button className="auth-link" onClick={() => { setIsSignUp(true); setError(""); }}>Create one</button></span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="auth-user">
      <span className="auth-username">{profile?.display_name || user.email}</span>
      <button className="auth-btn auth-btn-small" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}
