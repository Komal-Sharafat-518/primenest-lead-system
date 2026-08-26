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

function formatDateTime(value) {
  if (!value) return null
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function daysSince(value) {
  if (!value) return null
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function LeadDetailsModal({ lead, onClose, onStatusChange }) {
  if (!lead) return null

  const sentAt = formatDateTime(lead.last_followup_sent_at)
  const daysAgo = daysSince(lead.last_followup_sent_at)
  const isClosed = ['won', 'lost', 'opted_out'].includes(lead.status)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className={classBadge(lead.classification)}>{lead.classification || 'Pending'}</span>
            <h2>{lead.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <span className="modal-label">Contact</span>
          <p>{lead.email}{lead.phone && ` · ${lead.phone}`}</p>
        </div>

        <div className="modal-section">
          <span className="modal-label">Full Message</span>
          <p className="modal-message">{lead.message}</p>
        </div>

        <div className="modal-section modal-score-row">
          <div>
            <span className="modal-label">Score</span>
            <p className="modal-score">{lead.score !== null ? lead.score : '—'}</p>
          </div>
          <div>
            <span className="modal-label">Received</span>
            <p>{formatDateTime(lead.created_at)}</p>
          </div>
        </div>

        <div className="modal-section">
          <span className="modal-label">AI Reasoning</span>
          <p>{lead.ai_summary || 'Not yet classified.'}</p>
        </div>

        <div className="modal-section">
          <span className="modal-label">Follow-up History</span>
          {sentAt ? (
            <p>
              Last automated follow-up sent <strong>{sentAt}</strong> ({daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`})
            </p>
          ) : (
            <p>
              {isClosed
                ? 'No follow-up sent — lead is closed, so it was never queued.'
                : lead.classification === 'HOT'
                ? 'No follow-up sent — HOT leads are handled directly, not by the automated nudge sequence.'
                : 'No follow-up sent yet. Will be picked up on the next scheduled run.'}
            </p>
          )}
        </div>

        <div className="modal-section">
          <span className="modal-label">Status</span>
          <select
            className={`status-select status-${lead.status || 'new'}`}
            value={lead.status || 'new'}
            onChange={(e) => onStatusChange(lead.id, e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function LeadsTable({ leads, loading, error, filter, setFilter, counts, onStatusChange, search, setSearch }) {
  const [selectedLead, setSelectedLead] = useState(null)

  const filteredLeads = leads
    .filter((l) => filter === 'ALL' || l.classification === filter)
    .filter((l) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      )
    })

  // Keep the modal's data fresh if leads refetch while it's open
  const modalLead = selectedLead ? leads.find((l) => l.id === selectedLead.id) || selectedLead : null

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

      <input
        type="text"
        className="search-input"
        placeholder="Search by name, email, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="state-msg">Loading leads…</p>}
      {error && <p className="state-msg error">Couldn't load leads: {error}</p>}
      {!loading && !error && filteredLeads.length === 0 && <p className="state-msg">No leads match this view.</p>}

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
                <tr key={lead.id} className="lead-row" onClick={() => setSelectedLead(lead)}>
                  <td className="cell-name">{lead.name}</td>
                  <td className="cell-contact">
                    <span>{lead.email}</span>
                    {lead.phone && <span className="phone">{lead.phone}</span>}
                  </td>
                  <td className="cell-message">{lead.message}</td>
                  <td className="cell-score">{lead.score !== null ? lead.score : '—'}</td>
                  <td><span className={classBadge(lead.classification)}>{lead.classification || 'Pending'}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
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

      <LeadDetailsModal
        lead={modalLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={onStatusChange}
      />
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
  const [search, setSearch] = useState('')
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
    const previous = leads.find((l) => l.id === leadId)?.status
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))

    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId)
      .select()

    if (error || !data || data.length === 0) {
      console.error('Status update failed or was blocked:', error?.message || 'No rows updated (check RLS policy)')
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: previous } : l)))
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
          search={search} setSearch={setSearch}
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