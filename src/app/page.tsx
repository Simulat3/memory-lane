"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CULTURAL_MOMENTS } from "../data/cultural-moments";

type Category = "key-event" | "memory" | "birthday" | "music" | "movie-tv" | "gaming";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "key-event", label: "Key Event", color: "#cc0000" },
  { value: "memory", label: "Memory", color: "#0054e3" },
  { value: "birthday", label: "Birthday", color: "#e6a800" },
  { value: "music", label: "Music", color: "#8b00cc" },
  { value: "movie-tv", label: "Movie / TV", color: "#00994d" },
  { value: "gaming", label: "Gaming", color: "#e65c00" },
];

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  image: string;
  url: string;
  category: Category;
  preset?: boolean;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getSampleMemories(): Memory[] {
  return [
    { id: 1, title: "First day of school", description: "Nervous but excited — a brand new backpack and everything.", date: "1999-09-05", image: "", url: "", category: "memory" },
    { id: 2, title: "Summer road trip", description: "Windows down, favourite songs on repeat.", date: "2004-07-14", image: "", url: "", category: "memory" },
  ];
}

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2000);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [viewModal, setViewModal] = useState<{ month: number; day: number; memories: Memory[] } | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("memory");
  const [pendingImage, setPendingImage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerYear, setPickerYear] = useState(2000);

  const [showStartup, setShowStartup] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nostalgiaMemories");
    setMemories(saved ? JSON.parse(saved) : getSampleMemories());
  }, []);

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

  useEffect(() => {
    if (memories.length > 0) {
      localStorage.setItem("nostalgiaMemories", JSON.stringify(memories));
    }
  }, [memories]);

  const allMemories: Memory[] = [...CULTURAL_MOMENTS, ...memories];

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

  function openAddWithDate(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setFormDate(dateStr);
    setAddModal(true);
  }

  function closeAddModal() {
    setAddModal(false);
    setFormTitle("");
    setFormDesc("");
    setFormDate("");
    setFormUrl("");
    setFormCategory("memory");
    setPendingImage("");
  }

  function saveMemory() {
    if (!formTitle.trim() || !formDate) {
      alert("Please fill in at least a title and date!");
      return;
    }
    const newMem: Memory = {
      id: Date.now(),
      title: formTitle.trim(),
      description: formDesc.trim(),
      date: formDate,
      image: pendingImage,
      url: formUrl.trim(),
      category: formCategory,
    };
    setMemories([...memories, newMem]);
    closeAddModal();
  }

  function deleteMemory(id: number) {
    if (confirm("Remove this memory?")) {
      setMemories(memories.filter((m) => m.id !== id));
      setViewModal(null);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
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
                    onClick={() => hasMemory ? setViewModal({ month: currentMonth, day: d, memories: dayMemories }) : openAddWithDate(currentYear, currentMonth, d)}
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

          <button className="add-btn" onClick={() => setAddModal(true)}>+ Add a Memory</button>
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
                {!mem.preset && <button className="delete-btn" onClick={() => deleteMemory(mem.id)}>&#10005; Delete</button>}
                <span className="category-badge" style={{ backgroundColor: CATEGORIES.find(c => c.value === mem.category)?.color || "#0054e3" }}>
                  {CATEGORIES.find(c => c.value === mem.category)?.label || "Memory"}
                </span>
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

      {/* Add Modal */}
      {addModal && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}>
          <div className="modal">
            <h3>Add a Memory</h3>
            <div className="form-group">
              <label>Category *</label>
              <div className="category-selector">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-option${formCategory === cat.value ? " selected" : ""}`}
                    style={{ borderColor: cat.color, ...(formCategory === cat.value ? { backgroundColor: cat.color, color: "#fff" } : {}) }}
                    onClick={() => setFormCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. First day of school" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Tell the story..." />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Image (optional)</label>
              <div className="image-upload-area" onClick={() => document.getElementById("memImage")?.click()}>
                {pendingImage ? "Image selected — click to change" : "Click to upload an image"}
                <input type="file" id="memImage" accept="image/*" onChange={handleImageUpload} />
                {pendingImage && <img src={pendingImage} alt="Preview" />}
              </div>
            </div>
            <div className="form-group">
              <label>Link (optional)</label>
              <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="e.g. https://en.wikipedia.org/wiki/..." />
            </div>
            <div className="form-actions">
              <button className="btn-save" onClick={saveMemory}>Save Memory</button>
              <button className="btn-cancel" onClick={closeAddModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
