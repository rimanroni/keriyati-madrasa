export default function Setup() {
  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="em">🕌</div>
        <h1>মাদ্রাসা হিসাব</h1>
        <p>এখনো Supabase-এর সাথে যুক্ত হয়নি</p>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>⚙️ সেটআপ করুন</div>
        <ol style={{ fontSize: 12, lineHeight: 2, paddingLeft: 18, color: 'var(--muted)' }}>
          <li>
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>{' '}
            এ ফ্রি প্রজেক্ট খুলুন
          </li>
          <li>
            SQL Editor-এ <b>supabase/schema.sql</b> চালান
          </li>
          <li>
            তারপর <b>supabase/seed.sql</b> চালান
          </li>
          <li>
            Project Settings → API থেকে <b>URL</b> ও <b>anon key</b> কপি করুন
          </li>
          <li>
            প্রজেক্টের রুটে <b>.env</b> ফাইল বানিয়ে লিখুন:
          </li>
        </ol>

        <pre
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: 11,
            fontSize: 10.5,
            lineHeight: 1.8,
            marginTop: 10,
            overflowX: 'auto',
            direction: 'ltr',
            textAlign: 'left'
          }}
        >
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>

        <div className="note" style={{ marginTop: 12 }}>
          💡 .env ফাইল বানানোর পরে ডেভ সার্ভার বন্ধ করে আবার <b>npm run dev</b> চালান।
        </div>
      </div>
    </div>
  )
}
