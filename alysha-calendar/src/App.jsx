import { useState, useCallback } from "react";
import { timelineEntries } from "./data/timelineData";
import PhotoCard from "./components/PhotoCard";
import LightboxModal from "./components/LightboxModal";
import GrowthTimeline from "./components/GrowthTimeline";
import "./App.css";

export default function App() {
  const [activeEntry, setActiveEntry] = useState(null);
  const [filter, setFilter] = useState("all");

  const filters = [
    { key: "all",    label: "All Moments" },
    { key: "birth",  label: "Birth Day" },
    { key: "week1",  label: "First Week" },
    { key: "week2",  label: "Week 2" },
    { key: "month1", label: "1 Month+" },
  ];

  const filteredEntries = timelineEntries.filter((e) => {
    if (filter === "all")    return true;
    const d = e.ageInDays ?? 0;
    if (filter === "birth")  return d === 0;
    if (filter === "week1")  return d > 0 && d <= 7;
    if (filter === "week2")  return d > 7 && d <= 14;
    if (filter === "month1") return d > 14;
    return true;
  });

  const openModal = useCallback((entry) => setActiveEntry(entry), []);
  const closeModal = useCallback(() => setActiveEntry(null), []);

  const activeIndex = activeEntry
    ? filteredEntries.findIndex((e) => e.id === activeEntry.id)
    : -1;

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveEntry(filteredEntries[activeIndex - 1]);
  }, [activeIndex, filteredEntries]);

  const goNext = useCallback(() => {
    if (activeIndex < filteredEntries.length - 1)
      setActiveEntry(filteredEntries[activeIndex + 1]);
  }, [activeIndex, filteredEntries]);

  const photosCount = timelineEntries.filter((e) => e.photo).length;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-flowers">🌸</div>
          <div className="header-text">
            <h1 className="app-title">Alysha's Journey</h1>
            <p className="app-subtitle">
              Born 25 April 2022 — a calendar of her earliest days 🌱
            </p>
          </div>
          <div className="header-flowers">🌸</div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-num">{timelineEntries.length}</span>
            <span className="stat-label">Moments</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">{photosCount}</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">{timelineEntries.length - photosCount}</span>
            <span className="stat-label">To add</span>
          </div>
        </div>
      </header>

      {/* Timeline bar */}
      <GrowthTimeline
        entries={timelineEntries}
        activeId={activeEntry?.id}
        onSelect={openModal}
      />

      {/* Filter tabs */}
      <div className="filter-bar">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <main className="photo-grid-section">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <span>🌷</span>
            <p>No moments in this range yet.</p>
          </div>
        ) : (
          <div className="photo-grid">
            {filteredEntries.map((entry) => (
              <PhotoCard
                key={entry.id}
                entry={entry}
                index={timelineEntries.indexOf(entry)}
                isActive={activeEntry?.id === entry.id}
                onClick={openModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drive notice */}
      <div className="upload-hint">
        <div className="hint-box">
          <span>☁️</span>
          <div>
            <strong>Photos from Google Drive</strong> — loaded directly from
            your Drive folder. Make sure you are signed into Google in this
            browser so the images appear. To add more dates, add an entry in{" "}
            <code>src/data/timelineData.js</code>.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        Made with ❤️ for Alysha — every moment treasured
      </footer>

      {/* Lightbox */}
      {activeEntry && (
        <LightboxModal
          entry={activeEntry}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < filteredEntries.length - 1}
        />
      )}
    </div>
  );
}

