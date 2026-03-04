"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CULTURAL_MOMENTS } from "../data/cultural-moments";
import AuthButton from "../components/AuthButton";
import SubmitEventModal from "../components/SubmitEventModal";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase/client";
import type { Category, Memory, Submission } from "../lib/types";

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
  const { isAdmin } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2000);
  const [communityMemories, setCommunityMemories] = useState<Memory[]>([]);
  const [viewModal, setViewModal] = useState<{ month: number; day: number; memories: Memory[] } | null>(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitDate, setSubmitDate] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerYear, setPickerYear] = useState(2000);
  const [editingMemoryId, setEditingMemoryId] = useState<string | number | null>(null);
  const [editFields, setEditFields] = useState<{ title: string; description: string; date: string; category: Category; url: string; image_url: string }>({ title: "", description: "", date: "", category: "memory", url: "", image_url: "" });

  const [infoModal, setInfoModal] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    if (showStartup) {
      const timer = setTimeout(() => setBootReady(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [showStartup]);

  const fetchApprovedSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data: Submission[] = await res.json();
        const mapped: Memory[] = data.map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          date: sub.date,
          image: sub.image_url || "",
          url: sub.url,
          category: sub.category,
          communitySubmission: true,
          submittedBy: sub.users?.display_name || sub.users?.email || undefined,
        }));
        setCommunityMemories(mapped);
      }
    } catch {
      // Supabase not configured yet — silently ignore
    }
  }, []);

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

  const allMemories: Memory[] = [...CULTURAL_MOMENTS, ...communityMemories];

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

  function openSubmitWithDate(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSubmitDate(dateStr);
    setSubmitModal(true);
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
          <div className="xp-boot-progress" />
        </div>
        {bootReady && <div className="xp-boot-click">Click anywhere to start</div>}
      </div>
    );
  }

  return (
    <div className="xp-desktop">
      <div className="container">
        <header>
          <Image src="/logo.png" alt="Y2K Logo" width={40} height={40} />
          <div className="header-text">
            <h1>Nostalgia Calendar</h1>
            <p>Nostalgia Fuels the Future</p>
          </div>
          <AuthButton />
          <button className="auth-btn" onClick={() => setInfoModal(true)}>Info</button>
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
                    onClick={() => hasMemory ? setViewModal({ month: currentMonth, day: d, memories: dayMemories }) : openSubmitWithDate(currentYear, currentMonth, d)}
                  >
                    <div className="day-number">{d}</div>
                    {hasMemory && (
                      <>
                        <div className="memory-dot" style={{ backgroundColor: CATEGORIES.find(c => c.value === dayMemories[0].category)?.color || "#5cb85c" }} />
                        <div className="memory-preview">{dayMemories[0].title}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="action-buttons">
            <button className="add-btn submit-btn" onClick={() => { setSubmitDate(undefined); setSubmitModal(true); }}>Submit a Memory</button>
          </div>
        </div>

        <footer><span>Created by @JSimulat3</span><span>Revive Culture</span></footer>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal">
            <h3>{MONTH_NAMES[viewModal.month]} {viewModal.day} <button className="modal-close-x" onClick={() => setViewModal(null)}>&#10005;</button></h3>
            {viewModal.memories.map((mem) => (
              <div key={mem.id} className="memory-entry">
                <span className="category-badge" style={{ backgroundColor: CATEGORIES.find(c => c.value === mem.category)?.color || "#0054e3" }}>
                  {CATEGORIES.find(c => c.value === mem.category)?.label || "Memory"}
                </span>
                {mem.communitySubmission && mem.submittedBy && (
                  <span className="submitted-by">Submitted by {mem.submittedBy}</span>
                )}
                {editingMemoryId === mem.id ? (
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
                    <label>URL</label>
                    <input value={editFields.url} onChange={(e) => setEditFields({ ...editFields, url: e.target.value })} />
                    <label>Image URL</label>
                    <input value={editFields.image_url} onChange={(e) => setEditFields({ ...editFields, image_url: e.target.value })} />
                    <div className="admin-edit-actions">
                      <button className="admin-save-btn" onClick={() => handleAdminSave(mem.id)}>Save</button>
                      <button className="admin-cancel-btn" onClick={() => setEditingMemoryId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4>{mem.title}</h4>
                    <div className="memory-year">Date: {mem.date}</div>
                    {mem.description && <p>{mem.description}</p>}
                    {mem.image && <img src={mem.image} alt={mem.title} />}
                    {mem.url && <a href={mem.url} target="_blank" rel="noopener noreferrer" className="memory-link">View more info</a>}
                    {isAdmin && mem.communitySubmission && (
                      <div className="admin-actions">
                        <button className="admin-edit-btn" onClick={() => {
                          setEditingMemoryId(mem.id);
                          setEditFields({
                            title: mem.title,
                            description: mem.description || "",
                            date: mem.date,
                            category: mem.category,
                            url: mem.url || "",
                            image_url: mem.image || "",
                          });
                        }}>Edit</button>
                        <button className="admin-delete-btn" onClick={() => handleAdminDelete(mem.id)}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
}
