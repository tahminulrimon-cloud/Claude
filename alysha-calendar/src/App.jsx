import { useState, useCallback, useEffect } from "react";
import { getEntries } from "./services/api";
import PhotoCard from "./components/PhotoCard";
import LightboxModal from "./components/LightboxModal";
import GrowthTimeline from "./components/GrowthTimeline";
import "./App.css";

const FILTERS = [
  { key: "all",    label: "All Moments" },
  { key: "birth",  label: "Birth Day" },
  { key: "week1",  label: "First Week" },
  { key: "week2",  label: "Week 2" },
  { key: "month1", label: "1 Month+" },
];

export default function App() {
  const [entries, setEntries]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError]   = useState(null);

  const fetchEntries = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await getEntries();
      setEntries(data);
      setDataError(null);
    } catch {
      setDataError("Could not load photos. Please try again.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const [filter, setFilter]           = useState("all");
  const [activeEntry, setActiveEntry] = useState(null);

  const filteredEntries = entries.filter((e) => {
    if (filter === "all")    return true;
    const d = e.age_in_days ?? 0;
    if (filter === "birth")  return d === 0;
    if (filter === "week1")  return d > 0 && d <= 7;
    if (filter === "week2")  return d > 7 && d <= 14;
    if (filter === "month1") return d > 14;
    return true;
  });

  const openModal  = useCallback((entry) => setActiveEntry(entry), []);
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

  const photosCount = entries.filter((e) => e.photo).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-flowers">🌸</div>
          <div className="header-text">
            <h1 className="app-title">Alysha's Journey</h1>
            <p className="app-subtitle">Born 25 April 2022 — a calendar of her earliest days 🌱</p>
          </div>
          <div className="header-flowers">🌸</div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-num">{entries.length}</span>
            <span className="stat-label">Moments</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">{photosCount}</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">{entries.length > 0 ? Math.max(...entries.map(e => e.age_in_days)) : 0}</span>
            <span className="stat-label">Days old</span>
          </div>
        </div>
      </header>

      {entries.length > 0 && (
        <GrowthTimeline entries={entries} activeId={activeEntry?.id} onSelect={openModal} />
      )}

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main className="photo-grid-section">
        {dataLoading ? (
          <div className="empty-state"><span className="spinner" />Loading…</div>
        ) : dataError ? (
          <div className="empty-state error">
            <span>⚠️</span>
            <p>{dataError}</p>
            <button className="retry-btn" onClick={fetchEntries}>Retry</button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state"><span>🌷</span><p>No moments in this range yet.</p></div>
        ) : (
          <div className="photo-grid">
            {filteredEntries.map((entry) => (
              <PhotoCard
                key={entry.id}
                entry={entry}
                index={entries.indexOf(entry)}
                isActive={activeEntry?.id === entry.id}
                onClick={openModal}
              />
            ))}
          </div>
        )}
      </main>

      <div className="upload-hint">
        <div className="hint-box">
          <span>☁️</span>
          <div>
            <strong>Photos from Google Drive</strong> — open in a browser signed into Google.
          </div>
        </div>
      </div>

      <footer className="app-footer">
        Made with ❤️ for Alysha — every moment treasured
      </footer>

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
