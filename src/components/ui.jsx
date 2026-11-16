import { useApp } from '../context/AppContext'
import { initials } from '../lib/utils'

export function PageHeader({ icon, title, subtitle, right, logoUrl }) {
  return (
    <div className="app-head">
      <div className="head-row">
        <div className="logo-box">
          {logoUrl ? <img src={logoUrl} alt="" /> : <span>{icon || '🕌'}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="m-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
          {subtitle && <div className="m-sub">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return <div className="toast">{toast}</div>
}

export function Empty({ icon = '📭', title, text }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      {title && <div style={{ fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>}
      {text && <div>{text}</div>}
    </div>
  )
}

export function Avatar({ name, url, className = '' }) {
  return (
    <div className={`av ${className}`}>
      {url ? <img src={url} alt="" /> : initials(name)}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose} aria-label="বন্ধ">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Switch({ on, onChange, label }) {
  return (
    <div className="switch-row">
      <span>{label}</span>
      <div
        className={`switch ${on ? 'on' : ''}`}
        onClick={() => onChange(!on)}
        role="switch"
        aria-checked={on}
      />
    </div>
  )
}
