interface MethodologyBadgeProps {
  type: string
  purityThreshold: string
  doseTolerance: string
}

export default function MethodologyBadge({ type, purityThreshold, doseTolerance }: MethodologyBadgeProps) {
  return (
    <div className="fl-methodology-badge">
      <span className="fl-methodology-type">{type}</span>
      <span className="fl-methodology-pill">{purityThreshold}</span>
      <span className="fl-methodology-dose">{doseTolerance}</span>
      <a href="/methodology" className="fl-methodology-link">View methodology</a>
    </div>
  )
}
