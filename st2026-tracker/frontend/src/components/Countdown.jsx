import './Countdown.css'

function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = target - startOfToday
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export default function Countdown({ exercise }) {
  const toStart = daysUntil(exercise.startDate)
  const toEnd = daysUntil(exercise.endDate)

  let label
  let days
  if (toStart > 0) {
    label = 'Days to Deployment'
    days = toStart
  } else if (toEnd >= 0) {
    label = 'Days Remaining in Exercise'
    days = toEnd
  } else {
    label = 'Days Since Exercise Ended'
    days = Math.abs(toEnd)
  }

  return (
    <div className="countdown">
      <div className="countdown-exercise">
        <strong>{exercise.name}</strong>
        <span>{exercise.fullName} &middot; {exercise.startDate} to {exercise.endDate}</span>
      </div>
      <div className="countdown-number">
        <span className="countdown-days">{days}</span>
        <span className="countdown-label">{label}</span>
      </div>
    </div>
  )
}
