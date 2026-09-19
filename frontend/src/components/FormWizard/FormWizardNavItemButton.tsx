import checkmarkIcon from '../../assets/icons/I286_5663_285_5517.svg'

interface FormWizardNavItemButtonProps {
  label: string
  isActive?: boolean
  isCompleted?: boolean
  onClick?: () => void
}

export default function FormWizardNavItemButton({
  label,
  isActive = false,
  isCompleted = false,
  onClick,
}: FormWizardNavItemButtonProps) {
  return (
    <button
      type="button"
      className={`fw-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="fw-nav-item-label">{label}</span>
      {isCompleted && (
        <img src={checkmarkIcon} alt="" className="fw-nav-item-check" width={18} height={18} />
      )}
    </button>
  )
}
