import { useEffect, useState, useCallback } from 'react'
import { fetchTimeline, updateItem } from './api.js'
import Countdown from './components/Countdown.jsx'
import TimelineView from './components/TimelineView.jsx'
import ChecklistView from './components/ChecklistView.jsx'
import './App.css'

export default function App() {
  const [exercise, setExercise] = useState(null)
  const [items, setItems] = useState([])
  const [view, setView] = useState('timeline')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTimeline()
      .then((data) => {
        setExercise(data.exercise)
        setItems(data.items)
      })
      .catch((err) => setError(err.message))
  }, [])

  const handleToggle = useCallback((id, done) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)))
    updateItem(id, { done }).catch(() => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !done } : item)))
      setError('Failed to save change - is the backend running?')
    })
  }, [])

  if (error) {
    return <div className="app-error">{error}</div>
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
