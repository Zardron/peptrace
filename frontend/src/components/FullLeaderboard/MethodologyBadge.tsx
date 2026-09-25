interface MethodologyBadgeProps {
  type: string
  purityThreshold: string
  doseTolerance: string
}

export default function MethodologyBadge({ type, purityThreshold, doseTolerance }: MethodologyBadgeProps) {
  return (
    <div className="methodology-badge-outer">
      <div className="fl-methodology-badge">
        <span className="fl-methodology-type">{type}</span>
        <span className="fl-methodology-pill">{purityThreshold}</span>
        <span className="fl-methodology-pill">{doseTolerance}</span>
        <svg className="fl-methodology-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <a href="/methodology" className="fl-methodology-link">View methodology</a>
    </div>
  )
}
