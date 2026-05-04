import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { forecastApi } from '../api/client'
import { BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const stageBadge: Record<string, { bg: string; color: string }> = {
  Prospecting: { bg: '#dbeafe', color: '#1e40af' },
  Qualification: { bg: '#cffafe', color: '#155e75' },
  Discovery: { bg: '#ede9fe', color: '#5b21b6' },
  Proposal: { bg: '#fef3c7', color: '#92400e' },
  Negotiation: { bg: '#ffedd5', color: '#9a3412' },
  'Closed Won': { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#ffdad6', color: '#93000a' },
}

export default function ForecastBoard() {
  const { activeRep } = useAppStore()
  const [data, setData] = useState<any>({ deals: [], totals: {} })
  const [teamSummary, setTeamSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDeal, setEditingDeal] = useState<string | null>(null)
  const [overrideVal, setOverrideVal] = useState('')

  useEffect(() => {
    document.title = "Revenue Forecast | Vantage AI Outreach";
    loadForecast()
  }, [activeRep])

  const loadForecast = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeRep) params.rep_id = activeRep.id
      const [fcRes, summRes] = await Promise.all([forecastApi.get(params), forecastApi.summary()])
      setData(fcRes.data)
      setTeamSummary(summRes.data || [])
    } catch { toast.error('Failed to load forecast') }
    setLoading(false)
  }

  const handleCategoryChange = async (dealId: string, category: string) => {
    try {
      setData((prev: any) => ({
        ...prev,
        deals: prev.deals.map((d: any) => d.id === dealId ? { ...d, forecast_category: category } : d),
      }))
      await forecastApi.updateCategory(dealId, { forecast_category: category })
      loadForecast()
    } catch { toast.error('Failed to update category') }
  }

  const handleOverride = async (dealId: string) => {
    if (!overrideVal) return
    try {
      const deal = data.deals.find((d: any) => d.id === dealId)
      await forecastApi.updateCategory(dealId, {
        forecast_category: deal?.forecast_category || 'Pipeline',
        rep_override_amount: parseFloat(overrideVal),
      })
      toast.success('Override saved')
      setEditingDeal(null); setOverrideVal('')
      loadForecast()
    } catch { toast.error('Failed to save override') }
  }

  const totals = data.totals || {}
  const quota = activeRep?.quota || 500000
  const attainment = quota > 0 ? ((totals.Commit || 0) / quota * 100).toFixed(1) : '0'

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 w-1/3 rounded-2xl" />
      <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  )

  const metricCards = [
    { label: 'Commit', value: totals.Commit || 0, gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: '#dcfce7', textColor: '#166534' },
    { label: 'Best Case', value: totals['Best Case'] || 0, gradient: 'linear-gradient(135deg, #4648d4, #6063ee)', bg: '#e1e0ff', textColor: '#4648d4' },
    { label: 'Pipeline', value: totals.Pipeline || 0, gradient: 'linear-gradient(135deg, #767586, #464554)', bg: '#e2e8f0', textColor: '#464554' },
    { label: 'Quota', value: quota, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: '#fef3c7', textColor: '#92400e' },
    { label: 'Attainment', value: `${attainment}%`, gradient: 'linear-gradient(135deg, #6b38d4, #8455ef)', bg: '#e9ddff', textColor: '#6b38d4', isText: true },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }} className="flex items-center gap-3">
        <BarChart3 size={24} style={{ color: '#4648d4' }} /> Forecast Board
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-5 gap-4">
        {metricCards.map(c => (
          <div key={c.label} className="glass-card p-5" style={{ borderRadius: 20 }}>
            <div className="w-8 h-1.5 rounded-full mb-3" style={{ background: c.gradient }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</p>
            <p className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: c.textColor }}>
              {c.isText ? c.value : `$${((c.value as number) / 1000).toFixed(0)}k`}
            </p>
          </div>
        ))}
      </div>

      {/* Deals Table */}
      <div className="glass-card overflow-hidden" style={{ borderRadius: 20 }}>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e7eeff', background: '#f0f3ff' }}>
                {['Deal', 'Contact', 'Stage', 'Close Date', 'Amount', 'Category', 'Override'].map((h, i) => (
                  <th key={h} className={i > 3 ? 'text-right py-3 px-4' : 'text-left py-3 px-4'}
                    style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.deals || []).map((deal: any) => (
                <tr key={deal.id} style={{ borderBottom: '1px solid #f0f3ff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="py-3 px-4">
                    <Link to={`/deals/${deal.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#4648d4', textDecoration: 'none' }}>
                      {deal.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: 13, color: '#767586' }}>{deal.contacts?.name}</td>
                  <td className="py-3 px-4">
                    <span className="badge" style={{ background: stageBadge[deal.stage]?.bg || '#e2e8f0', color: stageBadge[deal.stage]?.color || '#475569' }}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 12, color: '#767586' }}>{deal.close_date}</td>
                  <td className="py-3 px-4 text-right font-mono" style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>${deal.amount?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <select value={deal.forecast_category} onChange={e => handleCategoryChange(deal.id, e.target.value)}
                      style={{ height: 32, background: '#f0f3ff', border: '1px solid #e7eeff', borderRadius: 8, padding: '0 10px', fontSize: 12, color: '#464554', outline: 'none', cursor: 'pointer' }}>
                      {['Commit', 'Best Case', 'Pipeline', 'Omit'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingDeal === deal.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input value={overrideVal} onChange={e => setOverrideVal(e.target.value)} type="number" placeholder="Amount"
                          style={{ width: 96, height: 30, background: '#f0f3ff', border: '1px solid #4648d4', borderRadius: 8, padding: '0 8px', fontSize: 12, color: '#111c2d', outline: 'none' }} autoFocus />
                        <button onClick={() => handleOverride(deal.id)} style={{ fontSize: 12, color: '#4648d4', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingDeal(deal.id)} style={{ fontSize: 12, color: '#c7c4d7', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#4648d4'}
                        onMouseLeave={e => e.currentTarget.style.color = '#c7c4d7'}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Rollup */}
      <div className="glass-card p-6" style={{ borderRadius: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 20 }}>Team Rollup</h2>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e7eeff' }}>
                {['Rep', 'Commit', 'Best Case', 'Pipeline', 'Quota', 'Attainment'].map((h, i) => (
                  <th key={h} className={i === 0 ? 'text-left py-2 px-3' : 'text-right py-2 px-3'}
                    style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamSummary.map((r: any) => (
                <tr key={r.rep?.id} style={{ borderBottom: '1px solid #f0f3ff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #4648d4, #6b38d4)' }}>
                        {r.rep?.avatar_initials}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{r.rep?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono" style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>${((r.totals?.Commit || 0) / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-3 text-right font-mono" style={{ fontSize: 13, color: '#4648d4', fontWeight: 600 }}>${((r.totals?.['Best Case'] || 0) / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-3 text-right font-mono" style={{ fontSize: 13, color: '#767586' }}>${((r.totals?.Pipeline || 0) / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-3 text-right font-mono" style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>${((r.quota || 0) / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-3 text-right font-mono" style={{ fontSize: 13, color: '#6b38d4', fontWeight: 600 }}>{r.attainment}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
