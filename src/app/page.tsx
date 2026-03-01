"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CULTURAL_MOMENTS } from "../data/cultural-moments";
import AuthButton from "../components/AuthButton";
import SubmitEventModal from "../components/SubmitEventModal";
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
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2000);
  const [communityMemories, setCommunityMemories] = useState<Memory[]>([]);
  const [viewModal, setViewModal] = useState<{ month: number; day: number; memories: Memory[] } | null>(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitDate, setSubmitDate] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerYear, setPickerYear] = useState(2000);

  const [showStartup, setShowStartup] = useState(true);

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
          image: "",
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
        playStartupSound();
        setShowStartup(false);
      }}>
        <div className="xp-boot-logo">
          <Image src="/logo.png" alt="Y2K Logo" width={150} height={150} />
        </div>
        <div className="xp-boot-bar">
          <div className="xp-boot-progress" />
        </div>
        <div className="xp-boot-click">Click anywhere to start</div>
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

        <footer>Revive Culture</footer>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setViewModal(null); }}>
          <div className="modal">
            <h3>{MONTH_NAMES[viewModal.month]} {viewModal.day}</h3>
            {viewModal.memories.map((mem) => (
              <div key={mem.id} className="memory-entry">
                <span className="category-badge" style={{ backgroundColor: CATEGORIES.find(c => c.value === mem.category)?.color || "#0054e3" }}>
                  {CATEGORIES.find(c => c.value === mem.category)?.label || "Memory"}
                </span>
                {mem.communitySubmission && mem.submittedBy && (
                  <span className="submitted-by">Submitted by {mem.submittedBy}</span>
                )}
                <h4>{mem.title}</h4>
                <div className="memory-year">Date: {mem.date}</div>
                {mem.description && <p>{mem.description}</p>}
                {mem.image && <img src={mem.image} alt={mem.title} />}
                {mem.url && <a href={mem.url} target="_blank" rel="noopener noreferrer" className="memory-link">View more info</a>}
              </div>
            ))}
            <button className="modal-close" onClick={() => setViewModal(null)}>Close</button>
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
