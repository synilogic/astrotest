import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  return createPortal(
    <div className="react-kl-modal-overlay" onClick={onClose}>
      <div className="react-kl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="react-kl-modal-header">
          <h3>{title}</h3>
          <button type="button" className="react-kl-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="react-kl-modal-body">
          {children}
        </div>
        {footer && (
          <div className="react-kl-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default Modal


