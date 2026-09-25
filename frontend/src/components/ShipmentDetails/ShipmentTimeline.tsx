interface TimelineEvent {
  event: string
  meta: string
  timestamp: string
}

interface ShipmentTimelineProps {
  events: TimelineEvent[]
}

export default function ShipmentTimeline({ events }: ShipmentTimelineProps) {
  return (
    <div className="shipment-timeline">
      {events.map((evt, i) => {
        const isLast = i === events.length - 1
        return (
          <div key={i} className="shipment-timeline-event">
            <div className="shipment-timeline-marker">
              <div className="shipment-timeline-dot" />
              {!isLast && <div className="shipment-timeline-line" />}
            </div>
            <div className="shipment-timeline-details">
              <span className="shipment-timeline-name">{evt.event}</span>
              <span className="shipment-timeline-meta">{evt.meta}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
