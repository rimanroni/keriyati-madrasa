import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useMadrasaData, monthStats, useMonthPicker } from '../lib/useData'
import { db } from '../lib/db'
import { PageHeader, Modal, Empty } from '../components/ui'
import { bn, taka, monthLabel, currentMonth, addMonths, canWrite, bnDate } from '../lib/utils'

export default function Expenses() {
  const { madrasa, profile, role, showToast } = useApp()
  const data = useMadrasaData()
  const [month, setMonth] = useMonthPicker(data)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    amount: '',
    spent_on: new Date().toISOString().slice(0, 10),
    note: ''
  })

  const stats = useMemo(() => monthStats(data, month), [data, month])
  const writer = canWrite(role)

  function openAdd() {
    setForm({
      category_id: data.categories[0]?.id || '',
      title: '',
      amount: '',
      spent_on: new Date().toISOString().slice(0, 10),
      note: ''
    })
    setOpen(true)
  }

  async function save() {
    if (!form.title.trim()) return showToast('খরচের নাম লিখুন')
    if (!Number(form.amount)) return showToast('টাকার পরিমাণ লিখুন')
    setBusy(true)
    try {
      await db.insert('expenses', {
        madrasa_id: madrasa.id,
        category_id: form.category_id || null,
        title: form.title.trim(),
        amount: Number(form.amount),
        month,
        spent_on: form.spent_on,
        note: form.note || null,
        created_by: profile?.id
      })
      await data.reload()
      setOpen(false)
      showToast('✅ খরচ যোগ হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('এই খরচটি মুছে ফেলবেন?')) return
    await db.remove('expenses', id)
    await data.reload()
    showToast('মুছে ফেলা হয়েছে')
  }

  const catMap = new Map(data.categories.map((c) => [c.id, c]))

  return (
    <>
      <PageHeader
        icon="🧾"
        title="খরচের তালিকা"
        subtitle={monthLabel(month)}
        right={
          writer ? (
            <button className="pill" onClick={openAdd}>
              ＋ যোগ
            </button>
          ) : null
        }
      />

      <div className="app-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 11,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 13,
            padding: '6px 8px'
          }}
        >
          <button className="btn sm ghost" onClick={() => setMonth(addMonths(month, -1))}>
            ‹
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 800 }}>
            {monthLabel(month)}
          </div>
          <button className="btn sm ghost" onClick={() => setMonth(addMonths(month, 1))}>
            ›
          </button>
        </div>

        <div className="two" style={{ marginTop: 0 }}>
          <div className="mini out">
            <div className="lbl">এই মাসের খরচ</div>
            <div className="v">{taka(stats.spent)}</div>
          </div>
          <div className="mini in">
            <div className="lbl">হাতে আছে</div>
            <div className="v">{taka(stats.balance)}</div>
          </div>
        </div>

        <div className="sec">
          খরচের তালিকা <span>{bn(stats.expenses.length)} টি</span>
        </div>

        {data.loading ? (
          <Empty icon="⏳" text="লোড হচ্ছে..." />
        ) : stats.expenses.length === 0 ? (
          <Empty icon="🧾" title="এই মাসে কোনো খরচ নেই" text={writer ? 'উপরে ＋ যোগ চাপুন' : ''} />
        ) : (
          stats.expenses.map((e) => (
            <div className="row" key={e.id}>
              <div className="av r">{catMap.get(e.category_id)?.icon || '💸'}</div>
              <div className="r-main">
                <div className="r-name">{e.title}</div>
                <div className="r-sub">
                  {catMap.get(e.category_id)?.name || 'অন্যান্য'} · {bnDate(e.spent_on)}
                </div>
              </div>
              <div className="r-amt red">− {taka(e.amount)}</div>
              {writer && (
                <button
                  onClick={() => remove(e.id)}
                  style={{ color: 'var(--danger)', fontSize: 14, padding: '0 2px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}

        {writer && (
          <button className="btn" onClick={openAdd}>
            ＋ নতুন খরচ যোগ করুন
          </button>
        )}

        {!writer && (
          <div className="note">🔒 শুধু অ্যাডমিন/কোষাধ্যক্ষ খরচ যোগ করতে পারবেন।</div>
        )}
      </div>

      {open && (
        <Modal title="নতুন খরচ" onClose={() => setOpen(false)}>
          <div className="field">
            <label>খাত</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">— নির্বাচন করুন —</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>খরচের বিবরণ</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="যেমন: হুজুরের বেতন"
            />
          </div>

          <div className="field">
            <label>টাকার পরিমাণ</label>
            <input
              className="input"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="০"
            />
          </div>

          <div className="field">
            <label>তারিখ</label>
            <input
              className="input"
              type="date"
              value={form.spent_on}
              onChange={(e) => setForm({ ...form, spent_on: e.target.value })}
            />
          </div>

          <div className="field">
            <label>নোট (ঐচ্ছিক)</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'সেভ হচ্ছে...' : '✓ সেভ করুন'}
          </button>
        </Modal>
      )}
    </>
  )
}
