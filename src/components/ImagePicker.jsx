import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { uploadImage } from '../lib/upload'
import { initials } from '../lib/utils'

/**
 * ছবি আপলোড করার সহজ বাটন — Facebook/মেসেঞ্জারের মতো।
 * গ্যালারি বা ক্যামেরা থেকে ছবি বেছে নিলেই আপলোড হয়ে যায়।
 * চাইলে আগের মতো লিংকও দেওয়া যায়।
 */
export default function ImagePicker({
  value = '',
  onChange,
  name = '',
  folder = 'avatars',
  label = 'ছবি',
  size = 76,
  shape = 'square'
}) {
  const { madrasa, showToast } = useApp()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [linkValue, setLinkValue] = useState(value)

  useEffect(() => {
    setLinkValue(value)
  }, [value])

  function commitLink() {
    const next = linkValue.trim()
    if (next !== value) onChange?.(next)
  }

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage(file, folder, madrasa?.id || 'general')
      onChange?.(url)
      showToast('✅ ছবি যোগ হয়েছে')
    } catch (err) {
      showToast('❌ ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="img-picker">
      <button
        type="button"
        className={`img-picker-av ${shape === 'circle' ? 'round' : ''} ${busy ? 'busy' : ''}`}
        style={{ width: size, height: size }}
        onClick={() => fileRef.current?.click()}
        title="ছবি বদলান"
      >
        {value ? (
          <img src={value} alt={name || label} />
        ) : (
          <span className="img-picker-init">{initials(name || '?')}</span>
        )}
        <span className="img-picker-badge">{busy ? '⏳' : '📷'}</span>
      </button>

      <div className="img-picker-side">
        <div className="img-picker-title">{label}</div>
        <div className="img-picker-actions">
          <button type="button" className="btn sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'আপলোড হচ্ছে...' : '📷 ছবি আপলোড'}
          </button>
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => setLinkMode((v) => !v)}
            title="লিংক দিয়ে ছবি"
          >
            🔗 লিংক
          </button>
          {value && (
            <button
              type="button"
              className="btn sm danger"
              onClick={() => onChange?.('')}
              title="ছবি সরান"
            >
              ✕
            </button>
          )}
        </div>
        <div className="img-picker-hint">ফোনের গ্যালারি বা ক্যামেরা থেকে বেছে নিন</div>
      </div>

      {linkMode && (
        <input
          className="input"
          style={{ marginTop: 8 }}
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          onBlur={commitLink}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitLink()
            }
          }}
          placeholder="https://... (ছবির লিংক)"
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={pick}
      />
    </div>
  )
}
