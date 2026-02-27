"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  year: string;
  emoji: string;
  image: string;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getSampleMemories(): Memory[] {
  const y = new Date().getFullYear();
  return [
    { id: 1, title: "First day of school", description: "Nervous but excited — a brand new backpack and everything.", date: `${y}-09-05`, year: "1999", emoji: "🎒", image: "" },
    { id: 2, title: "Summer road trip", description: "Windows down, favourite songs on repeat.", date: `${y}-07-14`, year: "2004", emoji: "🚗", image: "" },
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
  const [formYear, setFormYear] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [pendingImage, setPendingImage] = useState("");

  const [showStartup, setShowStartup] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nostalgiaMemories");
    setMemories(saved ? JSON.parse(saved) : getSampleMemories());
  }, []);

  // Play XP startup sound and show boot screen
  useEffect(() => {
    const playSound = () => {
      const audio = new Audio("/xp-startup.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
      document.removeEventListener("click", playSound);
    };
    document.addEventListener("click", playSound);

    const timer = setTimeout(() => setShowStartup(false), 4500);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", playSound);
    };
  }, []);

  useEffect(() => {
    if (memories.length > 0) {
      localStorage.setItem("nostalgiaMemories", JSON.stringify(memories));
    }
  }, [memories]);

  function getMemoriesForDate(month: number, day: number): Memory[] {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return memories.filter((mem) => {
      const [, mm, dd] = mem.date.split("-");
      return mm === m && dd === d;
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
    setFormYear("");
    setFormEmoji("");
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
      year: formYear.trim(),
      emoji: formEmoji.trim(),
      image: pendingImage,
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
        const audio = new Audio("/xp-startup.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
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
            <button onClick={() => changeMonth(-1)}>&#8592; Prev</button>
            <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
            <button onClick={() => changeMonth(1)}>Next &#8594;</button>
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
                const dayMemories = getMemoriesForDate(currentMonth, d);
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
                        <div className="memory-dot" />
                        <div className="memory-preview">{dayMemories[0].emoji || "📖"} {dayMemories[0].title}</div>
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
                <button className="delete-btn" onClick={() => deleteMemory(mem.id)}>&#10005; Delete</button>
                <h4>{mem.emoji || "📖"} {mem.title}</h4>
                <div className="memory-year">Date: {mem.date}{mem.year ? ` | Year: ${mem.year}` : ""}</div>
                {mem.description && <p>{mem.description}</p>}
                {mem.image && <img src={mem.image} alt={mem.title} />}
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
              <label>Year it happened (if different)</label>
              <input type="number" value={formYear} onChange={(e) => setFormYear(e.target.value)} placeholder="e.g. 1995" min={1900} max={2100} />
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
              <label>Emoji (optional)</label>
              <input type="text" value={formEmoji} onChange={(e) => setFormEmoji(e.target.value)} placeholder="e.g. 🎂 🎬 🎵" maxLength={4} />
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
