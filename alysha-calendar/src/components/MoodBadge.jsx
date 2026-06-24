import { useState, useEffect, useRef } from "react";
import { analyzeMood } from "../services/api";
import { MOOD_META, getCachedMood, setCachedMood } from "../data/moodMeta";
import "./MoodBadge.css";

export default function MoodBadge({ entry, size = "sm" }) {
  const [mood, setMood]       = useState(() => getCachedMood(entry.id));
  const [loading, setLoading] = useState(false);
  const triggered = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    if (mood || !entry.photo || triggered.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || triggered.current) return;
        triggered.current = true;
        observer.disconnect();
        setLoading(true);
        analyzeMood(entry.photo)
          .then((m) => { setMood(m); setCachedMood(entry.id, m); })
          .catch(() => { /* ignore */ })
          .finally(() => setLoading(false));
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entry.id, entry.photo, mood]);

  const meta = mood ? MOOD_META[mood] : null;

  return (
    <span ref={ref} className={`mood-badge mood-badge--${size}${loading ? " mood-badge--loading" : ""}`}
      title={meta ? meta.label : "Analyzing mood…"}>
      {loading ? "…" : meta ? meta.emoji : null}
    </span>
  );
}
