import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { isAdmin } from '../lib/utils'
import { Toast } from './ui'

// সবাই এগুলো দেখবে
const baseItems = [
  { to: '/', icon: '🏠', label: 'হোম', end: true },
  { to: '/donations', icon: '📥', label: 'জমা' },
  { to: '/expenses', icon: '🧾', label: 'খরচ' },
  { to: '/notices', icon: '📢', label: 'নোটিশ' }
]

export default function Layout() {
  const { role } = useApp()
  const admin = isAdmin(role)

  // ভিউয়ার: হোম · জমা · খরচ · নোটিশ · সদস্য
  // অ্যাডমিন: হোম · জমা · খরচ · নোটিশ · আরও (ভেতরে সদস্য + সেটিংস)
  const items = admin
    ? [...baseItems, { to: '/more', icon: '⚙️', label: 'আরও' }]
    : [...baseItems, { to: '/members', icon: '👥', label: 'সদস্য' }]

  return (
    <div className="app">
      <Outlet />
      <nav className="nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => (isActive ? 'on' : '')}
          >
            <i>{it.icon}</i>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast />
    </div>
  )
}
