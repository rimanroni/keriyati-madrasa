import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { DEMO_MODE, db } from '../lib/db'
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
      setMadrasa(m || null)
      if (m?.theme) setThemeState(applyTheme(m.theme))
    }
    return data
  }, [])

  // ---------------- ডেমো মোড ----------------
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
      if (alive) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        await loadProfile(s.user.id)
      } else {
        setProfile(null)
        setMadrasa(null)
      }
    })

    return () => {
      alive = false
      sub?.subscription?.unsubscribe()
    }
  }, [loadProfile])

  const refresh = useCallback(async () => {
    if (DEMO_MODE) {
      const d = demoStore.load()
      setProfile(d.profiles.find((p) => p.id === d.profiles[0].id) || d.profiles[0])
      setMadrasa(d.madrasas[0])
      return
    }
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const signIn = useCallback(async (email, password) => {
    if (DEMO_MODE) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password, fullName, phone) => {
    if (DEMO_MODE) return {}
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      showToast('ডেমো মোডে লগআউট নেই 🙂')
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
    setMadrasa(null)
  }, [showToast])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      madrasa,
      role: profile?.role ?? null,
      loading,
      theme,
      setTheme,
      signIn,
      signUp,
      signOut,
      refresh,
      showToast,
      toast,
      demoMode: DEMO_MODE
    }),
    [session, profile, madrasa, loading, theme, setTheme, signIn, signUp, signOut, refresh, showToast, toast]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
