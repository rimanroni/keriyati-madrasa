import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useMadrasaData } from '../lib/useData'
import { db } from '../lib/db'
import { PageHeader, Modal, Avatar, Empty } from '../components/ui'
import { bn, taka, waLink, money, initials, canWrite } from '../lib/utils'

export default function Members() {
  const { madrasa, role, showToast } = useApp()
  const writer = canWrite(role)
  const data = useMadrasaData()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState(null)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ full_name: '', phone: '', avatar_url: '', note: '' })

  // প্রতি সদস্যের মোট দান
  const totals = useMemo(() => {
    const map = new Map()
    for (const d of data.donations) {
      if (!d.member_id) continue
      map.set(d.member_id, (map.get(d.member_id) || 0) + Number(d.amount))
    }
    return map
  }, [data.donations])

  const list = useMemo(
    () =>
      data.members
        .filter((m) => !q || m.full_name.toLowerCase().includes(q.toLowerCase()) || (m.phone || '').includes(q))
        .sort((a, b) => (totals.get(b.id) || 0) - (totals.get(a.id) || 0)),
    [data.members, q, totals]
  )

  function openAdd() {
    setEditId(null)
    setForm({ full_name: '', phone: '', avatar_url: '', note: '' })
    setOpen(true)
  }

  function openEdit(m) {
    setEditId(m.id)
    setForm({ full_name: m.full_name, phone: m.phone || '', avatar_url: m.avatar_url || '', note: m.note || '' })
    setOpen(true)
  }

  async function save() {
    if (!form.full_name.trim()) return showToast('নাম লিখুন')
    setBusy(true)
    try {
      const payload = {
        madrasa_id: madrasa.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        note: form.note.trim() || null
      }
      if (editId) await db.update('members', editId, payload)
      else await db.insert('members', payload)
      await data.reload()
      setOpen(false)
      showToast(editId ? '✅ আপডেট হয়েছে' : '✅ সদস্য যোগ হয়েছে')
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('সদস্যটি মুছে ফেলবেন? (তার জমার হিসাব থাকবে)')) return
    await db.remove('members', id)
    await data.reload()
    showToast('মুছে ফেলা হয়েছে')
  }

  function wa(m) {
    const total = totals.get(m.id) || 0
    const text = `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ।

${m.full_name} ভাই,
${madrasa?.name || 'মাদ্রাসা'}-এ আপনার মোট জমা ${money(total)} টাকা।
আল্লাহ তাআলা আপনার দান কবুল করুন।

জাযাকাল্লাহু খাইরান।`
    window.open(waLink(m.phone, text), '_blank')
  }

  return (
    <>
      <PageHeader
        icon="👥"
        title={writer ? 'সদস্য ব্যবস্থাপনা' : 'সদস্য তালিকা'}
        subtitle={`মোট ${bn(list.length)} জন সদস্য`}
        right={
          writer ? (
            <button className="pill" onClick={openAdd}>
              ＋ নতুন
            </button>
          ) : (
            <div className="pill">শুধু দেখা</div>
          )
        }
      />

      <div className="app-body">
        <input
          className="input"
          style={{ marginBottom: 11 }}
          placeholder="🔍 নাম বা মোবাইল দিয়ে খুঁজুন..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {data.loading ? (
          <Empty icon="⏳" text="লোড হচ্ছে..." />
        ) : list.length === 0 ? (
          <Empty icon="👥" title="কোনো সদস্য নেই" text={writer ? 'উপরে ＋ নতুন চাপুন' : ''} />
        ) : (
          list.map((m) => (
            <div className="row" key={m.id}>
              <Avatar name={m.full_name} url={m.avatar_url} />
              <div
                className="r-main"
                onClick={writer ? () => openEdit(m) : undefined}
                style={writer ? undefined : { cursor: 'default' }}
              >
                <div className="r-name">{m.full_name}</div>
                <div className="r-sub">
                  {m.phone || 'নম্বর নেই'} · মোট {taka(totals.get(m.id) || 0)}
                </div>
              </div>
              {writer && (
                <button className="btn sm wa" onClick={() => wa(m)} title="WhatsApp">
                  💬
                </button>
              )}
              {writer && (
                <button
                  onClick={() => remove(m.id)}
                  style={{ color: 'var(--danger)', fontSize: 14, padding: '0 2px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}

        {writer ? (
          <>
            <button className="btn" onClick={openAdd}>
              👤 নতুন সদস্য তৈরি করুন
            </button>
            <div className="note">
              💬 সদস্যের পাশের সবুজ বাটনে চাপলে WhatsApp-এ ধন্যবাদ/রিমাইন্ডার মেসেজ তৈরি হবে।
            </div>
          </>
        ) : (
          <div className="note">
            🔒 সদস্য যোগ, সম্পাদনা বা মুছে ফেলা শুধু অ্যাডমিন ও কোষাধ্যক্ষ করতে পারবেন।
          </div>
        )}
      </div>

      {open && (
        <Modal title={editId ? 'সদস্য সম্পাদনা' : 'নতুন সদস্য'} onClose={() => setOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div className="av" style={{ width: 64, height: 64, borderRadius: 20, fontSize: 22 }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="" /> : initials(form.full_name || '?')}
            </div>
          </div>

          <div className="field">
            <label>নাম</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="সদস্যের নাম"
            />
          </div>

          <div className="field">
            <label>মোবাইল নম্বর</label>
            <input
              className="input"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div className="field">
            <label>ছবির লিংক (ঐচ্ছিক)</label>
            <input
              className="input"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label>নোট (ঐচ্ছিক)</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="যেমন: অফিস, এলাকা"
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
