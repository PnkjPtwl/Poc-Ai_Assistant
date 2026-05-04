import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { callsApi, aiApi } from '../api/client'
import { Phone, Clock, MessageSquare, X, Sparkles, Loader2, Mail, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const sentimentBadge: Record<string, { bg: string; color: string }> = {
  Positive: { bg: '#dcfce7', color: '#166534' },
  Neutral: { bg: '#fef3c7', color: '#92400e' },
  Negative: { bg: '#ffdad6', color: '#93000a' },
}

export default function CallTranscripts() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadCalls() }, [])

  const loadCalls = async () => {
    setLoading(true)
    try {
      const res = await callsApi.list()
      setCalls(res.data || [])
    } catch { toast.error('Failed to load calls') }
    setLoading(false)
  }

  const openCall = async (id: string) => {
    try {
      const res = await callsApi.get(id)
      setSelectedCall(res.data)
    } catch { toast.error('Failed to load transcript') }
  }

  const handleSummarize = async () => {
    if (!selectedCall) return
    setSummarizing(true)
    try {
      const res = await aiApi.summarizeTranscript({ transcript_id: selectedCall.id })
      setSelectedCall((prev: any) => ({ ...prev, summary: res.data.summary, key_topics: res.data.key_topics, sentiment: res.data.sentiment }))
      toast.success('Transcript summarized!')
      loadCalls()
    } catch { toast.error('Summarization failed') }
    setSummarizing(false)
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const filteredCalls = useMemo(() => {
    if (!searchQuery) return calls
    const q = searchQuery.toLowerCase()
    return calls.filter(c =>
      c.contacts?.name?.toLowerCase().includes(q) ||
      c.deals?.title?.toLowerCase().includes(q)
    )
  }, [calls, searchQuery])

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }} className="flex items-center gap-3">
          <Phone size={24} style={{ color: '#4648d4' }} /> Call Transcripts
        </h1>
        <div className="relative w-64">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#767586' }} />
          <input
            type="text"
            placeholder="Search contacts or deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, background: '#f0f3ff', border: '1px solid #c7c4d7', borderRadius: 12, paddingLeft: 34, paddingRight: 12, fontSize: 13, color: '#111c2d', outline: 'none' }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-10" style={{ color: '#767586' }}>No transcripts found{searchQuery ? ` matching "${searchQuery}"` : ''}</div>
        ) : (
          filteredCalls.map(call => {
            const badge = sentimentBadge[call.sentiment]
            return (
              <div key={call.id} onClick={() => openCall(call.id)}
                className="glass-card p-4 transition-all cursor-pointer hover:-translate-y-0.5 group" style={{ borderRadius: 16 }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Phone size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }} className="group-hover:text-primary transition-colors">{call.contacts?.name || 'Unknown Contact'}</p>
                    <p style={{ fontSize: 11, color: '#767586' }}>{call.deals?.title} · {call.deals?.stage}</p>
                  </div>
                  <span className="font-mono flex items-center gap-1" style={{ fontSize: 12, color: '#767586' }}>
                    <Clock size={12} /> {formatDuration(call.duration_seconds || 0)}
                  </span>
                  <span className="badge" style={{ background: badge?.bg || '#e2e8f0', color: badge?.color || '#475569' }}>
                    {call.sentiment || 'Pending'}
                  </span>
                  <span style={{ fontSize: 11, color: '#767586' }}>{call.call_date?.split('T')[0]}</span>
                </div>
                {call.summary && <p style={{ fontSize: 12, color: '#767586', marginTop: 8, marginLeft: 56 }} className="line-clamp-1">{call.summary}</p>}
              </div>
            )
          })
        )}
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedCall(null)}>
          <div className="w-[700px] max-h-[80vh] flex flex-col" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', border: '1px solid #c7c4d7', borderRadius: 24, boxShadow: '0 40px 80px rgba(15,23,42,0.2)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e7eeff' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d' }}>{selectedCall.contacts?.name}</h3>
                <p style={{ fontSize: 12, color: '#767586' }}>{selectedCall.deals?.title} · {selectedCall.call_date?.split('T')[0]} · {formatDuration(selectedCall.duration_seconds || 0)}</p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="p-1.5 rounded-xl transition-all" style={{ color: '#767586' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={18} />
              </button>
            </div>

            {/* Metadata */}
            <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: '1px solid #e7eeff' }}>
              {sentimentBadge[selectedCall.sentiment] && (
                <span className="badge" style={{ background: sentimentBadge[selectedCall.sentiment].bg, color: sentimentBadge[selectedCall.sentiment].color }}>
                  {selectedCall.sentiment}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#767586' }}>Lang: {selectedCall.language_detected}</span>
              {(selectedCall.key_topics || []).map((t: string) => (
                <span key={t} style={{ fontSize: 10, padding: '2px 8px', background: '#e1e0ff', borderRadius: 999, color: '#4648d4', fontWeight: 600 }}>{t}</span>
              ))}
            </div>

            {/* Summary */}
            {selectedCall.summary && (
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #e7eeff', background: '#f0f3ff' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI Summary</p>
                <p style={{ fontSize: 13, color: '#464554', lineHeight: 1.6 }}>{selectedCall.summary}</p>
              </div>
            )}

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-5">
              <pre style={{ fontSize: 13, color: '#464554', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>{selectedCall.transcript}</pre>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #e7eeff' }}>
              <button onClick={handleSummarize} disabled={summarizing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(70,72,212,0.08)', color: '#4648d4', border: '1px solid rgba(70,72,212,0.2)' }}>
                {summarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {summarizing ? 'Summarizing...' : 'AI Summarize'}
              </button>
              <Link to={`/email/compose?contact_id=${selectedCall.contact_id}&deal_id=${selectedCall.deal_id || ''}`}
                className="btn-secondary flex items-center gap-2 text-sm no-underline">
                <Mail size={14} /> Draft Follow-up Email
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
