import { useCallback, useEffect, useState } from 'react'
import { db } from './db'
import { currentMonth } from './utils'
import { useApp } from '../context/AppContext'

const EMPTY = {
  donations: [],
  expenses: [],
  openings: [],
  notices: [],
  members: [],
  categories: []
}

const TABLES = {
  donations: 'donations',
  expenses: 'expenses',
  openings: 'opening_balances',
  notices: 'notices',
  members: 'members',
  categories: 'expense_categories'
}

export function useMadrasaData() {
  const { madrasa } = useApp()
  const id = madrasa?.id
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [donations, expenses, openings, notices, members, categories] = await Promise.all([
        db.list(TABLES.donations, id),
        db.list(TABLES.expenses, id),
        db.list(TABLES.openings, id),
        db.list(TABLES.notices, id),
        db.list(TABLES.members, id),
        db.list(TABLES.categories, id)
      ])
      setData({ donations, expenses, openings, notices, members, categories })
    } catch (e) {
      console.error(e)
      setError(e.message || 'ডেটা আনতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { ...data, loading, error, reload: load }
}

/** নির্দিষ্ট মাসের হিসাব */
export function monthStats(data, month) {
  const donations = data.donations.filter((d) => d.month === month)
  const expenses = data.expenses.filter((e) => e.month === month)
  const openingRow = data.openings.find((o) => o.month === month)
  const opening = Number(openingRow?.amount || 0)
  const income = donations.reduce((s, d) => s + Number(d.amount), 0)
  const spent = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalIn = opening + income
  return {
    donations,
    expenses,
    opening,
    income,
    spent,
    totalIn,
    balance: totalIn - spent
  }
}

/**
 * মাস নির্বাচন — প্রথমবার ডেটার সর্বশেষ মাসটাই বেছে নেয়।
 * ইউজার নিজে বদলালে আর অটো-বদল হয় না।
 */
export function useMonthPicker(data) {
  const [month, setMonthState] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (touched || data.loading) return
    const months = [
      ...data.donations.map((d) => d.month),
      ...data.expenses.map((e) => e.month)
    ].filter(Boolean)
    if (months.length) {
      months.sort()
      setMonthState(months[months.length - 1])
    } else {
      setMonthState(currentMonth())
    }
  }, [touched, data.loading, data.donations, data.expenses])

  const setMonth = useCallback((m) => {
    setTouched(true)
    setMonthState(m)
  }, [])

  return [month || currentMonth(), setMonth]
}
