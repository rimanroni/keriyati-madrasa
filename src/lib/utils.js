// ---------- বাংলা সংখ্যা ও তারিখ ----------
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function bn(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[+d])
}

/** ৫৪৯০.৫ → "৫,৪৯০"  (দশমিক থাকলে "৫,৪৯০.৫০") */
export function money(value) {
  const n = Number(value || 0)
  const fixed = Math.round(n * 100) / 100
  const [intPart, decPart] = fixed.toFixed(2).split('.')
  const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const out = decPart === '00' ? withComma : `${withComma}.${decPart}`
  return bn(out)
}

export const taka = (v) => `৳ ${money(v)}`

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

/** '2026-10' → 'অক্টোবর ২০২৬' */
export function monthLabel(month) {
  if (!month) return ''
  const [y, m] = month.split('-')
  return `${BN_MONTHS[+m - 1] || ''} ${bn(y)}`
}

/** '2026-10' → 'অক্টো' (চার্টের জন্য ছোট) */
export function monthShort(month) {
  const full = monthLabel(month).split(' ')[0]
  return full.length > 5 ? full.slice(0, 5) : full
}

export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addMonths(month, delta) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** শেষ n মাসের লিস্ট, পুরোনো → নতুন */
export function lastMonths(n, endMonth = currentMonth()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(addMonths(endMonth, -i))
  return out
}

export function bnDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return `${bn(d.getDate())} ${monthLabel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`).split(' ')[0]}`
}

export function initials(name = '') {
  const clean = String(name).trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/)
  if (parts.length === 1) return clean.slice(0, 2)
  return (parts[0][0] || '') + (parts[1][0] || '')
}

// ---------- WhatsApp ----------
/** ফোন নম্বর ঠিক করে: 01712345678 → 8801712345678 */
export function waNumber(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return '88' + digits
  if (digits.length === 10) return '880' + digits
  return digits
}

export function waLink(phone, text) {
  const num = waNumber(phone)
  const msg = encodeURIComponent(text || '')
  return num ? `https://wa.me/${num}?text=${msg}` : `https://wa.me/?text=${msg}`
}

export function thankYouMessage(madrasaName, memberName, amount, month) {
  return `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ।

${memberName} ভাই,
${monthLabel(month)} মাসে আপনার জমা ${money(amount)} টাকা পেয়েছি।
আল্লাহ তাআলা আপনার দান কবুল করুন এবং উত্তম প্রতিদান দিন।

— ${madrasaName || 'মাদ্রাসা'}`
}

// ---------- হিসাব ----------
export function sumBy(list, key) {
  return list.reduce((s, x) => s + Number(x[key] || 0), 0)
}

export function groupSum(list, keyFn, valFn = (x) => x.amount) {
  const map = new Map()
  for (const item of list) {
    const k = keyFn(item)
    map.set(k, (map.get(k) || 0) + Number(valFn(item) || 0))
  }
  return [...map.entries()].map(([key, value]) => ({ key, value }))
}

export const ROLE_LABEL = {
  owner: 'সুপার অ্যাডমিন',
  admin: 'অ্যাডমিন',
  treasurer: 'কোষাধ্যক্ষ',
  viewer: 'ভিউয়ার'
}

export const METHOD_LABEL = {
  cash: 'নগদ',
  bkash: 'বিকাশ',
  nagad: 'নগদ (Nagad)',
  bank: 'ব্যাংক',
  other: 'অন্যান্য'
}

export function canWrite(role) {
  return ['owner', 'admin', 'treasurer'].includes(role)
}

export function isAdmin(role) {
  return ['owner', 'admin'].includes(role)
}
