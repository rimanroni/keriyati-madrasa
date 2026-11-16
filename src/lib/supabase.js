import { createClient } from '@supabase/supabase-js'

const env = import.meta.env

// URL ঠিক করা (শেষের / বাদ দেওয়া)
const url = String(env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')

// পুরোনো (anon key) ও নতুন (publishable key) — দুই ফরম্যাটই চলবে
const key = String(
  env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim()

export const isConfigured = Boolean(url.startsWith('http') && key.length > 20)

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

if (!isConfigured && import.meta.env.DEV) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY পাওয়া যায়নি — ডেমো মোডে চলছে।'
  )
}
