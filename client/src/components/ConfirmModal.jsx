import { useEffect, useRef } from 'react'
import Icon from './Icons.jsx'

export default function ConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onClose }) {
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()} ref={ref}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x-close" size={20} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '20px 16px 24px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onClose}>{cancelLabel}</button>
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
