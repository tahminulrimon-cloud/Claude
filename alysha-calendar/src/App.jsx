import { useState, useCallback, useEffect, useMemo } from "react";
import { getEntries, updateEntry } from "./services/api";
import PhotoCard from "./components/PhotoCard";
import LightboxModal from "./components/LightboxModal";
import GrowthTimeline from "./components/GrowthTimeline";
import KidsView from "./components/KidsView";
import PhotoStrip from "./components/PhotoStrip";
import OnThisDay from "./components/OnThisDay";
import AlbumCard from "./components/AlbumCard";
import AlbumView from "./components/AlbumView";
import { singaporePhotos } from "./data/singaporeAlbum";
import "./App.css";

const FILTERS = [
  { key: "all",     label: "All Moments", icon: "🌿", season: "all"    },
  { key: "undated", label: "Early Days",  icon: "🍼", season: "spring" },
  { key: "newborn", label: "Newborn",     icon: "🌸", season: "spring" },
  { key: "baby",    label: "Baby",        icon: "☀️", season: "summer" },
  { key: "toddler", label: "Toddler",     icon: "🍂", season: "autumn" },
  { key: "bigkid",  label: "Big Girl",    icon: "✨", season: "winter" },
];

const CHAPTERS = {
  all:     { title: "Alysha's Complete Story",        sub: "Every precious moment, from first breath to today" },
  undated: { title: "Early Days",                     sub: "First moments · Exact dates to be confirmed" },
  newborn: { title: "Chapter I · The Arrival",        sub: "0 – 3 months  ·  Spring of life" },
  baby:    { title: "Chapter II · First Blooms",      sub: "3 months – 1 year  ·  Summer of discovery" },
  toddler: { title: "Chapter III · Little Wonder",    sub: "1 – 3 years  ·  Autumn of adventure" },
  bigkid:  { title: "Chapter IV · Shining Bright",   sub: "3 years and beyond  ·  Her own season" },
};

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function groupByYearMonth(entries) {
  const byYear = {};
  for (const entry of entries) {
    const parts = entry.date.split(" ");
    const year  = parts[parts.length - 1];
    const month = parts[parts.length - 2];
    if (!byYear[year]) byYear[year] = {};
    if (!byYear[year][month]) byYear[year][month] = [];
    byYear[year][month].push(entry);
  }
  return Object.keys(byYear)
    .sort((a, b) => Number(a) - Number(b))
    .map(year => ({
      year,
      months: MONTH_ORDER
        .filter(m => byYear[year][m])
        .map(month => ({ month, entries: byYear[year][month] })),
    }));
}

export default function App() {
  const [entries, setEntries]         = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError]     = useState(null);

  const getFeaturedIds = () => {
    try { return new Set(JSON.parse(localStorage.getItem("featured_ids") || "[]")); }
    catch { return new Set(); }
  };

  const fetchEntries = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await getEntries();
      const featuredIds = getFeaturedIds();
      setEntries(data.map(e => ({ ...e, featured: featuredIds.has(e.id) ? 1 : (e.featured ?? 0) })));
      setDataError(null);
    } catch {
      setDataError("Could not load photos. Please try again.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  const [filter, setFilter]           = useState("all");
  const [activeEntry, setActiveEntry] = useState(null);
  const [kidsMode, setKidsMode]             = useState(false);
  const [kpopMode, setKpopMode]             = useState(false);
  const [singaporeOpen, setSingaporeOpen]   = useState(false);
  const allYears = useMemo(
    () => new Set(entries.map(e => e.date.split(" ").at(-1))),
    [entries]
  );
  const [collapsedYears, setCollapsedYears] = useState(new Set());
  const openYears = useMemo(
    () => new Set([...allYears].filter(y => !collapsedYears.has(y))),
    [allYears, collapsedYears]
  );

  const toggleYear = useCallback((year) => {
    setCollapsedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year); else next.add(year);
      return next;
    });
  }, []);

  const kidsEntries = entries.filter(e => e.photo);

  const currentSeason = FILTERS.find(f => f.key === filter)?.season ?? "all";
  const chapter       = CHAPTERS[filter];

  const filteredEntries = entries.filter((e) => {
    if (filter === "undated") return !!e.date_unknown;
    if (e.date_unknown) return false;
    if (filter !== "all") {
      const d = e.age_in_days ?? 0;
      if (filter === "newborn" && !(d <= 90))               return false;
      if (filter === "baby"    && !(d > 90 && d <= 365))    return false;
      if (filter === "toddler" && !(d > 365 && d <= 1095))  return false;
      if (filter === "bigkid"  && !(d > 1095))              return false;
    }
    return true;
  });

  const handleToggleFeatured = useCallback(async (id, value) => {
    // Update UI immediately
    setEntries(prev => prev.map(e => e.id === id ? { ...e, featured: value ? 1 : 0 } : e));

    // Persist to localStorage (works on Vercel + local)
    try {
      const ids = getFeaturedIds();
      value ? ids.add(id) : ids.delete(id);
      localStorage.setItem("featured_ids", JSON.stringify([...ids]));
    } catch { /* ignore */ }

    // Also try syncing to the API if available
    try { await updateEntry(id, { featured: value ? 1 : 0 }); } catch { /* not available on Vercel */ }
  }, []);

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

  const photosCount    = entries.filter((e) => e.photo).length;
  const featuredEntries = entries.filter((e) => e.featured);
  const grouped        = groupByYearMonth(filteredEntries);

  return (
    <div className={`app${kpopMode ? " kpop-demons" : ""}`} data-season={currentSeason}>
      {kidsMode && (
        <KidsView
          entries={kidsEntries}
          onExit={() => setKidsMode(false)}
        />
      )}
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

      {featuredEntries.length > 0 && (
        <PhotoStrip entries={featuredEntries} onOpenLightbox={openModal} />
      )}

      {entries.length > 0 && (
        <GrowthTimeline entries={entries} activeId={activeEntry?.id} onSelect={openModal} />
      )}

      {entries.length > 0 && (
        <OnThisDay entries={entries} onOpen={openModal} />
      )}

      {/* Albums section */}
      <section className="albums-section">
        <div className="chapter-heading">
          <h2 className="chapter-title">Albums</h2>
          <p className="chapter-sub">Curated collections from special journeys</p>
        </div>
        <div className="albums-grid">
          <AlbumCard
            name="Alysha in Singapore"
            location="Singapore"
            photoCount={singaporePhotos.length}
            coverPhoto={singaporePhotos[3].photo}
            onClick={() => setSingaporeOpen(true)}
          />
        </div>
      </section>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
            data-season={f.season}
            onClick={() => setFilter(f.key)}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

<div className="chapter-heading">
        <h2 className="chapter-title">{chapter.title}</h2>
        <p className="chapter-sub">{chapter.sub}</p>
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
          <div className="year-folders" key={filter}>
            {grouped.map(({ year, months }) => {
              const isOpen    = openYears.has(year);
              const yearCount = months.reduce((s, m) => s + m.entries.length, 0);
              return (
                <div key={year} className={`year-folder ${isOpen ? "open" : ""}`}>
                  <button
                    className="year-header"
                    onClick={() => toggleYear(year)}
                    aria-expanded={isOpen}
                  >
                    <span className="year-folder-icon">{isOpen ? "📂" : "📁"}</span>
                    <span className="year-name">{year}</span>
                    <span className="year-count">{yearCount} {yearCount === 1 ? "photo" : "photos"}</span>
                    <span className="year-chevron">{isOpen ? "▾" : "▸"}</span>
                  </button>

                  {isOpen && (
                    <div className="year-content">
                      {months.map(({ month, entries: monthEntries }) => (
                        <div key={month} className="month-section">
                          <div className="month-header">
                            <span className="month-icon">📅</span>
                            <span className="month-name">{month}</span>
                            <span className="month-count">{monthEntries.length} {monthEntries.length === 1 ? "photo" : "photos"}</span>
                          </div>
                          <div className="photo-grid">
                            {monthEntries.map((entry) => (
                              <PhotoCard
                                key={entry.id}
                                entry={entry}
                                index={entries.indexOf(entry)}
                                isActive={activeEntry?.id === entry.id}
                                onClick={openModal}
                                onToggleFeatured={handleToggleFeatured}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

      {singaporeOpen && (
        <AlbumView
          photos={singaporePhotos}
          title="Alysha in Singapore"
          onClose={() => setSingaporeOpen(false)}
        />
      )}

      {kidsEntries.length > 0 && (
        <button
          className="kids-mode-btn"
          onClick={() => setKidsMode(true)}
          aria-label="Open Alysha's View"
        >
          🌟 Alysha's View
        </button>
      )}

      <button
        className={`kpop-toggle-btn${kpopMode ? " active" : ""}`}
        onClick={() => setKpopMode(v => !v)}
        aria-label="Toggle K-Pop Demons theme"
        title={kpopMode ? "Exit K-Pop Demons" : "K-Pop Demons mode"}
      >
        {kpopMode ? "🌸 Exit Demons" : "😈 K-Pop Demons"}
      </button>
    </div>
  );
}
