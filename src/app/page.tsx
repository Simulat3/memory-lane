"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CULTURAL_MOMENTS } from "../data/cultural-moments";
import { BONUS_MEMORIES } from "../data/bonus-memories";
import AuthButton from "../components/AuthButton";
import SubmitEventModal from "../components/SubmitEventModal";
import ProfilePanel from "../components/ProfilePanel";
import MemoryDetail from "../components/MemoryDetail";
import XPLoginScreen from "../components/XPLoginScreen";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import type { Category, Memory, Submission, Notification } from "../lib/types";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "key-event", label: "Key Event", color: "#cc0000" },
  { value: "memory", label: "Memory", color: "#0054e3" },
  { value: "birthday", label: "Birthday", color: "#e6a800" },
  { value: "music", label: "Music", color: "#8b00cc" },
  { value: "movie-tv", label: "Movie / TV", color: "#00994d" },
  { value: "gaming", label: "Gaming", color: "#e65c00" },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Home() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2000);
  const [communityMemories, setCommunityMemories] = useState<Memory[]>([]);
  const [viewModal, setViewModal] = useState<{ month: number; day: number; memories: Memory[] } | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitDate, setSubmitDate] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerYear, setPickerYear] = useState(2000);
  const [editingMemoryId, setEditingMemoryId] = useState<string | number | null>(null);
  const [editFields, setEditFields] = useState<{ title: string; description: string; date: string; category: Category; url: string; image_url: string }>({ title: "", description: "", date: "", category: "memory", url: "", image_url: "" });

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFutureError, setShowFutureError] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [bootReady, setBootReady] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("nr-booted")) {
      setShowStartup(false);
      setShowLogin(false);
    }
  }, []);

  const [signedInThisSession, setSignedInThisSession] = useState(false);

  useEffect(() => {
    if (signedInThisSession && user && showLogin && !showStartup) {
      sessionStorage.setItem("nr-booted", "1");
      setShowLogin(false);
      setSignedInThisSession(false);
    }
  }, [user, signedInThisSession, showLogin, showStartup]);

  useEffect(() => {
    if (showStartup) {
      const timer = setTimeout(() => setBootReady(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [showStartup]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      setShowVerifiedBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);


  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data: Notification[] = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const fetchApprovedSubmissions = useCallback(async () => {
    try {
      const url = user ? `/api/submissions?user_id=${user.id}` : "/api/submissions";
      const headers: HeadersInit = {};
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data: Submission[] = await res.json();
        const mapped: Memory[] = data.filter((sub) => sub.status === "approved").map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          date: sub.date,
          image: sub.image_url || "",
          url: sub.url,
          category: sub.category,
          communitySubmission: true,
          submittedBy: sub.users?.display_name || sub.users?.email || undefined,
          isPrivate: sub.is_public === false,
          userId: sub.user_id,
        }));
        setCommunityMemories(mapped);
      }
    } catch {
      // Supabase not configured yet — silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchApprovedSubmissions();
  }, [fetchApprovedSubmissions]);

  function playStartupSound() {
    const audio = new Audio("/xp-startup.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  function playClickSound() {
    const audio = new Audio("/xp-ding.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  async function handleAdminSave(memoryId: string | number) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/admin/submissions/${memoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title: editFields.title,
        description: editFields.description,
        date: editFields.date,
        category: editFields.category,
        url: editFields.url,
        image_url: editFields.image_url,
      }),
    });
    if (res.ok) {
      setEditingMemoryId(null);
      await fetchApprovedSubmissions();
      setViewModal(null);
    }
  }

  async function handleAdminDelete(memoryId: string | number) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/admin/submissions/${memoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      await fetchApprovedSubmissions();
      setViewModal(null);
    }
  }

  async function handleUserSave(memoryId: string | number) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/submissions/${memoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title: editFields.title,
        description: editFields.description,
        date: editFields.date,
        category: editFields.category,
        url: editFields.url,
        image_url: editFields.image_url,
      }),
    });
    if (res.ok) {
      setEditingMemoryId(null);
      await fetchApprovedSubmissions();
      setViewModal(null);
    }
  }

  async function handleUserDelete(memoryId: string | number) {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/submissions/${memoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      await fetchApprovedSubmissions();
      setViewModal(null);
    }
  }

  const allMemories: Memory[] = [...CULTURAL_MOMENTS, ...BONUS_MEMORIES, ...communityMemories];

  function getMemoriesForDate(year: number, month: number, day: number): Memory[] {
    const y = String(year);
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return allMemories.filter((mem) => {
      const [yy, mm, dd] = mem.date.split("-");
      return yy === y && mm === m && dd === d;
    });
  }

  function changeMonth(dir: number) {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    else if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  }

  async function fetchReactionCounts(memories: Memory[]) {
    const counts: Record<string, number> = {};
    try {
      await Promise.all(
        memories.filter((m) => !m.isPrivate).map(async (mem) => {
          const key = `${mem.id}`;
          const type = mem.preset ? "preset" : "submission";
          const res = await fetch(`/api/reactions?memory_id=${key}&memory_type=${type}`);
          if (res.ok) {
            const data = await res.json();
            counts[key] = data.length;
          }
        })
      );
    } catch {
      // ignore
    }
    setReactionCounts(counts);
  }

  async function openDateView(month: number, day: number, memories: Memory[]) {
    setViewModal({ month, day, memories });
    if (memories.length === 1) {
      setSelectedMemory(memories[0]);
    }
    await fetchReactionCounts(memories);
  }

  function openSubmitWithDate(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSubmitDate(dateStr);
    setSubmitModal(true);
  }

  function goToPast() {
    setCurrentMonth(0);
    setCurrentYear(2000);
  }

  function goToPresent() {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  }

  function goToFuture() {
    const now = new Date();
    const futureMemory = allMemories
      .filter(m => new Date(m.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    if (futureMemory) {
      const d = new Date(futureMemory.date);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    } else {
      setShowFutureError(true);
    }
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  if (showStartup) {
    return (
      <div className="xp-boot" onClick={() => {
        if (!bootReady) return;
        playStartupSound();
        setShowStartup(false);
      }}>
        <div className="xp-boot-logo">
          <Image src="/logo.png" alt="Y2K Logo" width={150} height={150} />
        </div>
        <div className="xp-boot-bar">
          <div className="xp-boot-progress">
            <span /><span /><span />
          </div>
        </div>
        {bootReady && <div className="xp-boot-click">Click anywhere to start</div>}
      </div>
    );
  }

  if (showLogin) {
    return <XPLoginScreen onEnter={() => { sessionStorage.setItem("nr-booted", "1"); setShowLogin(false); }} onSignIn={() => setSignedInThisSession(true)} loggedInProfile={profile} />;
  }

  return (
    <div className="xp-desktop">
      {showVerifiedBanner && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowVerifiedBanner(false); }}>
          <div className="xp-error-dialog">
            <div className="xp-error-titlebar">
              <span>C:\Verification Complete</span>
              <button className="xp-error-close" onClick={() => setShowVerifiedBanner(false)}>&#10005;</button>
            </div>
            <div className="xp-error-body">
              <div className="xp-error-icon">&#127760;</div>
              <div className="xp-error-text">
                <p><strong>Email verified successfully.</strong></p>
                <p className="xp-error-subtext">Welcome to the Renaissance — click OK to rewind.</p>
              </div>
            </div>
            <div className="xp-error-actions">
              <button className="xp-error-btn" onClick={() => setShowVerifiedBanner(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
      <div className="container">
        <header>
          <Image src="/logo.png" alt="Y2K Logo" width={40} height={40} />
          <div className="header-text">
            <h1>Nostalgia Calendar</h1>
            <p>Nostalgia Fuels the Future</p>
          </div>
          {user && profile && (
            <div className="header-user" onClick={() => setProfileOpen(true)}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="auth-avatar" width={24} height={24} />
              ) : (
                <div className="header-avatar-placeholder">{profile.display_name.charAt(0).toUpperCase()}</div>
              )}
              <span className="auth-username">
                {profile.display_name}
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </span>
            </div>
          )}
        </header>

        <div className="window-body">
          <div className="calendar-nav">
            <button onClick={() => { playClickSound(); changeMonth(-1); }}>&#8592; Prev</button>
            <div className="date-picker-wrapper">
              <h2 onClick={() => { setPickerMonth(currentMonth); setPickerYear(currentYear); setShowDatePicker(!showDatePicker); }} className="date-picker-toggle">
                {MONTH_NAMES[currentMonth]} {currentYear} &#9662;
              </h2>
              {showDatePicker && (
                <div className="date-picker-dropdown">
                  <div className="date-picker-section">
                    <label>Month</label>
                    <select value={pickerMonth} onChange={(e) => setPickerMonth(Number(e.target.value))}>
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="date-picker-section">
                    <label>Year</label>
                    <input
                      type="number"
                      value={pickerYear}
                      onChange={(e) => setPickerYear(Number(e.target.value))}
                      min={1900}
                      max={2100}
                    />
                  </div>
                  <button className="date-picker-go" onClick={() => { playClickSound(); setCurrentMonth(pickerMonth); setCurrentYear(pickerYear); setShowDatePicker(false); }}>Go</button>
                </div>
              )}
            </div>
            <button onClick={() => { playClickSound(); changeMonth(1); }}>Next &#8594;</button>
          </div>

          <div className="calendar-grid">
            <div className="weekdays">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
              <div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="days">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="day empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
                const dayMemories = getMemoriesForDate(currentYear, currentMonth, d);
                const hasMemory = dayMemories.length > 0;

                return (
                  <div
                    key={d}
                    className={`day${isToday ? " today" : ""}${hasMemory ? " has-memory" : ""}`}
                    onClick={() => hasMemory ? openDateView(currentMonth, d, dayMemories) : openSubmitWithDate(currentYear, currentMonth, d)}
                  >
                    <div className="day-number">{d}</div>
                    {hasMemory && (
                      <>
                        <div className="memory-dots">
                          {[...new Set(dayMemories.map(m => m.category))].map((cat) => (
                            <div key={cat} className="memory-dot" style={{ backgroundColor: CATEGORIES.find(c => c.value === cat)?.color || "#5cb85c" }} />
                          ))}
                        </div>
                        {dayMemories.length === 1 && <div className="memory-preview">{dayMemories[0].title}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="time-nav-buttons">
            <button className="time-nav-btn" onClick={goToPast}>Past</button>
            <button className="time-nav-btn" onClick={goToPresent}>Present</button>
            <button className="time-nav-btn" onClick={goToFuture}>Future</button>
          </div>

          <div className="action-buttons">
            <button className="add-btn submit-btn" onClick={() => { setSubmitDate(undefined); setSubmitModal(true); }}>Submit a Memory</button>
          </div>
        </div>

        </div>

      {/* XP Taskbar */}
      <div className="xp-taskbar">
        <button className="xp-start-btn" onClick={() => setStartMenuOpen(!startMenuOpen)}>
          <Image src="/logo.png" alt="" width={20} height={20} />
          <span>start</span>
        </button>
        <div className="xp-taskbar-middle">
          <span className="xp-taskbar-label">Nostalgia Rewind</span>
        </div>
        <div className="xp-taskbar-clock">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <>
          <div className="xp-start-overlay" onClick={() => setStartMenuOpen(false)} />
          <div className="xp-start-menu">
            <div className="xp-start-header">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="xp-start-avatar" />
              ) : (
                <div className="xp-start-avatar-placeholder">{profile?.display_name?.charAt(0).toUpperCase() || "G"}</div>
              )}
              <span className="xp-start-username">{profile?.display_name || "Guest"}</span>
            </div>
            <div className="xp-start-items">
              <button className="xp-start-item" onClick={() => { setStartMenuOpen(false); setProfileOpen(true); }}>
                <span className="xp-start-item-icon">&#128100;</span>
                My Profile
              </button>
              <button className="xp-start-item" onClick={() => { setStartMenuOpen(false); setSubmitDate(undefined); setSubmitModal(true); }}>
                <span className="xp-start-item-icon">&#128221;</span>
                Submit a Memory
              </button>
              <button className="xp-start-item" onClick={() => { setStartMenuOpen(false); setInfoModal(true); }}>
                <span className="xp-start-item-icon">&#8505;</span>
                Info
              </button>
              {isAdmin && (
                <a href="/admin" className="xp-start-item" onClick={() => setStartMenuOpen(false)}>
                  <span className="xp-start-item-icon">&#128736;</span>
                  Admin Portal
                </a>
              )}
            </div>
            <div className="xp-start-footer">
              <button className="xp-start-power" onClick={() => { setStartMenuOpen(false); signOut(); sessionStorage.removeItem("nr-booted"); setShowLogin(true); }}>
                <span className="xp-start-power-icon">&#9211;</span>
                Log Off
              </button>
              <button className="xp-start-power xp-start-shutdown" onClick={() => { setStartMenuOpen(false); window.close(); }}>
                <span className="xp-start-power-icon">&#9724;</span>
                Turn Off Computer
              </button>
            </div>
          </div>
        </>
      )}

      {/* XP Error Dialog — Future */}
      {showFutureError && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowFutureError(false); }}>
          <div className="xp-error-dialog">
            <div className="xp-error-titlebar">
              <span>C:\Restricted</span>
              <button className="xp-error-close" onClick={() => setShowFutureError(false)}>&#10005;</button>
            </div>
            <div className="xp-error-body">
              <div className="xp-error-icon">&#9888;</div>
              <div className="xp-error-text">
                <p><strong>C:\Restricted</strong> is not accessible.</p>
                <p className="xp-error-subtext">The future is unwritten — submit the first entry.</p>
              </div>
            </div>
            <div className="xp-error-actions">
              <button className="xp-error-btn" onClick={() => setShowFutureError(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal — List View */}
      {viewModal && !selectedMemory && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal">
            <h3>{MONTH_NAMES[viewModal.month]} {viewModal.day} <button className="modal-close-x" onClick={() => setViewModal(null)}>&#10005;</button></h3>
            {[...viewModal.memories].sort((a, b) => (reactionCounts[String(b.id)] || 0) - (reactionCounts[String(a.id)] || 0)).map((mem) => (
              <div key={mem.id} className="memory-list-item" onClick={() => setSelectedMemory(mem)}>
                <span className="category-badge" style={{ backgroundColor: CATEGORIES.find(c => c.value === mem.category)?.color || "#0054e3" }}>
                  {CATEGORIES.find(c => c.value === mem.category)?.label || "Memory"}
                </span>
                <div className="memory-list-info">
                  <span className="memory-list-title">{mem.title}</span>
                  {mem.communitySubmission && mem.submittedBy && (
                    <span className="memory-list-author">by {mem.submittedBy}</span>
                  )}
                </div>
                {!mem.isPrivate && (
                  <span className="memory-list-reactions">
                    <span>&#128223;</span> {reactionCounts[String(mem.id)] || 0}
                  </span>
                )}
                {mem.isPrivate && (
                  <span className="private-badge">&#128274;</span>
                )}
                <span className="memory-list-arrow">&#8250;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Detail View */}
      {selectedMemory && (
        <MemoryDetail
          memory={selectedMemory}
          onBack={() => { setSelectedMemory(null); if (viewModal) fetchReactionCounts(viewModal.memories); }}
          onClose={() => { setSelectedMemory(null); setViewModal(null); }}
          onEdit={(mem) => {
            setEditingMemoryId(mem.id);
            setEditFields({
              title: mem.title,
              description: mem.description || "",
              date: mem.date,
              category: mem.category,
              url: mem.url || "",
              image_url: mem.image || "",
            });
          }}
          onDelete={(mem) => {
            if (mem.isPrivate && user?.id === mem.userId) {
              handleUserDelete(mem.id);
            } else {
              handleAdminDelete(mem.id);
            }
            setSelectedMemory(null);
          }}
          canEdit={
            (isAdmin && !!selectedMemory.communitySubmission) ||
            (!isAdmin && !!selectedMemory.isPrivate && user?.id === selectedMemory.userId)
          }
          onMemoryChanged={fetchApprovedSubmissions}
        />
      )}

      {/* Info Modal */}
      {infoModal && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setInfoModal(false); }}>
          <div className="modal">
            <h3>Info <button className="modal-close-x" onClick={() => setInfoModal(false)}>&#10005;</button></h3>
            <p>The nostalgia calendar is an ever-growing repository of the past, present, and future. A living archive of the things that shaped us.</p>
            <p>It&apos;s an interactive space for memories: shared, discovered, and kept alive by a community of revivalists.</p>
            <p>Click any date to explore its memories, or submit your own. Community submissions are reviewed before appearing on the calendar.</p>
            <p>You can currently submit in the following categories:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {CATEGORIES.map((c) => (
                <span key={c.value} className="category-badge" style={{ backgroundColor: c.color, textAlign: "center" }}>{c.label}</span>
              ))}
            </div>
            <p>To submit, create an account.</p>
            <p>Nostalgia fuels the future.</p>
          </div>
        </div>
      )}

      {/* Submit Memory Modal */}
      {submitModal && (
        <SubmitEventModal
          onClose={() => { setSubmitModal(false); setSubmitDate(undefined); }}
          onSubmitted={fetchApprovedSubmissions}
          defaultDate={submitDate}
        />
      )}

      {/* Profile Panel */}
      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onMemoriesChanged={fetchApprovedSubmissions}
        notifications={notifications}
        onNotificationsRead={fetchNotifications}
      />
    </div>
  );
}
