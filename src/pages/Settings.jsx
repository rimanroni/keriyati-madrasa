import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useMadrasaData } from '../lib/useData'
import { db } from '../lib/db'
import { PageHeader, Avatar, Empty } from '../components/ui'
import { THEMES } from '../lib/themes'
import { ROLE_LABEL, isAdmin, money, bn, taka } from '../lib/utils'

export default function Settings() {
  const { madrasa, profile, role, refresh, signOut, setTheme, theme, showToast } = useApp()
  const data = useMadrasaData()
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState({ name: '', address: '', phone: '', logo_url: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (madrasa) {
      setForm({
        name: madrasa.name || '',
        address: madrasa.address || '',
        phone: madrasa.phone || '',
        logo_url: madrasa.logo_url || ''
      })
    }
  }, [madrasa])

  const loadProfiles = useCallback(async () => {
    if (!madrasa?.id) return
    const p = await db.listProfiles(madrasa.id)
    setProfiles(p || [])
  }, [madrasa?.id])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function saveInfo() {
    setBusy(true)
    try {
      await db.updateMadrasa(madrasa.id, {
        name: form.name.trim() || 'মাদ্রাসা',
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        logo_url: form.logo_url.trim() || null
      })
      await refresh()
      showToast('✅ তথ্য সেভ হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveTheme(t) {
    setTheme(t)
    try {
      await db.updateMadrasa(madrasa.id, { theme: t })
      showToast('🎨 থিম বদলানো হয়েছে')
      refresh()
    } catch (e) {
      showToast('❌ থিম সেভ হয়নি')
    }
  }

  async function changeRole(userId, newRole) {
    if (userId === profile?.id) {
      showToast('নিজের রোল নিজে বদলানো যাবে না')
      return
    }
    try {
      await db.updateProfile(userId, { role: newRole })
      await loadProfiles()
      showToast('✅ রোল আপডেট হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    }
  }

  async function transferOwner(userId, name) {
    if (!window.confirm(`${name}-কে সুপার অ্যাডমিন বানাবেন? আপনি অ্যাডমিন হয়ে যাবেন।`)) return
    try {
      await db.updateProfile(profile.id, { role: 'admin' })
      await db.updateProfile(userId, { role: 'owner' })
      await loadProfiles()
      await refresh()
      showToast('👑 মালিকানা হস্তান্তর হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    }
  }

  function exportCsv() {
    const rows = [['ধরন', 'তারিখ', 'মাস', 'নাম/বিবরণ', 'মাধ্যম/খাত', 'টাকা']]
    for (const d of data.donations) {
      rows.push(['জমা', d.donated_on, d.month, d.donor_name, d.method, d.amount])
    }
    for (const e of data.expenses) {
      rows.push(['খরচ', e.spent_on, e.month, e.title, e.category_id || '', e.amount])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hisab-${madrasa?.name || 'madrasa'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📤 এক্সপোর্ট হয়েছে')
  }

  if (!isAdmin(role)) return <Empty icon="🔒" title="শুধু অ্যাডমিন" />

  const totalDonations = data.donations.reduce((s, d) => s + Number(d.amount), 0)
  const totalExpenses = data.expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <>
      <PageHeader icon="⚙️" title="সেটিংস" subtitle="শুধু অ্যাডমিন" right={<div className="pill">অ্যাডমিন</div>} />

      <div className="app-body">
        {/* মাদ্রাসার তথ্য */}
        <div className="sec" style={{ marginTop: 2 }}>
          মাদ্রাসার তথ্য
        </div>

        <div className="field">
          <label>মাদ্রাসার নাম</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>ঠিকানা</label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="field">
          <label>ফোন</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="field">
          <label>লোগোর লিংক (ঐচ্ছিক)</label>
          <input
            className="input"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <button className="btn" onClick={saveInfo} disabled={busy}>
          {busy ? 'সেভ হচ্ছে...' : '✓ তথ্য সেভ করুন'}
        </button>

        {/* থিম */}
        <div className="sec">থিম</div>
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 9, fontWeight: 600 }}>
            থিম বদলালে সব সদস্যের অ্যাপে বদলে যাবে
          </div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-swatch ${theme === t.id ? 'on' : ''}`}
                style={{ background: t.color }}
                onClick={() => saveTheme(t.id)}
                title={t.label}
              >
                {theme === t.id ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* রোল */}
        <div className="sec">
          সদস্য ও রোল <span>{bn(profiles.length)} জন</span>
        </div>

        {profiles.map((p) => (
          <div className="row" key={p.id}>
            <Avatar name={p.full_name} url={p.avatar_url} className={p.role === 'owner' ? 'g' : ''} />
            <div className="r-main">
              <div className="r-name">
                {p.full_name} {p.id === profile?.id ? '(আপনি)' : ''}
              </div>
              <div className="r-sub">{p.phone || 'নম্বর নেই'}</div>
            </div>
            <select
              className="input"
              style={{ width: 'auto', padding: '5px 8px', fontSize: 10.5, fontWeight: 700 }}
              value={p.role}
              onChange={(e) => changeRole(p.id, e.target.value)}
              disabled={p.id === profile?.id}
            >
              <option value="owner">সুপার অ্যাডমিন</option>
              <option value="admin">অ্যাডমিন</option>
              <option value="treasurer">কোষাধ্যক্ষ</option>
              <option value="viewer">ভিউয়ার</option>
            </select>
            {p.role !== 'owner' && (
              <button
                onClick={() => transferOwner(p.id, p.full_name)}
                title="মালিকানা দিন"
                style={{ fontSize: 14, color: 'var(--accent-ink)' }}
              >
                👑
              </button>
            )}
          </div>
        ))}

        <div className="note">
          👑 রাজার চিহ্নে চাপলে মালিকানা হস্তান্তর হবে। সভাপতি বদলালে এই পদ্ধতিতে নতুন জনকে সুপার অ্যাডমিন বানান।
        </div>

        {/* সারসংক্ষেপ */}
        <div className="sec">সর্বকালের হিসাব</div>
        <div className="two">
          <div className="mini in">
            <div className="lbl">মোট জমা</div>
            <div className="v">{taka(totalDonations)}</div>
          </div>
          <div className="mini out">
            <div className="lbl">মোট খরচ</div>
            <div className="v">{taka(totalExpenses)}</div>
          </div>
        </div>

        <button className="btn ghost" onClick={exportCsv} style={{ marginTop: 12 }}>
          📤 Excel/CSV এক্সপোর্ট
        </button>
        <button className="btn danger" onClick={signOut}>
          🚪 লগআউট
        </button>

        <div className="note" style={{ marginTop: 14 }}>
          🔐 আপনার রোল: <b>{ROLE_LABEL[role]}</b> · মাদ্রাসা: <b>{madrasa?.name}</b>
        </div>
      </div>
    </>
  )
}
