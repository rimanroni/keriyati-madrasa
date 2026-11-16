// =====================================================================
//  ডেমো মোড — Supabase ছাড়াই অ্যাপ চালানোর জন্য (ব্রাউজারে সেভ থাকে)
//  আসল ডেটা ব্যবহার করতে .env-এ Supabase key বসালেই ডেমো বন্ধ হবে।
// =====================================================================

const KEY = 'madrasa-demo-v2'

const uid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

export const DEMO_USER = {
  id: 'demo-user-0000-0000-000000000001',
  email: 'demo@madrasa.app'
}

const DONORS = [
  ['ফারিদ শিউলি', '01712345678', 600],
  ['গুলজার হোসেন', '01823456789', 200],
  ['মাজেদ আলী', '01934567890', 200],
  ['জুয়েল রানা', '01645678901', 100],
  ['সারোয়ার', '01756789012', 200],
  ['জয়নাল আবেদীন', '01867890123', 500],
  ['বাবু', '01978901234', 100],
  ['সাইফুল্লাহ', '01689012345', 50],
  ['সবুজ', '01790123456', 200],
  ['হাসান', '01801234567', 200],
  ['ফিরোজ', '01912345670', 50],
  ['নাম নাই', '', 100],
  ['হাসানের অফিস', '01723456781', 300],
  ['উসমান ভাই', '01834567892', 200]
]

function seed() {
  const madrasaId = uid()
  const members = DONORS.map(([name, phone]) => ({
    id: uid(),
    madrasa_id: madrasaId,
    full_name: name,
    phone: phone || null,
    avatar_url: null,
    note: null,
    is_active: true,
    created_at: new Date().toISOString()
  }))

  const categories = [
    ['হুজুরের বেতন', '👤'],
    ['বিদ্যুৎ বিল', '💡'],
    ['খাবার', '🍚'],
    ['মেরামত', '🔧'],
    ['বই ও খাতা', '📚'],
    ['অন্যান্য', '💸']
  ].map(([name, icon], i) => ({
    id: uid(),
    madrasa_id: madrasaId,
    name,
    icon,
    sort_order: i + 1
  }))

  const monthOf = (d) => d.toISOString().slice(0, 7)
  const oct = '2026-10'
  const sep = '2026-09'
  const aug = '2026-08'

  // অক্টোবর — আসল হিসাব
  const donations = DONORS.map(([name, , amount], i) => ({
    id: uid(),
    madrasa_id: madrasaId,
    member_id: members[i].id,
    donor_name: name,
    amount,
    method: 'cash',
    month: oct,
    donated_on: '2026-10-01',
    note: null,
    created_at: '2026-10-01T10:00:00Z'
  }))

  // আগস্ট ও সেপ্টেম্বর — নমুনা (চার্ট দেখানোর জন্য)
  const sample = [
    [aug, 5200, 2800],
    [sep, 5090, 2600]
  ]
  for (const [m, income, expense] of sample) {
    donations.push({
      id: uid(),
      madrasa_id: madrasaId,
      member_id: null,
      donor_name: 'মাসিক জমা (সদস্যবৃন্দ)',
      amount: income,
      method: 'cash',
      month: m,
      donated_on: `${m}-05`,
      note: 'নমুনা ডেটা',
      created_at: `${m}-05T10:00:00Z`
    })
  }

  const expenses = [
    {
      id: uid(),
      madrasa_id: madrasaId,
      category_id: categories[0].id,
      title: 'হুজুরের বেতন',
      amount: 2500,
      month: oct,
      spent_on: '2026-10-05',
      note: null,
      created_at: '2026-10-05T10:00:00Z'
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      category_id: categories[0].id,
      title: 'হুজুরের বেতন (নমুনা)',
      amount: 2600,
      month: sep,
      spent_on: '2026-09-05',
      note: null,
      created_at: '2026-09-05T10:00:00Z'
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      category_id: categories[0].id,
      title: 'হুজুরের বেতন (নমুনা)',
      amount: 2800,
      month: aug,
      spent_on: '2026-08-05',
      note: null,
      created_at: '2026-08-05T10:00:00Z'
    }
  ]

  const notices = [
    {
      id: uid(),
      madrasa_id: madrasaId,
      title: 'মাসিক সভা',
      body: 'আগামী শুক্রবার বাদ জুমা মাদ্রাসায় মাসিক সভা হবে। সব সদস্যকে উপস্থিত থাকার জন্য অনুরোধ করা হলো।',
      pinned: true,
      created_at: '2026-10-09T09:00:00Z'
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      title: 'অক্টোবরের হিসাব প্রকাশ',
      body: 'অক্টোবর মাসের জমা ও খরচের হিসাব প্রকাশ করা হয়েছে। মোট জমা ৫,৪৯০ টাকা, খরচ ২,৫০০ টাকা।',
      pinned: false,
      created_at: '2026-10-01T09:00:00Z'
    }
  ]

  const profiles = [
    {
      id: DEMO_USER.id,
      madrasa_id: madrasaId,
      full_name: 'ডেমো অ্যাডমিন',
      phone: '01700000000',
      avatar_url: null,
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      full_name: 'মোঃ রফিক (সভাপতি)',
      phone: '01811111111',
      avatar_url: null,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      full_name: 'সালাম (কোষাধ্যক্ষ)',
      phone: '01922222222',
      avatar_url: null,
      role: 'treasurer',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uid(),
      madrasa_id: madrasaId,
      full_name: 'রহিম উদ্দিন',
      phone: '01633333333',
      avatar_url: null,
      role: 'viewer',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]

  return {
    madrasas: [
      {
        id: madrasaId,
        name: 'বাইতুল আমান মাদ্রাসা',
        address: 'গ্রাম / বাজার, উপজেলা',
        phone: '01700000000',
        logo_url: null,
        theme: 'green',
        created_at: new Date().toISOString()
      }
    ],
    profiles,
    members,
    donations,
    expenses,
    expense_categories: categories,
    notices,
    opening_balances: [
      { id: uid(), madrasa_id: madrasaId, month: oct, amount: 2490 },
      { id: uid(), madrasa_id: madrasaId, month: sep, amount: 2490 },
      { id: uid(), madrasa_id: madrasaId, month: aug, amount: 2400 }
    ]
  }
}

let cache = null

export function load() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw)
      return cache
    }
  } catch {
    /* ignore */
  }
  cache = seed()
  save()
  return cache
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
}

export function resetDemo() {
  cache = seed()
  save()
  return cache
}

export function list(table) {
  const db = load()
  const rows = [...(db[table] || [])]
  if (table === 'notices') {
    rows.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return String(b.created_at).localeCompare(String(a.created_at))
    })
  } else if (table === 'members') {
    rows.sort((a, b) => a.full_name.localeCompare(b.full_name))
  } else if (table === 'donations') {
    rows.sort((a, b) => String(b.donated_on).localeCompare(String(a.donated_on)))
  } else if (table === 'expenses') {
    rows.sort((a, b) => String(b.spent_on).localeCompare(String(a.spent_on)))
  } else if (table === 'expense_categories') {
    rows.sort((a, b) => a.sort_order - b.sort_order)
  }
  return rows
}

export function insert(table, row) {
  const db = load()
  const record = { id: uid(), created_at: new Date().toISOString(), ...row }
  db[table] = [...(db[table] || []), record]
  save()
  return record
}

export function update(table, id, patch) {
  const db = load()
  db[table] = (db[table] || []).map((r) => (r.id === id ? { ...r, ...patch } : r))
  save()
  return db[table].find((r) => r.id === id)
}

export function remove(table, id) {
  const db = load()
  db[table] = (db[table] || []).filter((r) => r.id !== id)
  save()
}
