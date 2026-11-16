import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useMadrasaData } from '../lib/useData'
import { db } from '../lib/db'
import { PageHeader, Modal, Empty, Switch } from '../components/ui'
import { bn, bnDate, isAdmin } from '../lib/utils'

export default function Notices() {
  const { madrasa, profile, role, showToast } = useApp()
  const data = useMadrasaData()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', pinned: false })

  const admin = isAdmin(role)

  async function save() {
    if (!form.title.trim()) return showToast('শিরোনাম লিখুন')
    setBusy(true)
    try {
      await db.insert('notices', {
        madrasa_id: madrasa.id,
        title: form.title.trim(),
        body: form.body.trim() || null,
        pinned: form.pinned,
        created_by: profile?.id
      })
      await data.reload()
      setOpen(false)
      setForm({ title: '', body: '', pinned: false })
      showToast('📢 নোটিশ প্রকাশ হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('নোটিশটি মুছে ফেলবেন?')) return
    await db.remove('notices', id)
    await data.reload()
    showToast('মুছে ফেলা হয়েছে')
  }

  return (
    <>
      <PageHeader
        icon="📢"
        title="নোটিশ বোর্ড"
        subtitle="মাদ্রাসার সব খবর"
        right={
          admin ? (
            <button className="pill" onClick={() => setOpen(true)}>
              ＋ নতুন
            </button>
          ) : null
        }
      />

      <div className="app-body">
        {data.loading ? (
          <Empty icon="⏳" text="লোড হচ্ছে..." />
        ) : data.notices.length === 0 ? (
          <Empty icon="📭" title="এখনো কোনো নোটিশ নেই" text={admin ? 'উপরে ＋ নতুন চাপুন' : ''} />
        ) : (
          data.notices.map((n) => (
            <div
              className="card"
              key={n.id}
              style={{
                marginBottom: 9,
                borderLeft: n.pinned ? '4px solid var(--accent)' : '4px solid var(--line)',
                background: n.pinned
                  ? 'linear-gradient(135deg, var(--surface), var(--accent-soft))'
                  : 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {n.pinned && (
                  <span
                    style={{
                      fontSize: 9.5,
                      background: 'var(--accent)',
                      color: '#3d2f00',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 6
                    }}
                  >
                    📌 পিন করা
                  </span>
                )}
                <span style={{ fontSize: 9.5, color: 'var(--muted)', marginLeft: 'auto' }}>
                  {bnDate(n.created_at)}
                </span>
                {admin && (
                  <button
                    onClick={() => remove(n.id)}
                    style={{ color: 'var(--danger)', fontSize: 13, marginLeft: 4 }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 7 }}>{n.title}</div>
              {n.body && (
                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7, marginTop: 5 }}>
                  {n.body}
                </div>
              )}
            </div>
          ))
        )}

        {data.notices.length > 0 && (
          <div className="note">🔔 নতুন নোটিশ দিলে সবাই অ্যাপে দেখতে পাবে।</div>
        )}
      </div>

      {open && (
        <Modal title="নতুন নোটিশ" onClose={() => setOpen(false)}>
          <div className="field">
            <label>শিরোনাম</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="যেমন: মাসিক সভা"
            />
          </div>

          <div className="field">
            <label>বিবরণ</label>
            <textarea
              className="input"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="বিস্তারিত লিখুন..."
            />
          </div>

          <Switch
            label="📌 উপরে পিন করে রাখো"
            on={form.pinned}
            onChange={(v) => setForm({ ...form, pinned: v })}
          />

          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'পাঠানো হচ্ছে...' : '📢 সবাইকে পাঠান'}
          </button>
          <div className="note">মোট নোটিশ: {bn(data.notices.length)} টি</div>
        </Modal>
      )}
    </>
  )
}
