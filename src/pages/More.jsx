import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageHeader, Avatar } from '../components/ui'
import { ROLE_LABEL, bn } from '../lib/utils'

const items = [
  { to: '/members', icon: '👥', title: 'সদস্য ব্যবস্থাপনা', desc: 'সদস্য যোগ, সম্পাদনা, WhatsApp' },
  { to: '/settings', icon: '⚙️', title: 'সেটিংস', desc: 'মাদ্রাসার তথ্য, থিম, রোল' },
  { to: '/notices', icon: '📢', title: 'নোটিশ', desc: 'নোটিশ তৈরি ও দেখা' }
]

export default function More() {
  const { madrasa, profile, role, signOut, demoMode } = useApp()

  return (
    <>
      <PageHeader icon="⚙️" title="আরও" subtitle="অ্যাডমিনের জন্য" right={<div className="pill">অ্যাডমিন</div>} />

      <div className="app-body">
        {demoMode && (
          <div className="note" style={{ marginTop: 0, marginBottom: 12 }}>
            🧪 <b>ডেমো মোড</b> — এখন সব ডেটা শুধু এই ব্রাউজারে সেভ হচ্ছে।
            আসল অ্যাপ চালাতে <b>.env</b> ফাইলে Supabase URL ও anon key বসান (README দেখুন)।
          </div>
        )}

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            name={profile?.full_name}
            url={profile?.avatar_url}
            className="g"
            style={{ width: 44, height: 44, borderRadius: 14, fontSize: 16 }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {ROLE_LABEL[role]} · {madrasa?.name}
            </div>
          </div>
        </div>

        <div className="sec">ব্যবস্থাপনা</div>

        {items.map((it) => (
          <Link to={it.to} key={it.to}>
            <div className="row">
              <div className="av">{it.icon}</div>
              <div className="r-main">
                <div className="r-name">{it.title}</div>
                <div className="r-sub">{it.desc}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>›</div>
            </div>
          </Link>
        ))}

        <button className="btn danger" onClick={signOut} style={{ marginTop: 16 }}>
          🚪 লগআউট
        </button>

        <div className="note">
          সংস্করণ {bn('2.0.0')} · মাদ্রাসা হিসাব
        </div>
      </div>
    </>
  )
}
