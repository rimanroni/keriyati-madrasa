import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AdminLogin() {
  const { signIn, showToast, demoMode } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      showToast('স্বাগতম, অ্যাডমিন 👑')
      navigate('/settings', { replace: true })
    } catch (e2) {
      const msg = String(e2?.message || '')
      if (msg.toLowerCase().includes('invalid login')) setErr('ইমেইল বা পাসওয়ার্ড ভুল')
      else if (msg.toLowerCase().includes('email not confirmed'))
        setErr('ইমেইল ভেরিফাই করা হয়নি — Supabase-এ Confirm email বন্ধ করুন')
      else setErr(msg || 'লগইন হয়নি')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <Link
        to="/"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--muted)',
          marginBottom: 26,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        ‹ অ্যাপে ফিরে যান
      </Link>

      <div className="login-hero">
        <div className="em">🔐</div>
        <h1>অ্যাডমিন লগইন</h1>
        <p>শুধু অ্যাডমিনের জন্য</p>
      </div>

      {demoMode && (
        <div className="note" style={{ marginBottom: 12 }}>
          🧪 ডেমো মোডে তুমি আগেই অ্যাডমিন। আসল লগইন চালু হবে Supabase যুক্ত হলে।
        </div>
      )}

      {err && <div className="err">{err}</div>}

      <form onSubmit={submit}>
        <div className="field">
          <label>ইমেইল</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label>পাসওয়ার্ড</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn" disabled={busy}>
          {busy ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
        </button>
      </form>

      <div className="note" style={{ marginTop: 18 }}>
        👥 <b>সাধারণ সদস্যদের কোনো লগইন লাগবে না।</b> তারা অ্যাপ খুললেই সব হিসাব, সদস্য তালিকা ও
        নোটিশ দেখতে পাবে — শুধু দেখতে, বদলাতে পারবে না।
        <br />
        <br />
        🔑 অ্যাডমিন অ্যাকাউন্ট বানাতে হবে Supabase → <b>Authentication → Users → Add user</b> থেকে।
      </div>
    </div>
  )
}
