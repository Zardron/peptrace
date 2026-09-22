import FormWizardNavItemButton from './FormWizardNavItemButton'

export interface StepDef {
  label: string
  key: string
}

export interface SampleDef {
  label: string
  price?: string
}

interface FormProgressSideBarProps {
  steps: StepDef[]
  currentStep: number
  onStepClick?: (step: number) => void
  price?: string
  samples?: SampleDef[]
  activeSample?: number
  onSampleClick?: (index: number) => void
  onSampleDelete?: (index: number) => void
}

export default function FormProgressSideBar({
  steps,
  currentStep,
  onStepClick,
  price = 'FREE',
  samples = [],
  activeSample = 0,
  onSampleClick,
  onSampleDelete,
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
      {samples.length > 1 && (
        <div className="fw-sidebar-samples">
          <span className="fw-sidebar-samples-label">Samples</span>
          <nav className="fw-sidebar-nav">
            {samples.map((s, idx) => (
              <FormWizardNavItemButton
                key={idx}
                label={s.label}
                isActive={idx === activeSample}
                rightText={s.price}
                onDelete={onSampleDelete ? () => onSampleDelete(idx) : undefined}
                onClick={() => onSampleClick?.(idx)}
              />
            ))}
          </nav>
        </div>
      )}
      <div className="fw-cart-progress">
        <span className="fw-cart-label">Price:</span>
        <span className="fw-cart-value">{price}</span>
      </div>
    </aside>
  )
}
