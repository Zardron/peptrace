import { useEffect } from 'react'
import './Toast.css'

export type ToastTone = 'success' | 'error'

export interface ToastMessage {
  tone: ToastTone
  message: string
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
  durationMs?: number
}

export default function Toast({ toast, onDismiss, durationMs = 3500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss, durationMs])

  if (!toast) return null

  return (
    <div className={`peptrace-toast peptrace-toast--${toast.tone}`} role="status" aria-live="polite">
      <p>{toast.message}</p>
      <button type="button" className="peptrace-toast-dismiss" aria-label="Dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  )
}
