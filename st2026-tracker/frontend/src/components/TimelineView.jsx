import './TimelineView.css'

const PHASE_LABELS = {
  'pre-exercise': 'Pre-Exercise',
  'movement-day': 'Movement Day',
  'during-exercise': 'During Exercise',
  'post-exercise': 'Return & Post-Exercise',
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

export default function TimelineView({ items, onToggle }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  const grouped = sorted.reduce((acc, item) => {
    ;(acc[item.phase] ??= []).push(item)
    return acc
  }, {})

  return (
    <div className="timeline">
      {Object.entries(grouped).map(([phase, phaseItems]) => (
        <section key={phase} className="timeline-phase">
          <h2>{PHASE_LABELS[phase] ?? phase}</h2>
          <ol className="timeline-list">
            {phaseItems.map((item) => (
              <li key={item.id} className={item.done ? 'timeline-item done' : 'timeline-item'}>
                <label className="timeline-check">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => onToggle(item.id, e.target.checked)}
                  />
                </label>
                <div className="timeline-body">
                  <div className="timeline-date">{formatDate(item.date)}</div>
                  <div className="timeline-title">{item.title}</div>
                  {item.description && <p className="timeline-desc">{item.description}</p>}
                  <div className="timeline-meta">
                    <span className="timeline-responsible">{item.responsible}</span>
                    {item.sourceRef && <span className="timeline-source">{item.sourceRef}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
