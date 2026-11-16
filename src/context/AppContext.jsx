import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { DEMO_MODE } from '../lib/db'
import * as demoStore from '../lib/demo'
import { applyTheme, storedTheme } from '../lib/themes'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [madrasa, setMadrasa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setThemeState] = useState(storedTheme())
  const [toast, setToast] = useState('')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((t) => {
    setThemeState(applyTheme(t))
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(window.__toastTimer)
    window.__toastTimer = window.setTimeout(() => setToast(''), 2600)
  }, [])

  /**
   * সবার জন্য খোলা মাদ্রাসার তথ্য (লগইন ছাড়াই পড়া যায়)।
   * এখান থেকেই থিম ও নাম আসে, তাই ভিউয়ারও অ্যাডমিনের দেওয়া থিম দেখে।
   */
  const loadPublicMadrasa = useCallback(async () => {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('madrasas')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('madrasa load', error)
      return null
    }
    setMadrasa(data || null)
    if (data?.theme) setThemeState(applyTheme(data.theme))
    return data
  }, [])

  /** অ্যাডমিন লগইন করলে তার প্রোফাইল ও মাদ্রাসা */
  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error('profile load', error)
      return null
    }
    setProfile(data || null)

    if (data?.madrasa_id) {
      const { data: m } = await supabase.from('madrasas').select('*').eq('id', data.madrasa_id).maybeSingle()
      if (m) {
        setMadrasa(m)
        if (m.theme) setThemeState(applyTheme(m.theme))
      } else {
        await loadPublicMadrasa()
      }
    } else {
      await loadPublicMadrasa()
    }
    return data
  }, [loadPublicMadrasa])

  // ---------------- ডেমো মোড (Supabase সেট করা নেই) ----------------
  useEffect(() => {
    if (!DEMO_MODE) return
    const d = demoStore.load()
    const prof = d.profiles[0]
    setSession({ user: { id: prof.id, email: 'demo@madrasa.app' } })
    setProfile(prof)
    setMadrasa(d.madrasas[0])
    setThemeState(applyTheme(d.madrasas[0].theme || 'green'))
    setLoading(false)
  }, [])

  // ---------------- আসল Supabase ----------------
  useEffect(() => {
    if (!isConfigured) return

    let alive = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      const s = data?.session ?? null
      setSession(s)
      if (s?.user) await loadProfile(s.user.id)
      else await loadPublicMadrasa()
      if (alive) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        await loadProfile(s.user.id)
      } else {
        setProfile(null)
        await loadPublicMadrasa()
      }
    })

    return () => {
      alive = false
      sub?.subscription?.unsubscribe()
    }
  }, [loadProfile, loadPublicMadrasa])

  const refresh = useCallback(async () => {
    if (DEMO_MODE) {
      const d = demoStore.load()
      setProfile(d.profiles[0])
      setMadrasa(d.madrasas[0])
      return
    }
    if (session?.user) await loadProfile(session.user.id)
    else await loadPublicMadrasa()
  }, [session, loadProfile, loadPublicMadrasa])

  // ---------------- শুধু অ্যাডমিন লগইন ----------------
  const signIn = useCallback(async (email, password) => {
    if (DEMO_MODE) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      showToast('ডেমো মোডে লগআউট নেই 🙂')
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
    await loadPublicMadrasa()
  }, [showToast, loadPublicMadrasa])

  const loggedIn = Boolean(session?.user)

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loggedIn,
      profile,
      madrasa,
      role: profile?.role ?? null,
      loading,
      theme,
      setTheme,
      signIn,
      signOut,
      refresh,
      showToast,
      toast,
      demoMode: DEMO_MODE
    }),
    [
      session,
      loggedIn,
      profile,
      madrasa,
      loading,
      theme,
      setTheme,
      signIn,
      signOut,
      refresh,
      showToast,
      toast
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
