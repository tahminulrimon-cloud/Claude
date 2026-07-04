import { useEffect, useState, useCallback } from 'react'
import { fetchTimeline, updateItem } from './api.js'
import { getPending, queueWrite, flushPending, pendingCount as readPendingCount } from './offlineQueue.js'
import Countdown from './components/Countdown.jsx'
import TimelineView from './components/TimelineView.jsx'
import ChecklistView from './components/ChecklistView.jsx'
import './App.css'

export default function App() {
  const [exercise, setExercise] = useState(null)
  const [items, setItems] = useState([])
  const [view, setView] = useState('timeline')
  const [loadError, setLoadError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(readPendingCount())

  const flush = useCallback(() => {
    flushPending(updateItem).then((remaining) => setPending(remaining))
  }, [])

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        setExercise(data.exercise)
        // Any writes queued from a previous offline session take precedence
        // over the freshly fetched state for the items they touched.
        const pendingWrites = getPending()
        const merged = data.items.map((item) =>
          pendingWrites[item.id] ? { ...item, ...pendingWrites[item.id] } : item,
        )
        setItems(merged)
      })
      .catch((err) => setLoadError(err.message))
    flush()
  }, [flush])

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true)
      flush()
    }
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [flush])

  const handleToggle = useCallback(
    (id, done) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)))
      updateItem(id, { done })
        .then(flush)
        .catch(() => {
          queueWrite(id, { done })
          setPending(readPendingCount())
        })
    },
    [flush],
  )

  if (loadError) {
    return <div className="app-error">{loadError}</div>
  }

  if (!exercise) {
    return <div className="app-loading">Loading ST-2026 timeline&hellip;</div>
  }

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="app">
      <header className="app-header">
        <h1>ST-2026 Tracker</h1>
        <span className="app-progress">{doneCount}/{items.length} items complete</span>
      </header>

      {!isOnline && (
        <div className="app-banner offline" role="status">
          You&rsquo;re offline &mdash; changes are saved on this device and will sync automatically.
        </div>
      )}
      {isOnline && pending > 0 && (
        <div className="app-banner syncing" role="status">
          Syncing {pending} pending change{pending === 1 ? '' : 's'}&hellip;
        </div>
      )}

      <Countdown exercise={exercise} />

      <nav className="app-tabs">
        <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>
          Timeline
        </button>
        <button className={view === 'checklist' ? 'active' : ''} onClick={() => setView('checklist')}>
          By Appointment
        </button>
      </nav>

      {view === 'timeline' ? (
        <TimelineView items={items} onToggle={handleToggle} />
      ) : (
        <ChecklistView items={items} onToggle={handleToggle} />
      )}
    </div>
  )
}
