import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useMadrasaData, monthStats, useMonthPicker } from '../lib/useData'
import { PageHeader, Modal, Avatar } from '../components/ui'
import {
  bn,
  taka,
  monthLabel,
  monthShort,
  currentMonth,
  addMonths,
  lastMonths,
  canWrite,
  ROLE_LABEL,
  groupSum
} from '../lib/utils'

export default function Home() {
  const { madrasa, profile, role, signOut, showToast } = useApp()
  const data = useMadrasaData()
  const [month, setMonth] = useMonthPicker(data)
  const [showProfile, setShowProfile] = useState(false)

  const stats = useMemo(() => monthStats(data, month || currentMonth()), [data, month])
  const months3 = useMemo(() => lastMonths(3, month || currentMonth()), [month])

  const chartData = useMemo(
    () =>
      months3.map((m) => {
        const s = monthStats(data, m)
        return { month: m, income: s.totalIn, spent: s.spent }
      }),
    [data, months3]
  )

  const maxBar = Math.max(...chartData.map((c) => Math.max(c.income, c.spent)), 1)

  const sources = useMemo(
    () => [
      { label: '👥 সদস্যদের জমা', value: stats.income, cls: '' },
      { label: '📥 বিগত মাসের বহন', value: stats.opening, cls: 'acc' }
    ],
    [stats]
  )

  const byCategory = useMemo(() => {
    const map = new Map(data.categories.map((c) => [c.id, c]))
    return groupSum(stats.expenses, (e) => e.category_id || 'none')
      .map(({ key, value }) => ({
        name: key === 'none' ? 'অন্যান্য' : map.get(key)?.name || 'অন্যান্য',
        icon: key === 'none' ? '💸' : map.get(key)?.icon || '💸',
        value
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats.expenses, data.categories])

  const latestNotice = data.notices[0]
  const writer = canWrite(role)
  const myName = profile?.full_name || 'সদস্য'

  return (
    <>
      <PageHeader
        logoUrl={madrasa?.logo_url}
        icon="🕌"
        title={madrasa?.name || 'মাদ্রাসা'}
        subtitle={month ? monthLabel(month) : '...'}
        right={
          <button className="pill" onClick={() => setShowProfile(true)}>
            {myName.split(' ')[0]}
          </button>
        }
      />

      <div className="app-body">
        {/* মাস নির্বাচন */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 11,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 13,
            padding: '6px 8px'
          }}
        >
          <button
            className="btn sm ghost"
            onClick={() => setMonth(addMonths(month || currentMonth(), -1))}
            aria-label="আগের মাস"
          >
            ‹
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 800 }}>
            {monthLabel(month || currentMonth())}
          </div>
          <button
            className="btn sm ghost"
            onClick={() => setMonth(addMonths(month || currentMonth(), 1))}
            aria-label="পরের মাস"
          >
            ›
          </button>
        </div>

        {/* মূল ব্যালেন্স */}
        <div className="hero">
          <div className="lbl">এই মাসে অবশিষ্ট</div>
          <div className="amt">{taka(stats.balance)}</div>
          <div className="sub">
            জমা {taka(stats.totalIn)} − খরচ {taka(stats.spent)}
          </div>
          <svg
            style={{ position: 'absolute', right: 10, bottom: 8, opacity: 0.5 }}
            width="86"
            height="34"
            viewBox="0 0 86 34"
            fill="none"
          >
            <path
              d="M2 26 L20 20 L38 24 L56 12 L74 15 L84 6"
              stroke="var(--primary)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="two">
          <div className="mini in">
            <div className="lbl">
              <span className="dot" style={{ background: 'var(--primary)' }} />
              মোট জমা
            </div>
            <div className="v">{taka(stats.totalIn)}</div>
          </div>
          <div className="mini out">
            <div className="lbl">
              <span className="dot" style={{ background: 'var(--danger)' }} />
              মোট খরচ
            </div>
            <div className="v">{taka(stats.spent)}</div>
          </div>
        </div>

        {writer && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Link to="/donations" className="btn" style={{ marginTop: 0 }}>
              ＋ জমা
            </Link>
            <Link to="/expenses" className="btn ghost" style={{ marginTop: 0 }}>
              ＋ খরচ
            </Link>
          </div>
        )}

        {/* ৩ মাসের চার্ট */}
        <div className="sec">
          গত ৩ মাসের তুলনা <span>{bn(3)} মাস</span>
        </div>
        <div className="card" style={{ padding: '11px 8px 9px' }}>
          <div className="chart">
            {chartData.map((c, i) => (
              <div className="cgroup" key={c.month}>
                <div className="bars">
                  <div
                    className="bar i"
                    style={{ height: Math.max(3, (c.income / maxBar) * 82) }}
                    title={`জমা ${taka(c.income)}`}
                  />
                  <div
                    className="bar e"
                    style={{ height: Math.max(3, (c.spent / maxBar) * 82) }}
                    title={`খরচ ${taka(c.spent)}`}
                  />
                </div>
                <div className={`clab ${i === chartData.length - 1 ? 'now' : ''}`}>
                  {monthShort(c.month)}
                </div>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--primary)' }} />
              জমা
            </span>
            <span>
              <i style={{ background: 'var(--danger)' }} />
              খরচ
            </span>
          </div>
        </div>

        {/* টাকা কোথা থেকে এসেছে */}
        <div className="sec">
          টাকা কোথা থেকে এসেছে <span>{taka(stats.totalIn)}</span>
        </div>
        {sources.map((s) => (
          <div className="src" key={s.label}>
            <div className="src-top">
              <span>{s.label}</span>
              <em>{taka(s.value)}</em>
            </div>
            <div className={`prog ${s.cls}`}>
              <i
                style={{
                  width: `${stats.totalIn ? Math.round((s.value / stats.totalIn) * 100) : 0}%`
                }}
              />
            </div>
          </div>
        ))}

        {/* কোথায় খরচ */}
        <div className="sec">
          টাকা কোথায় খরচ হয়েছে <span>{taka(stats.spent)}</span>
        </div>
        {byCategory.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            এই মাসে কোনো খরচ নেই
          </div>
        ) : (
          byCategory.map((c) => (
            <div className="row" key={c.name}>
              <div className="av r">{c.icon}</div>
              <div className="r-main">
                <div className="r-name">{c.name}</div>
                <div className="r-sub">
                  মোট খরচের {bn(stats.spent ? Math.round((c.value / stats.spent) * 100) : 0)}%
                </div>
                <div className="prog red">
                  <i
                    style={{
                      width: `${stats.spent ? Math.round((c.value / stats.spent) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="r-amt red" style={{ marginLeft: 10 }}>
                {taka(c.value)}
              </div>
            </div>
          ))
        )}

        {/* নোটিশ */}
        {latestNotice && (
          <Link to="/notices">
            <div className="notice">
              <div className="ic">📢</div>
              <div>
                <div className="t">{latestNotice.title}</div>
                <div className="d">{latestNotice.body}</div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {showProfile && (
        <Modal title="আমার প্রোফাইল" onClose={() => setShowProfile(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Avatar name={myName} url={profile?.avatar_url} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{myName}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {ROLE_LABEL[role] || 'সদস্য'} · {madrasa?.name}
              </div>
            </div>
          </div>
          <button
            className="btn danger"
            onClick={async () => {
              await signOut()
              showToast('লগআউট হয়েছে')
            }}
          >
            🚪 লগআউট
          </button>
        </Modal>
      )}
    </>
  )
}
