// এক জায়গা থেকে ডেটা অ্যাক্সেস — Supabase বা ডেমো
import { supabase, isConfigured } from './supabase'
import * as demo from './demo'

export const DEMO_MODE = !isConfigured

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export const db = {
  async list(table, madrasaId) {
    if (DEMO_MODE) {
      await delay(80)
      return demo.list(table)
    }
    const { data, error } = await supabase.from(table).select('*').eq('madrasa_id', madrasaId)
    if (error) throw error
    return data || []
  },

  async insert(table, row) {
    if (DEMO_MODE) {
      await delay()
      return demo.insert(table, row)
    }
    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) throw error
    return data
  },

  async update(table, id, patch) {
    if (DEMO_MODE) {
      await delay()
      return demo.update(table, id, patch)
    }
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(table, id) {
    if (DEMO_MODE) {
      await delay()
      return demo.remove(table, id)
    }
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  },

  async getMadrasa(id) {
    if (DEMO_MODE) return demo.load().madrasas[0]
    const { data, error } = await supabase.from('madrasas').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  },

  async updateMadrasa(id, patch) {
    if (DEMO_MODE) {
      await delay()
      const m = demo.load().madrasas[0]
      return demo.update('madrasas', m.id, patch)
    }
    const { data, error } = await supabase.from('madrasas').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async listProfiles(madrasaId) {
    if (DEMO_MODE) return demo.load().profiles
    const { data, error } = await supabase.from('profiles').select('*').eq('madrasa_id', madrasaId)
    if (error) throw error
    return data || []
  },

  async updateProfile(id, patch) {
    if (DEMO_MODE) {
      await delay()
      return demo.update('profiles', id, patch)
    }
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  }
}
