import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import checkmarkIcon from '../../assets/icons/I286_5663_285_5517.svg'

interface FormWizardNavItemButtonProps {
  label: string
  isActive?: boolean
  isCompleted?: boolean
  rightText?: string
  onDelete?: () => void
  onClick?: () => void
}

export default function FormWizardNavItemButton({
  label,
  isActive = false,
  isCompleted = false,
  rightText,
  onDelete,
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
      {rightText && <span className="fw-nav-item-right">{rightText}</span>}
      {isCompleted && (
        <img src={checkmarkIcon} alt="" className="fw-nav-item-check" width={18} height={18} />
      )}
      {onDelete && (
        <span
          className="fw-nav-item-delete"
          role="button"
          aria-label={`Delete ${label}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </span>
      )}
    </button>
  )
}
