import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { playsApi } from '../api/client'
import { Target, GitBranch, BookOpen, Clock, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

const typeGradients: Record<string, string> = {
  'Cold Outreach': 'linear-gradient(135deg, #4648d4, #06b6d4)',
  Onboarding: 'linear-gradient(135deg, #10b981, #059669)',
  Upsell: 'linear-gradient(135deg, #6b38d4, #8455ef)',
  'Re-Engagement': 'linear-gradient(135deg, #f59e0b, #ea580c)',
  'Cross-Sell': 'linear-gradient(135deg, #ec4899, #f43f5e)',
  Renewal: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
}

export default function Plays() {
  const [plays, setPlays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPlays() }, [])

  const loadPlays = async () => {
    setLoading(true)
    try {
      const res = await playsApi.list()
      setPlays(res.data || [])
    } catch { toast.error('Failed to load plays') }
    setLoading(false)
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="skeleton h-10 w-48 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>Sales Plays</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plays.map(play => {
          const gradient = typeGradients[play.type] || typeGradients['Cold Outreach']
          return (
            <Link key={play.id} to={`/plays/${play.id}`}
              className="glass-card p-6 transition-all group hover:-translate-y-0.5 no-underline" style={{ borderRadius: 20 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: gradient }}>
                  <Target size={20} className="text-white" />
                </div>
                <span className="badge-indigo badge">{play.type}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111c2d', marginBottom: 6 }} className="group-hover:text-primary transition-colors">{play.name}</h3>
              <p style={{ fontSize: 12, color: '#767586', marginBottom: 16, lineHeight: 1.5 }} className="line-clamp-2">{play.description}</p>
              <div className="flex items-center gap-4" style={{ fontSize: 12, color: '#767586' }}>
                <span className="flex items-center gap-1"><Layers size={12} /> {play.total_steps} steps</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {play.duration_days}d</span>
                <span className="flex items-center gap-1"><GitBranch size={12} /> {play.flow_count} flows</span>
                <span className="flex items-center gap-1"><BookOpen size={12} /> {play.guideline_count} guides</span>
              </div>
              {play.target_stages && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {play.target_stages.map((s: string) => (
                    <span key={s} style={{ fontSize: 10, padding: '3px 8px', background: '#e1e0ff', borderRadius: 999, color: '#4648d4', fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
