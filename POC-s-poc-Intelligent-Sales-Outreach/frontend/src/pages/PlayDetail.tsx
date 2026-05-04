import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { playsApi, aiApi } from '../api/client'
import { Sparkles, Loader2, GitBranch, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PlayDetail() {
  const { id } = useParams()
  const [play, setPlay] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => { if (id) loadPlay() }, [id])

  const loadPlay = async () => {
    setLoading(true)
    try {
      const res = await playsApi.get(id!)
      setPlay(res.data)
    } catch { toast.error('Failed to load play') }
    setLoading(false)
  }

  const handleGenerateGuidelines = async (stage: string) => {
    setGenerating(stage)
    try {
      await aiApi.generateGuidelines({ play_id: id, deal_stage: stage, context: '' })
      toast.success(`Guidelines generated for ${stage}`)
      loadPlay()
    } catch { toast.error('Failed to generate guidelines') }
    setGenerating(null)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 w-1/3 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )
  if (!play) return <p style={{ color: '#767586' }}>Play not found</p>

  const stages = ['Prospecting', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
  const guidelines = play.guidelines || {}

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6" style={{ borderRadius: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>{play.name}</h1>
        <p style={{ color: '#767586', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{play.description}</p>
        <div className="flex gap-2 mt-4">
          <span className="badge-indigo badge">{play.type}</span>
          <span className="badge-slate badge">{play.total_steps} steps</span>
          <span className="badge-slate badge">{play.duration_days} days</span>
        </div>
      </div>

      {/* AI Guidelines */}
      <div className="glass-card p-6" style={{ borderRadius: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 20 }} className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#4648d4' }} /> AI Guidelines
        </h2>
        <div className="space-y-4">
          {stages.map(stage => {
            const stageGuides = guidelines[stage] || []
            return (
              <div key={stage} className="rounded-2xl p-4" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111c2d' }}>{stage}</h3>
                  {stageGuides.length === 0 && (
                    <button onClick={() => handleGenerateGuidelines(stage)} disabled={generating === stage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      style={{ background: 'rgba(70,72,212,0.08)', color: '#4648d4', border: '1px solid rgba(70,72,212,0.2)' }}>
                      {generating === stage
                        ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
                        : <><Sparkles size={12} /> Generate</>}
                    </button>
                  )}
                </div>
                {generating === stage && (
                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#4648d4' }}>
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="animate-pulse">✦ AI is generating guidelines...</span>
                    </div>
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                )}
                {stageGuides.length > 0 && (
                  <div className="space-y-3">
                    {stageGuides.map((g: any) => {
                      let bullets: string[] = []
                      try { bullets = JSON.parse(g.guideline_content) } catch { bullets = [g.guideline_content] }
                      return (
                        <div key={g.id} className="rounded-xl p-3" style={{ background: 'white', border: '1px solid #e7eeff' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d', marginBottom: 8 }}>{g.guideline_title}</p>
                          <ul className="space-y-1.5">
                            {bullets.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: '#464554' }}>
                                <CheckCircle size={12} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} /> {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Associated Flows */}
      {play.flows && play.flows.length > 0 && (
        <div className="glass-card p-6" style={{ borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }} className="flex items-center gap-2">
            <GitBranch size={18} style={{ color: '#6b38d4' }} /> Associated Flows
          </h2>
          <div className="space-y-2">
            {play.flows.map((f: any) => (
              <Link key={f.id} to={`/flows/${f.id}`}
                className="flex items-center justify-between p-4 rounded-2xl transition-all no-underline group"
                style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e7eeff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0f3ff'}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }} className="group-hover:text-primary transition-colors">{f.name}</span>
                <span className="badge" style={{
                  background: f.status === 'active' ? '#dcfce7' : '#e2e8f0',
                  color: f.status === 'active' ? '#166534' : '#767586',
                }}>{f.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
