// অ্যাপের থিমগুলো — অ্যাডমিন সেটিংস থেকে বদলাতে পারবে
export const THEMES = [
  { id: 'green', label: 'সবুজ', color: '#0e7a5f' },
  { id: 'blue', label: 'নীল', color: '#1d4ed8' },
  { id: 'maroon', label: 'মেরুন', color: '#9f1239' },
  { id: 'purple', label: 'বেগুনি', color: '#6d28d9' },
  { id: 'dark', label: 'রাত', color: '#16211d' }
]

export const DEFAULT_THEME = 'green'

export function applyTheme(theme) {
  const id = THEMES.some((t) => t.id === theme) ? theme : DEFAULT_THEME
  document.documentElement.setAttribute('data-theme', id)
  const meta = document.querySelector('meta[name="theme-color"]')
  const t = THEMES.find((x) => x.id === id)
  if (meta && t) meta.setAttribute('content', t.color)
  try {
    localStorage.setItem('madrasa-theme', id)
  } catch {
    /* ignore */
  }
  return id
}

export function storedTheme() {
  try {
    return localStorage.getItem('madrasa-theme') || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}
