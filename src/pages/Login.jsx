import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn, signUp } = useApp()
  const [mode, setMode] = useState('in') // in | up
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setOk('')
    setBusy(true)
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password)
      } else {
        if (!fullName.trim()) throw new Error('নাম লিখুন')
        if (password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
        const data = await signUp(email.trim(), password, fullName.trim(), phone.trim())
        if (!data?.session) {
          setOk('✅ অ্যাকাউন্ট তৈরি হয়েছে! ইমেইলে আসা লিংক দিয়ে ভেরিফাই করুন, তারপর লগইন করুন।')
          setMode('in')
        }
      }
    } catch (e2) {
      setErr(e2.message || 'সমস্যা হয়েছে')
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setErr('আগে ইমেইল লিখুন')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) setErr(error.message)
    else setOk('📧 পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে')
  }

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="em">🕌</div>
        <h1>মাদ্রাসা হিসাব</h1>
        <p>জমা ও খরচের পূর্ণ হিসাব, এক জায়গায়</p>
      </div>

      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}

      <form onSubmit={submit}>
        {mode === 'up' && (
          <>
            <div className="field">
              <label>আপনার নাম</label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="যেমন: আব্দুল করিম"
              />
            </div>
            <div className="field">
              <label>মোবাইল নম্বর (ঐচ্ছিক)</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
              />
            </div>
          </>
        )}

        <div className="field">
          <label>ইমেইল</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            required
          />
        </div>

        <button className="btn" disabled={busy}>
          {busy ? 'অপেক্ষা করুন...' : mode === 'in' ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}
        </button>
      </form>

      <button
        className="btn ghost"
        onClick={() => {
          setMode(mode === 'in' ? 'up' : 'in')
          setErr('')
          setOk('')
        }}
      >
        {mode === 'in' ? 'নতুন? অ্যাকাউন্ট খুলুন' : 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন'}
      </button>

      {mode === 'in' && (
        <button
          onClick={forgot}
          style={{ marginTop: 14, fontSize: 11.5, color: 'var(--muted)', fontWeight: 700 }}
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </button>
      )}

      <div className="note" style={{ marginTop: 22 }}>
        👑 <b>প্রথম যিনি অ্যাকাউন্ট খুলবেন তিনি স্বয়ংক্রিয়ভাবে সুপার অ্যাডমিন হবেন।</b>
        <br />
        বাকিরা সাইন-আপ করলে ভিউয়ার হিসেবে যুক্ত হবে — অ্যাডমিন পরে রোল বদলাতে পারবেন।
      </div>
    </div>
  )
}
