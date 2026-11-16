import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import AdminLogin from './pages/AdminLogin'
import Home from './pages/Home'
import Donations from './pages/Donations'
import Expenses from './pages/Expenses'
import Notices from './pages/Notices'
import More from './pages/More'
import Members from './pages/Members'
import Settings from './pages/Settings'
import { isAdmin } from './lib/utils'

function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--muted)',
        fontSize: 13,
        fontWeight: 700
      }}
    >
      ⏳ লোড হচ্ছে...
    </div>
  )
}

export default function App() {
  const { loading, role, loggedIn, profile } = useApp()
  const [grace, setGrace] = useState(false)

  // লগইনের পর প্রোফাইল আসতে এক মুহূর্ত লাগে — ততক্ষণ লোডিং দেখাই
  // (৩ সেকেন্ডেও না এলে আটকে না রেখে এগিয়ে যাই)
  useEffect(() => {
    if (!loggedIn || profile) {
      setGrace(false)
      return
    }
    const t = window.setTimeout(() => setGrace(true), 3000)
    return () => window.clearTimeout(t)
  }, [loggedIn, profile])

  if (loading || (loggedIn && !profile && !grace)) return <Loading />

  const admin = isAdmin(role)

  return (
    <Routes>
      {/* অ্যাডমিনের আলাদা লগইন — সবার অ্যাপের বাইরে */}
      <Route path="admin" element={admin ? <Navigate to="/settings" replace /> : <AdminLogin />} />

      {/* সবার জন্য খোলা অ্যাপ (লগইন লাগে না) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="donations" element={<Donations />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="notices" element={<Notices />} />
        <Route path="members" element={<Members />} />
        <Route path="more" element={admin ? <More /> : <Navigate to="/" replace />} />
        <Route path="settings" element={admin ? <Settings /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
