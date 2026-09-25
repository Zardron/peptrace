interface Milestone {
  name: string
  date: string
  completed: boolean
}

interface ShipmentProgressProps {
  milestones: Milestone[]
}

export default function ShipmentProgress({ milestones }: ShipmentProgressProps) {
  return (
    <div className="shipment-progress">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1
        const isCurrent = m.completed && !milestones[i + 1]?.completed
        return (
          <div key={i} className={`shipment-progress-step ${m.completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="shipment-progress-marker-row">
              <div className="shipment-progress-marker">
                <div className="shipment-progress-dot" />
              </div>
              {!isLast && <div className="shipment-progress-connector" />}
            </div>
            <div className="shipment-progress-labels">
              <span className="shipment-progress-name">{m.name}</span>
              <span className="shipment-progress-date">
                {m.date ? new Date(m.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }) : (m.completed ? 'Current' : 'Pending')}
              </span>
              {isCurrent && <span className="shipment-progress-current">Current</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
