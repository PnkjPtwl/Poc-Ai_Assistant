import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { flowsApi } from '../api/client'
import { GitBranch, Users, Zap, Play, Pause, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const triggerIcons: Record<string, string> = { deal_stage_change: '🔄', time_elapsed: '⏱️', email_opened: '📧', email_replied: '💬', manual: '👤' }

export default function Flows() {
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadFlows() }, [filter])

  const loadFlows = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filter) params.status = filter
      const res = await flowsApi.list(params)
      setFlows(res.data || [])
    } catch { toast.error('Failed to load flows') }
    setLoading(false)
  }

  const statusBadge: Record<string, { bg: string; color: string }> = {
    active: { bg: '#dcfce7', color: '#166534' },
    paused: { bg: '#fef3c7', color: '#92400e' },
    draft: { bg: '#e2e8f0', color: '#475569' },
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>Flows</h1>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
          {['', 'active', 'paused', 'draft'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize"
              style={{
                background: filter === s ? 'white' : 'transparent',
                color: filter === s ? '#4648d4' : '#767586',
                boxShadow: filter === s ? '0 2px 8px rgba(70,72,212,0.1)' : 'none',
              }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {flows.map(flow => {
            const badge = statusBadge[flow.status] || statusBadge.draft
            return (
              <div key={flow.id} className="glass-card p-6 transition-all group hover:-translate-y-0.5" style={{ borderRadius: 20 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(107,56,212,0.12), rgba(70,72,212,0.12))', border: '1px solid rgba(107,56,212,0.2)' }}>
                    <GitBranch size={20} style={{ color: '#6b38d4' }} />
                  </div>
                  <span className="badge" style={{ background: badge.bg, color: badge.color }}>{flow.status}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111c2d', marginBottom: 4 }}>{flow.name}</h3>
                <p style={{ fontSize: 12, color: '#767586', marginBottom: 16 }} className="line-clamp-2">{flow.description}</p>
                <div className="flex items-center gap-4 mb-4" style={{ fontSize: 12, color: '#767586' }}>
                  <span className="flex items-center gap-1">{triggerIcons[flow.trigger_type] || '⚡'} {flow.trigger_type?.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1"><FileText size={12} /> {flow.step_count || 0} steps</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {flow.enrollment_count || 0}</span>
                </div>
                {flow.plays && <p style={{ fontSize: 11, color: '#767586', marginBottom: 12 }}>Play: <span style={{ color: '#464554', fontWeight: 500 }}>{flow.plays.name}</span></p>}
                <Link to={`/flows/${flow.id}`} className="btn-secondary w-full flex items-center justify-center text-xs no-underline">
                  View Details
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
