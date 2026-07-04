import './ChecklistView.css'

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  })
}

export default function ChecklistView({ items, onToggle }) {
  const groups = items.reduce((acc, item) => {
    ;(acc[item.responsible] ??= []).push(item)
    return acc
  }, {})

  const responsibleNames = Object.keys(groups).sort()

  return (
    <div className="checklist">
      {responsibleNames.map((name) => {
        const groupItems = [...groups[name]].sort((a, b) => a.date.localeCompare(b.date))
        const doneCount = groupItems.filter((i) => i.done).length
        return (
          <section key={name} className="checklist-group">
            <header>
              <h2>{name}</h2>
              <span className="checklist-progress">
                {doneCount}/{groupItems.length} done
              </span>
            </header>
            <ul>
              {groupItems.map((item) => (
                <li key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => onToggle(item.id, e.target.checked)}
                    />
                    <span className={item.done ? 'done' : ''}>
                      <strong>{formatDate(item.date)}</strong> &mdash; {item.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
