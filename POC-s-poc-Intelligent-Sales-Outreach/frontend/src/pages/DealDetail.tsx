import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { dealsApi, aiApi } from '../api/client'
import { Briefcase, Mail, Phone, CheckSquare, Calendar, DollarSign, TrendingUp, FileText, Sparkles, X, Loader2, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'
import DealFlowsPlays from '../components/DealFlowsPlays'

const stageBadge: Record<string, { bg: string; color: string }> = {
  Prospecting: { bg: '#dbeafe', color: '#1e40af' },
  Qualification: { bg: '#cffafe', color: '#155e75' },
  Discovery: { bg: '#ede9fe', color: '#5b21b6' },
  Proposal: { bg: '#fef3c7', color: '#92400e' },
  Negotiation: { bg: '#ffedd5', color: '#9a3412' },
  'Closed Won': { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#ffdad6', color: '#93000a' },
}

const inputStyle = {
  width: '100%', height: 40, background: '#f0f3ff', border: '1px solid #c7c4d7',
  borderRadius: 10, padding: '0 12px', fontSize: 13, color: '#111c2d', outline: 'none',
}

export default function DealDetail() {
  const { id } = useParams()
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'flows'>('info')
  const [briefing, setBriefing] = useState<string | null>(null)
  const [generatingBriefing, setGeneratingBriefing] = useState(false)
  const [showBriefingModal, setShowBriefingModal] = useState(false)

  useEffect(() => { if (id) loadDeal() }, [id])

  const loadDeal = async () => {
    setLoading(true)
    try {
      const res = await dealsApi.get(id!)
      setDeal(res.data)
      setEditing({
        stage: res.data.stage, forecast_category: res.data.forecast_category,
        next_step: res.data.next_step || '', notes: res.data.notes || '', close_date: res.data.close_date || '',
      })
    } catch { toast.error('Failed to load deal') }
    setLoading(false)
  }

  const handleSave = async (field: string) => {
    try {
      await dealsApi.update(id!, { [field]: editing[field] })
      toast.success(`${field} updated`)
      loadDeal()
    } catch { toast.error('Failed to update') }
  }

  const handleGenerateBriefing = async () => {
    setShowBriefingModal(true)
    if (briefing) return
    setGeneratingBriefing(true)
    try {
      const res = await aiApi.executiveBriefing({ deal_id: id! })
      setBriefing(res.data.briefing)
      toast.success('Executive briefing generated')
    } catch {
      toast.error('Failed to generate briefing')
      setShowBriefingModal(false)
    }
    setGeneratingBriefing(false)
  }

  const timelineIcons: Record<string, any> = { email: Mail, task: CheckSquare, call: Phone }

  if (loading) return <div className="space-y-4"><div className="skeleton h-24 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" /></div>
  if (!deal) return <p style={{ color: '#767586' }}>Deal not found</p>

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="glass-card p-6" style={{ borderRadius: 24 }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>{deal.title}</h1>
            <p style={{ color: '#767586', fontSize: 14, marginTop: 4 }}>{deal.contacts?.name} · {deal.companies?.name}</p>
            <div className="flex gap-2 mt-3">
              <span className="badge" style={{ background: stageBadge[deal.stage]?.bg || '#e2e8f0', color: stageBadge[deal.stage]?.color || '#475569' }}>{deal.stage}</span>
              <span className="badge-slate badge">{deal.forecast_category}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleGenerateBriefing}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #6b38d4, #8455ef)', boxShadow: '0 4px 14px rgba(107,56,212,0.35)' }}>
              <Sparkles size={14} /> Executive Briefing
            </button>
            <Link to={`/email/compose?contact_id=${deal.contact_id}&deal_id=${deal.id}`}
              className="btn-primary flex items-center gap-2 text-sm no-underline">
              <Mail size={14} /> Compose Email
            </Link>
          </div>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Amount', value: `$${deal.amount?.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
            { label: 'Probability', value: `${deal.probability}%`, icon: TrendingUp, color: '#4648d4' },
            { label: 'Close Date', value: deal.close_date, icon: Calendar, color: '#f59e0b' },
            { label: 'Forecast', value: deal.forecast_category, icon: Briefcase, color: '#6b38d4' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-4" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
              <div className="flex items-center gap-2 mb-1">
                <item.icon size={13} style={{ color: item.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: item.color }} className="font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
        {([['info', 'Deal Info'], ['timeline', 'Timeline'], ['flows', 'Flows & Plays']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            style={{
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#4648d4' : '#767586',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(70,72,212,0.1)' : 'none',
            }}>
            {tab === 'flows' && <GitBranch size={12} />}{label}
          </button>
        ))}
      </div>

      {/* Flows & Plays Tab */}
      {activeTab === 'flows' && deal && (
        <div className="glass-card p-6" style={{ borderRadius: 20 }}>
          <DealFlowsPlays dealId={deal.id} contactId={deal.contact_id} repId={deal.rep_id} />
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Stage', field: 'stage', type: 'select', options: ['Prospecting','Qualification','Discovery','Proposal','Negotiation','Closed Won','Closed Lost'] },
            { label: 'Forecast Category', field: 'forecast_category', type: 'select', options: ['Commit','Best Case','Pipeline','Omit'] },
            { label: 'Next Step', field: 'next_step', type: 'text' },
            { label: 'Close Date', field: 'close_date', type: 'date' },
          ].map(({ label, field, type, options }) => (
            <div key={field} className="glass-card p-5" style={{ borderRadius: 20 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>{label}</label>
              {type === 'select' ? (
                <select value={editing[field]} onChange={e => setEditing(p => ({...p, [field]: e.target.value}))} onBlur={() => handleSave(field)}
                  style={{ ...inputStyle, appearance: 'auto', background: '#f0f3ff' }}>
                  {options!.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type={type} value={editing[field]} onChange={e => setEditing(p => ({...p, [field]: e.target.value}))} onBlur={() => handleSave(field)}
                  style={inputStyle} />
              )}
            </div>
          ))}
          <div className="col-span-2 glass-card p-5" style={{ borderRadius: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>Notes</label>
            <textarea value={editing.notes} onChange={e => setEditing(p => ({...p, notes: e.target.value}))} onBlur={() => handleSave('notes')} rows={4}
              style={{ width: '100%', background: '#f0f3ff', border: '1px solid #c7c4d7', borderRadius: 10, padding: 12, fontSize: 13, color: '#111c2d', outline: 'none', resize: 'none', lineHeight: 1.6 }} />
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="glass-card p-6" style={{ borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }}>Timeline</h2>
          <div className="space-y-3">
            {(deal.timeline || []).map((item: any, i: number) => {
              const Icon = timelineIcons[item.type] || FileText
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.type === 'email' ? '#e1e0ff' : item.type === 'call' ? '#dcfce7' : '#e2e8f0' }}>
                    <Icon size={14} style={{ color: item.type === 'email' ? '#4648d4' : item.type === 'call' ? '#10b981' : '#767586' }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{item.subject || item.title || item.summary || 'Activity'}</p>
                    <p style={{ fontSize: 11, color: '#767586' }}>{item.date?.split('T')[0]} · {item.type}{item.status ? ` · ${item.status}` : ''}</p>
                  </div>
                </div>
              )
            })}
            {(!deal.timeline || deal.timeline.length === 0) && <p style={{ color: '#767586', textAlign: 'center', padding: '32px 0' }}>No timeline events</p>}
          </div>
        </div>
      )}

      {/* Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowBriefingModal(false)}>
          <div className="w-[800px] max-h-[85vh] flex flex-col" style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid #c7c4d7', borderRadius: 24, boxShadow: '0 40px 80px rgba(15,23,42,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #e7eeff' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(107,56,212,0.12), rgba(132,85,239,0.12))', border: '1px solid rgba(107,56,212,0.2)' }}>
                  <Sparkles size={20} style={{ color: '#6b38d4' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d' }}>Executive Briefing</h3>
                  <p style={{ fontSize: 12, color: '#767586' }}>{deal.title} · {deal.contacts?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowBriefingModal(false)} className="p-2 rounded-xl transition-all" style={{ color: '#767586' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generatingBriefing ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 size={32} style={{ color: '#6b38d4' }} className="animate-spin" />
                  <p style={{ fontSize: 14, color: '#767586' }} className="animate-pulse">Assembling context and generating intelligence...</p>
                </div>
              ) : briefing ? (
                <div style={{ fontSize: 14, color: '#464554', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>{briefing}</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
