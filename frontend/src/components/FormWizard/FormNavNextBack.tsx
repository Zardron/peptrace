import arrowLeft from '../../assets/icons/282_5428.svg'
import arrowRight from '../../assets/icons/282_5432.svg'
import arrowRightGreen from '../../assets/icons/289_5895.svg'

interface FormNavNextBackProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  showSkip?: boolean
  onSkip?: () => void
}

export default function FormNavNextBack({
  onBack,
  onNext,
  nextLabel = 'Next',
  showSkip = false,
  onSkip,
}: FormNavNextBackProps) {
  return (
    <div className="fw-nav-actions">
      {onBack && (
        <button type="button" className="fw-btn-back" onClick={onBack}>
          <img src={arrowLeft} alt="" width={10} height={8} />
          <span>Back</span>
        </button>
      )}
      {showSkip && onSkip && (
        <button type="button" className="fw-btn-skip" onClick={onSkip}>
          <img src={arrowRightGreen} alt="" width={10} height={8} />
          <span>Skip</span>
        </button>
      )}
      {onNext && (
        <button type="button" className="fw-btn-next" onClick={onNext}>
          <span>{nextLabel}</span>
          <img src={arrowRight} alt="" width={10} height={8} />
        </button>
      )}
    </div>
  )
}
