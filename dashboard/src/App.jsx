import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import './App.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const CLASS_COLORS = { HOT: '#A44A3F', WARM: '#B08D57', COLD: '#4B6B8A' }
const STATUS_OPTIONS = ['new', 'contacted', 'replied', 'opted_out', 'won', 'lost']

function classBadge(classification) {
  if (!classification) return 'badge badge-none'
  return `badge badge-${classification.toLowerCase()}`
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Incorrect email or password.')
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="eyebrow">PrimeNest Realty</span>
        <h1>Staff Login</h1>
        <p className="login-sub">Sign in to view leads.</p>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function LeadsTable({ leads, loading, error, filter, setFilter, counts, onStatusChange }) {
  const filteredLeads = filter === 'ALL' ? leads : leads.filter((l) => l.classification === filter)

  return (
    <>
      <div className="stat-row">
        <button className={`stat-card stat-all ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
          <span className="stat-num">{leads.length}</span>
          <span className="stat-label">All leads</span>
        </button>
        <button className={`stat-card stat-hot ${filter === 'HOT' ? 'active' : ''}`} onClick={() => setFilter('HOT')}>
          <span className="stat-num">{counts.HOT}</span>
          <span className="stat-label">Hot</span>
        </button>
        <button className={`stat-card stat-warm ${filter === 'WARM' ? 'active' : ''}`} onClick={() => setFilter('WARM')}>
          <span className="stat-num">{counts.WARM}</span>
          <span className="stat-label">Warm</span>
        </button>
        <button className={`stat-card stat-cold ${filter === 'COLD' ? 'active' : ''}`} onClick={() => setFilter('COLD')}>
          <span className="stat-num">{counts.COLD}</span>
          <span className="stat-label">Cold</span>
        </button>
      </div>

      {loading && <p className="state-msg">Loading leads…</p>}
      {error && <p className="state-msg error">Couldn't load leads: {error}</p>}
      {!loading && !error && filteredLeads.length === 0 && <p className="state-msg">No leads in this view yet.</p>}

      {!loading && !error && filteredLeads.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Contact</th><th>Message</th><th>Score</th>
                <th>Classification</th><th>Status</th><th>AI Summary</th><th>Received</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="cell-name">{lead.name}</td>
                  <td className="cell-contact">
                    <span>{lead.email}</span>
                    {lead.phone && <span className="phone">{lead.phone}</span>}
                  </td>
                  <td className="cell-message">{lead.message}</td>
                  <td className="cell-score">{lead.score !== null ? lead.score : '—'}</td>
                  <td><span className={classBadge(lead.classification)}>{lead.classification || 'Pending'}</span></td>
                  <td>
                    <select
                      className={`status-select status-${lead.status || 'new'}`}
                      value={lead.status || 'new'}
                      onChange={(e) => onStatusChange(lead.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="cell-summary">{lead.ai_summary || '—'}</td>
                  <td className="cell-date">
                    {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function AnalyticsView({ leads, counts }) {
  const avgScore = useMemo(() => {
    const scored = leads.filter((l) => l.score !== null)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((sum, l) => sum + l.score, 0) / scored.length)
  }, [leads])

  const funnelData = [
    { name: 'Cold', count: counts.COLD, fill: CLASS_COLORS.COLD },
    { name: 'Warm', count: counts.WARM, fill: CLASS_COLORS.WARM },
    { name: 'Hot', count: counts.HOT, fill: CLASS_COLORS.HOT },
  ]

  const pieData = funnelData.filter((d) => d.count > 0)

  const dailyData = useMemo(() => {
    const byDay = {}
    leads.forEach((l) => {
      const day = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      byDay[day] = (byDay[day] || 0) + 1
    })
    return Object.entries(byDay).map(([day, count]) => ({ day, count })).slice(-14)
  }, [leads])

  if (leads.length === 0) {
    return <p className="state-msg">No data yet — analytics will appear once leads come in.</p>
  }

  return (
    <div className="analytics">
      <div className="analytics-top">
        <div className="metric-card">
          <span className="metric-num">{avgScore}</span>
          <span className="metric-label">Average lead score</span>
        </div>
        <div className="metric-card">
          <span className="metric-num">{leads.length > 0 ? Math.round((counts.HOT / leads.length) * 100) : 0}%</span>
          <span className="metric-label">Leads classified Hot</span>
        </div>
        <div className="metric-card">
          <span className="metric-num">{leads.length}</span>
          <span className="metric-label">Total leads captured</span>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Leads by classification</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,36,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 12.5, fill: '#4B5D52' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5D52' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 4, border: '1px solid rgba(30,42,36,0.1)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Classification mix</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 4, border: '1px solid rgba(30,42,36,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-wide">
          <h3>Leads received over time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,36,0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#4B5D52' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5D52' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 4, border: '1px solid rgba(30,42,36,0.1)' }} />
              <Line type="monotone" dataKey="count" stroke="#B08D57" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ onLogout }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [tab, setTab] = useState('leads')

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else { setLeads(data); setError(null) }
    setLoading(false)
  }

  async function handleStatusChange(leadId, newStatus) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
    if (error) {
      console.error('Failed to update status:', error.message)
      fetchLeads()
    }
  }

  const counts = {
    HOT: leads.filter((l) => l.classification === 'HOT').length,
    WARM: leads.filter((l) => l.classification === 'WARM').length,
    COLD: leads.filter((l) => l.classification === 'COLD').length,
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <span className="eyebrow">PrimeNest Realty</span>
          <h1>Lead Dashboard</h1>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchLeads}>Refresh</button>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'leads' ? 'active' : ''}`} onClick={() => setTab('leads')}>Leads</button>
        <button className={`tab-btn ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
      </div>

      {tab === 'leads' && (
        <LeadsTable
          leads={leads} loading={loading} error={error}
          filter={filter} setFilter={setFilter} counts={counts}
          onStatusChange={handleStatusChange}
        />
      )}
      {tab === 'analytics' && <AnalyticsView leads={leads} counts={counts} />}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() { await supabase.auth.signOut() }

  if (checking) return null
  if (!session) return <LoginPage />
  return <Dashboard onLogout={handleLogout} />
}

export default App