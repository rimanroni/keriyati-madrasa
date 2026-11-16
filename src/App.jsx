import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
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
  const { user, loading, role, demoMode } = useApp()

  if (loading) return <Loading />
  if (!user && !demoMode) return <Login />

  const admin = isAdmin(role)

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="donations" element={<Donations />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="notices" element={<Notices />} />
        <Route path="more" element={admin ? <More /> : <Navigate to="/" replace />} />
        <Route path="members" element={admin ? <Members /> : <Navigate to="/" replace />} />
        <Route path="settings" element={admin ? <Settings /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
