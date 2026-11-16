import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useMadrasaData, useMonthPicker } from '../lib/useData'
import { db } from '../lib/db'
import { PageHeader, Modal, Avatar, Empty } from '../components/ui'
import {
  bn,
  taka,
  money,
  monthLabel,
  currentMonth,
  addMonths,
  canWrite,
  METHOD_LABEL,
  bnDate,
  waLink,
  thankYouMessage
} from '../lib/utils'

export default function Donations() {
  const { madrasa, profile, role, showToast } = useApp()
  const data = useMadrasaData()
  const [month, setMonth] = useMonthPicker(data)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    member_id: '',
    donor_name: '',
    amount: '',
    method: 'cash',
    donated_on: new Date().toISOString().slice(0, 10),
    note: ''
  })

  const list = useMemo(() => {
    return data.donations
      .filter((d) => d.month === month)
      .filter((d) => !q || d.donor_name.toLowerCase().includes(q.toLowerCase()))
  }, [data.donations, month, q])

  const total = list.reduce((s, d) => s + Number(d.amount), 0)
  const writer = canWrite(role)

  function openAdd() {
    setForm({
      member_id: '',
      donor_name: '',
      amount: '',
      method: 'cash',
      donated_on: new Date().toISOString().slice(0, 10),
      note: ''
    })
    setOpen(true)
  }

  function pickMember(id) {
    const m = data.members.find((x) => x.id === id)
    setForm((f) => ({ ...f, member_id: id, donor_name: m?.full_name || f.donor_name }))
  }

  async function save() {
    if (!form.donor_name.trim()) return showToast('দাতার নাম লিখুন')
    if (!Number(form.amount)) return showToast('টাকার পরিমাণ লিখুন')
    setBusy(true)
    try {
      await db.insert('donations', {
        madrasa_id: madrasa.id,
        member_id: form.member_id || null,
        donor_name: form.donor_name.trim(),
        amount: Number(form.amount),
        method: form.method,
        month,
        donated_on: form.donated_on,
        note: form.note || null,
        created_by: profile?.id
      })
      await data.reload()
      setOpen(false)
      showToast('✅ জমা যোগ হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('এই জমাটি মুছে ফেলবেন?')) return
    await db.remove('donations', id)
    await data.reload()
    showToast('মুছে ফেলা হয়েছে')
  }

  function whatsapp(d) {
    const member = data.members.find((m) => m.id === d.member_id)
    const text = thankYouMessage(madrasa?.name, d.donor_name, d.amount, d.month)
    const link = waLink(member?.phone, text)
    window.open(link, '_blank')
  }

  return (
    <>
      <PageHeader
        icon="📥"
        title="জমার তালিকা"
        subtitle={`${monthLabel(month)} · ${bn(list.length)} জন`}
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
            marginBottom: 10,
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

        <input
          className="input"
          style={{ marginBottom: 11 }}
          placeholder="🔍 নাম দিয়ে খুঁজুন..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {data.loading ? (
          <Empty icon="⏳" text="লোড হচ্ছে..." />
        ) : list.length === 0 ? (
          <Empty icon="📭" title="এই মাসে কোনো জমা নেই" text={writer ? 'উপরে ＋ যোগ চাপুন' : ''} />
        ) : (
          list.map((d) => (
            <div className="row" key={d.id}>
              <Avatar name={d.donor_name} />
              <div className="r-main">
                <div className="r-name">{d.donor_name}</div>
                <div className="r-sub">
                  {METHOD_LABEL[d.method] || d.method} · {bnDate(d.donated_on)}
                </div>
              </div>
              <div className="r-amt">{taka(d.amount)}</div>
              <button className="btn sm wa" onClick={() => whatsapp(d)} title="WhatsApp">
                💬
              </button>
              {writer && (
                <button
                  onClick={() => remove(d.id)}
                  style={{ color: 'var(--danger)', fontSize: 14, padding: '0 2px' }}
                  title="মুছুন"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}

        {list.length > 0 && (
          <div
            style={{
              background: 'var(--primary-dark)',
              color: '#fff',
              borderRadius: 13,
              padding: '12px 15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              fontWeight: 700,
              marginTop: 6
            }}
          >
            <span>সর্বমোট জমা</span>
            <b style={{ fontSize: 15 }}>{taka(total)}</b>
          </div>
        )}
      </div>

      {open && (
        <Modal title="নতুন জমা যোগ করুন" onClose={() => setOpen(false)}>
          <div className="field">
            <label>সদস্য নির্বাচন (ঐচ্ছিক)</label>
            <select className="input" value={form.member_id} onChange={(e) => pickMember(e.target.value)}>
              <option value="">— নতুন / তালিকায় নেই —</option>
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>দাতার নাম</label>
            <input
              className="input"
              value={form.donor_name}
              onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
              placeholder="নাম লিখুন"
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
            <label>মাধ্যম</label>
            <select
              className="input"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              {Object.entries(METHOD_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>তারিখ</label>
            <input
              className="input"
              type="date"
              value={form.donated_on}
              onChange={(e) => setForm({ ...form, donated_on: e.target.value })}
            />
          </div>

          <div className="field">
            <label>নোট (ঐচ্ছিক)</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="যেমন: অফিস থেকে"
            />
          </div>

          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'সেভ হচ্ছে...' : '✓ সেভ করুন'}
          </button>
          <div className="note">
            📅 জমাটি <b>{monthLabel(month)}</b> মাসে যুক্ত হবে। ভিন্ন মাস চাইলে আগে মাস বদলান।
          </div>
        </Modal>
      )}
    </>
  )
}
