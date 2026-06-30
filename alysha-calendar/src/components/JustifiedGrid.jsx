import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./JustifiedGrid.css";

const TARGET_ROW_HEIGHT = 240;
const TARGET_ROW_HEIGHT_MOBILE = 140;
const GAP = 6;
const DEFAULT_AR = 1.5; // 3:2

function loadAspectRatios() {
  try {
    return JSON.parse(localStorage.getItem("photo_ar_cache") || "{}");
  } catch {
    return {};
  }
}

function saveAspectRatios(map) {
  try {
    localStorage.setItem("photo_ar_cache", JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/**
 * Justified row layout.
 * Returns array of rows; each row has a height and items with width.
 */
function layoutRows(items, containerWidth, targetHeight, gap) {
  if (containerWidth <= 0) return [];
  const rows = [];
  let current = [];
  let currentRatioSum = 0;

  for (const item of items) {
    current.push(item);
    currentRatioSum += item.ar;

    // Width if we used this row at targetHeight (ignoring gaps yet)
    const naturalWidth = currentRatioSum * targetHeight;
    const totalGap = gap * (current.length - 1);

    if (naturalWidth + totalGap >= containerWidth) {
      const availableForPhotos = containerWidth - totalGap;
      const rowHeight = availableForPhotos / currentRatioSum;
      rows.push({
        height: rowHeight,
        items: current.map((it) => ({ ...it, width: it.ar * rowHeight })),
      });
      current = [];
      currentRatioSum = 0;
    }
  }

  // Last incomplete row → keep at target height, left-aligned (no upscaling)
  if (current.length) {
    rows.push({
      height: targetHeight,
      items: current.map((it) => ({ ...it, width: it.ar * targetHeight })),
    });
  }

  return rows;
}

export default function JustifiedGrid({ entries, activeId, onClick, onToggleFeatured }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [arMap, setArMap] = useState(() => loadAspectRatios());

  // Watch container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = containerWidth > 0 && containerWidth < 600;
  const targetHeight = isMobile ? TARGET_ROW_HEIGHT_MOBILE : TARGET_ROW_HEIGHT;

  const items = useMemo(
    () => entries.map((e) => ({
      entry: e,
      ar: arMap[e.photo] || DEFAULT_AR,
    })),
    [entries, arMap]
  );

  const rows = useMemo(
    () => layoutRows(items, containerWidth, targetHeight, GAP),
    [items, containerWidth, targetHeight]
  );

  const handleImgLoad = useCallback((url, e) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ar = img.naturalWidth / img.naturalHeight;
    setArMap((prev) => {
      if (Math.abs((prev[url] || 0) - ar) < 0.01) return prev;
      const next = { ...prev, [url]: ar };
      saveAspectRatios(next);
      return next;
    });
  }, []);

  return (
    <div className="justified-grid" ref={containerRef}>
      {rows.map((row, ri) => (
        <div className="jg-row" key={ri} style={{ height: row.height, gap: `${GAP}px` }}>
          {row.items.map(({ entry, width }) => (
            <button
              key={entry.id}
              type="button"
              className={`jg-cell${activeId === entry.id ? " active" : ""}`}
              style={{ width, height: row.height }}
              onClick={() => onClick(entry)}
              aria-label={`${entry.label} — ${entry.caption || ""}`}
            >
              {entry.photo ? (
                <img
                  src={entry.photo}
                  alt={entry.label}
                  className="jg-img"
                  loading="lazy"
                  onLoad={(e) => handleImgLoad(entry.photo, e)}
                />
              ) : (
                <div className="jg-placeholder">
                  <span>📷</span>
                </div>
              )}

              <div className="jg-overlay">
                <div className="jg-meta">
                  <span className="jg-label">{entry.label}</span>
                  {entry.date && !entry.date_unknown && (
                    <span className="jg-date">{entry.date}</span>
                  )}
                </div>
              </div>

              {onToggleFeatured && (
                <span
                  role="button"
                  tabIndex={0}
                  className={`jg-star${entry.featured ? " starred" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFeatured(entry.id, !entry.featured);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleFeatured(entry.id, !entry.featured);
                    }
                  }}
                  aria-label={entry.featured ? "Unstar" : "Star"}
                >
                  {entry.featured ? "★" : "☆"}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
