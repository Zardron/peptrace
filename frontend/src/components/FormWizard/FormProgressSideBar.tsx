import FormWizardNavItemButton from './FormWizardNavItemButton'

export interface StepDef {
  label: string
  key: string
}

interface FormProgressSideBarProps {
  steps: StepDef[]
  currentStep: number
  onStepClick?: (step: number) => void
  price?: string
}

export default function FormProgressSideBar({
  steps,
  currentStep,
  onStepClick,
  price = 'FREE',
}: FormProgressSideBarProps) {
  return (
    <aside className="fw-sidebar">
      <nav className="fw-sidebar-nav">
        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep
          return (
            <FormWizardNavItemButton
              key={step.key}
              label={step.label}
              isActive={isActive}
              isCompleted={isCompleted}
              onClick={isCompleted ? () => onStepClick?.(stepNum) : undefined}
            />
          )
        })}
      </nav>
      <div className="fw-cart-progress">
        <span className="fw-cart-label">Price:</span>
        <span className="fw-cart-value">{price}</span>
      </div>
    </aside>
  )
}
