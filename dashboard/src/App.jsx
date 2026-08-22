import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function classBadge(classification) {
  if (!classification) return 'badge badge-none'
  return `badge badge-${classification.toLowerCase()}`
}

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setLeads(data)
      setError(null)
    }
    setLoading(false)
  }

  const filteredLeads =
    filter === 'ALL' ? leads : leads.filter((l) => l.classification === filter)

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
        <button className="refresh-btn" onClick={fetchLeads}>
          Refresh
        </button>
      </header>

      <div className="stat-row">
        <button
          className={`stat-card stat-all ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          <span className="stat-num">{leads.length}</span>
          <span className="stat-label">All leads</span>
        </button>
        <button
          className={`stat-card stat-hot ${filter === 'HOT' ? 'active' : ''}`}
          onClick={() => setFilter('HOT')}
        >
          <span className="stat-num">{counts.HOT}</span>
          <span className="stat-label">Hot</span>
        </button>
        <button
          className={`stat-card stat-warm ${filter === 'WARM' ? 'active' : ''}`}
          onClick={() => setFilter('WARM')}
        >
          <span className="stat-num">{counts.WARM}</span>
          <span className="stat-label">Warm</span>
        </button>
        <button
          className={`stat-card stat-cold ${filter === 'COLD' ? 'active' : ''}`}
          onClick={() => setFilter('COLD')}
        >
          <span className="stat-num">{counts.COLD}</span>
          <span className="stat-label">Cold</span>
        </button>
      </div>

      {loading && <p className="state-msg">Loading leads…</p>}
      {error && <p className="state-msg error">Couldn't load leads: {error}</p>}

      {!loading && !error && filteredLeads.length === 0 && (
        <p className="state-msg">No leads in this view yet.</p>
      )}

      {!loading && !error && filteredLeads.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Score</th>
                <th>Status</th>
                <th>AI Summary</th>
                <th>Received</th>
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
                  <td className="cell-score">
                    {lead.score !== null ? lead.score : '—'}
                  </td>
                  <td>
                    <span className={classBadge(lead.classification)}>
                      {lead.classification || 'Pending'}
                    </span>
                  </td>
                  <td className="cell-summary">{lead.ai_summary || '—'}</td>
                  <td className="cell-date">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App