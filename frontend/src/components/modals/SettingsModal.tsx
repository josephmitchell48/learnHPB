import type { ReactNode } from 'react'
import clsx from 'clsx'
import './SettingsModal.css'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
  variant?: 'light' | 'dark'
  children?: ReactNode
}

const SettingsModal = ({ open, onClose, variant = 'light', children }: SettingsModalProps) => {
  if (!open) {
    return null
  }

  return (
    <div className="settings-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className={clsx('settings-modal', {
          'settings-modal--open': open,
          'settings-modal--dark': variant === 'dark',
        })}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-modal__header">
          <div>
            <h2 id="settings-modal-title">App settings</h2>
            <p>Configure your display and profile preferences.</p>
          </div>
          <button
            type="button"
            className="settings-modal__close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        <div className="settings-modal__content">{children}</div>
      </div>
    </div>
  )
}

export default SettingsModal
