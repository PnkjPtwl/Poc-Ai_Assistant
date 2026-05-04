import { useEffect, useState } from 'react'
import { flowsApi, playsApi } from '../api/client'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'
import {
  GitBranch, Target, Play, CheckCircle2, Mail, Phone, MessageCircle,
  CheckSquare, Loader2, Zap, X, ExternalLink, PlusCircle, AlertCircle
} from 'lucide-react'

const channelIcon: Record<string, any> = { email: Mail, call: Phone, whatsapp: MessageCircle, task: CheckSquare, review: CheckSquare }
const channelLabel: Record<string, string> = { email: '📧 Email Draft', call: '📞 Call Logged', whatsapp: '📱 WhatsApp', task: '✅ Task Done', review: '✅ Task Done' }
const channelColors: Record<string, { bg: string; color: string }> = {
  email: { bg: '#e1e0ff', color: '#4648d4' },
  call: { bg: '#dcfce7', color: '#10b981' },
  whatsapp: { bg: '#dcfce7', color: '#059669' },
  task: { bg: '#fef3c7', color: '#d97706' },
  review: { bg: '#fef3c7', color: '#d97706' },
}

interface ResultPopup { channel: string; subject?: string; body?: string; message?: string; whatsapp_url?: string; action: string; enrollment_status: string; next_step?: number }

export default function DealFlowsPlays({ dealId, contactId, repId }: { dealId: string; contactId: string; repId?: string }) {
  const { activeRep } = useAppStore()
  const effectiveRepId = repId || activeRep?.id
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [plays, setPlays] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [result, setResult] = useState<ResultPopup | null>(null)
  const [showEnrollPanel, setShowEnrollPanel] = useState(false)
  const [selectedPlay, setSelectedPlay] = useState<any>(null)
  const [selectedFlow, setSelectedFlow] = useState<any>(null)

  useEffect(() => { load() }, [dealId])

  const load = async () => {
    setLoading(true)
    try {
      const [enrollRes, playsRes] = await Promise.all([flowsApi.dealEnrollments(dealId), playsApi.list()])
      setEnrollments(enrollRes.data || [])
      setPlays(playsRes.data || [])
    } catch { toast.error('Failed to load flows/plays') }
    setLoading(false)
  }

  const handleSelectPlay = async (play: any) => {
    setSelectedPlay(play); setSelectedFlow(null)
    try { const res = await playsApi.get(play.id); setFlows(res.data?.flows || []) }
    catch { toast.error('Failed to load play flows') }
  }

  const handleEnroll = async () => {
    if (!selectedFlow) return toast.error('Select a flow first')
    setEnrolling(true)
    try {
      await flowsApi.enroll(selectedFlow.id, { contact_id: contactId, deal_id: dealId, rep_id: effectiveRepId })
      toast.success(`Enrolled in "${selectedFlow.name}"`)
      setShowEnrollPanel(false); setSelectedPlay(null); setSelectedFlow(null)
      await load()
    } catch { toast.error('Failed to enroll') }
    setEnrolling(false)
  }

  const handleExecute = async (enrollmentId: string) => {
    setExecuting(enrollmentId)
    try {
      const res = await flowsApi.executeStep(enrollmentId)
      setResult(res.data)
      if (res.data.enrollment_status === 'completed') toast.success('🎉 Flow completed!')
      else toast.success(`Step ${res.data.step} executed`)
      await load()
    } catch { toast.error('Failed to execute step') }
    setExecuting(null)
  }

  const handleExit = async (enrollmentId: string) => {
    try { await flowsApi.exit(enrollmentId); toast.success('Exited flow'); load() }
    catch { toast.error('Failed to exit') }
  }

  if (loading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2" style={{ fontSize: 15, fontWeight: 700, color: '#111c2d' }}>
          <GitBranch size={16} style={{ color: '#6b38d4' }} /> Active Flows
          <span style={{ fontSize: 12, color: '#767586', fontWeight: 400 }}>({enrollments.filter(e => e.status === 'active').length} active)</span>
        </h2>
        <button onClick={() => setShowEnrollPanel(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(107,56,212,0.08)', color: '#6b38d4', border: '1px solid rgba(107,56,212,0.2)' }}>
          <PlusCircle size={13} /> Enroll in Flow
        </button>
      </div>

      {/* Enroll Panel */}
      {showEnrollPanel && (
        <div className="p-4 space-y-3 rounded-2xl" style={{ background: '#f0f3ff', border: '1px solid rgba(107,56,212,0.2)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>1. Choose a Play</p>
          <div className="grid grid-cols-2 gap-2">
            {plays.map(p => (
              <button key={p.id} onClick={() => handleSelectPlay(p)} className="p-3 rounded-xl border text-left transition-all"
                style={{ background: selectedPlay?.id === p.id ? 'rgba(107,56,212,0.08)' : 'white', border: selectedPlay?.id === p.id ? '1px solid rgba(107,56,212,0.3)' : '1px solid #e7eeff' }}>
                <div className="flex items-center gap-2 mb-1"><Target size={13} style={{ color: '#6b38d4' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#111c2d' }} className="truncate">{p.name}</span></div>
                <span style={{ fontSize: 10, color: '#767586' }}>{p.type} · {p.total_steps} steps</span>
              </button>
            ))}
          </div>
          {selectedPlay && flows.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>2. Choose a Flow</p>
              <div className="space-y-2">
                {flows.map((f: any) => (
                  <button key={f.id} onClick={() => setSelectedFlow(f)} className="w-full p-3 rounded-xl border text-left transition-all"
                    style={{ background: selectedFlow?.id === f.id ? 'rgba(70,72,212,0.06)' : 'white', border: selectedFlow?.id === f.id ? '1px solid rgba(70,72,212,0.3)' : '1px solid #e7eeff' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111c2d' }}>{f.name}</span>
                      <span className="badge" style={{ background: f.status === 'active' ? '#dcfce7' : '#e2e8f0', color: f.status === 'active' ? '#166534' : '#767586' }}>{f.status}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#767586', marginTop: 2 }}>{f.flow_steps?.length || 0} steps</p>
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedPlay && flows.length === 0 && (
            <p className="flex items-center gap-1 justify-center" style={{ fontSize: 12, color: '#767586', padding: '8px 0' }}>
              <AlertCircle size={12} /> No flows in this play yet
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={handleEnroll} disabled={!selectedFlow || enrolling}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6b38d4, #4648d4)' }}>
              {enrolling ? <><Loader2 size={13} className="animate-spin" /> Enrolling...</> : <><Zap size={13} /> Enroll Deal</>}
            </button>
            <button onClick={() => { setShowEnrollPanel(false); setSelectedPlay(null); setSelectedFlow(null) }}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: '#e7eeff', color: '#767586' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrollments.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: '#f0f3ff', border: '1px dashed #c7c4d7' }}>
          <GitBranch size={28} style={{ color: '#c7c4d7', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: '#767586' }}>No flows enrolled yet</p>
          <p style={{ fontSize: 11, color: '#c7c4d7', marginTop: 4 }}>Enroll this deal into a flow to automate outreach</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map(e => {
            const steps: any[] = e.steps || []
            const current = e.current_step || 1
            const total = e.total_steps || steps.length
            const pct = e.status === 'completed' ? 100 : Math.round(((current - 1) / Math.max(total, 1)) * 100)
            const flow = e.flows || {}
            const currentStepDetail = e.current_step_detail
            const borderColor = e.status === 'active' ? 'rgba(107,56,212,0.3)' : e.status === 'completed' ? 'rgba(16,185,129,0.3)' : '#e7eeff'

            return (
              <div key={e.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: 'white' }}>
                {/* Flow Header */}
                <div className="p-4" style={{ borderBottom: '1px solid #f0f3ff', background: '#f9f9ff' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitBranch size={14} style={{ color: '#6b38d4' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111c2d' }}>{flow.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge" style={{
                        background: e.status === 'active' ? '#e9ddff' : e.status === 'completed' ? '#dcfce7' : '#e2e8f0',
                        color: e.status === 'active' ? '#6b38d4' : e.status === 'completed' ? '#166534' : '#767586',
                      }}>{e.status}</span>
                      {e.status === 'active' && (
                        <button onClick={() => handleExit(e.id)} className="p-1 rounded-lg transition-all" style={{ color: '#767586' }}
                          onMouseEnter={el => el.currentTarget.style.background = '#ffdad6'}
                          onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e7eeff' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6b38d4, #4648d4)' }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#767586', whiteSpace: 'nowrap' }}>{e.status === 'completed' ? 'Done' : `Step ${current} / ${total}`}</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4">
                  <div className="relative">
                    <div style={{ position: 'absolute', left: 14, top: 4, bottom: 4, width: 1, background: '#e7eeff' }} />
                    <div className="space-y-3">
                      {steps.map((step: any) => {
                        const stepNum = step.step_number
                        const done = stepNum < current || e.status === 'completed'
                        const isCurrent = stepNum === current && e.status === 'active'
                        const Icon = channelIcon[step.channel] || CheckSquare
                        const ch = channelColors[step.channel] || { bg: '#e2e8f0', color: '#767586' }
                        return (
                          <div key={step.id} className="flex gap-3 items-start" style={{ opacity: done ? 0.6 : 1 }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                              style={{
                                background: done ? '#dcfce7' : isCurrent ? '#6b38d4' : ch.bg,
                                border: done ? '1px solid rgba(16,185,129,0.4)' : isCurrent ? 'none' : `1px solid ${ch.color}30`,
                                boxShadow: isCurrent ? '0 0 12px rgba(107,56,212,0.35)' : 'none',
                              }}>
                              {done ? <CheckCircle2 size={13} style={{ color: '#10b981' }} /> : <Icon size={13} style={{ color: isCurrent ? 'white' : ch.color }} />}
                            </div>
                            <div className="flex-1 p-2.5 rounded-xl" style={{ background: isCurrent ? 'rgba(107,56,212,0.06)' : '#f9f9ff', border: isCurrent ? '1px solid rgba(107,56,212,0.2)' : '1px solid #f0f3ff' }}>
                              <div className="flex items-center justify-between">
                                <span style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? '#6b38d4' : done ? '#767586' : '#111c2d' }}>{step.action_description || step.channel}</span>
                                <span style={{ fontSize: 10, color: '#767586' }}>Day {step.delay_days}</span>
                              </div>
                              <span style={{ fontSize: 10, color: ch.color }}>{step.channel}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {e.status === 'active' && currentStepDetail && (
                    <button onClick={() => handleExecute(e.id)} disabled={executing === e.id}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #6b38d4, #4648d4)', boxShadow: '0 4px 14px rgba(107,56,212,0.3)' }}>
                      {executing === e.id ? <><Loader2 size={13} className="animate-spin" /> Executing Step {current}...</> : <><Play size={13} /> Execute Step {current}: {currentStepDetail.channel}</>}
                    </button>
                  )}
                  {e.status === 'completed' && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl" style={{ background: '#dcfce7', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>All steps completed!</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => setResult(null)}>
          <div className="w-[540px] max-h-[85vh] overflow-y-auto rounded-2xl" style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid #c7c4d7', boxShadow: '0 40px 80px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e7eeff' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: channelColors[result.channel]?.bg || '#e2e8f0' }}>
                  {result.channel === 'email' ? <Mail size={18} style={{ color: '#4648d4' }} /> : result.channel === 'call' ? <Phone size={18} style={{ color: '#10b981' }} /> : result.channel === 'whatsapp' ? <MessageCircle size={18} style={{ color: '#059669' }} /> : <CheckSquare size={18} style={{ color: '#d97706' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111c2d' }}>{result.channel === 'email' ? ((result as any).sent ? '📧 Email Sent!' : '📧 Email Draft Saved') : (channelLabel[result.channel] || 'Step Executed')}</h3>
                  <p style={{ fontSize: 10, color: '#767586' }}>Step {(result as any).step} · {result.enrollment_status === 'completed' ? 'Flow Complete!' : `Next → Step ${result.next_step}`}</p>
                </div>
              </div>
              <button onClick={() => setResult(null)} className="p-1.5 rounded-xl" style={{ color: '#767586' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {result.channel === 'email' && (
                <>
                  {(result as any).sent === true ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 500 }}>Email sent to <strong>{(result as any).to_email}</strong></span>
                    </div>
                  ) : (result as any).send_error ? (
                    <div className="p-3 rounded-xl" style={{ background: '#fef3c7', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <p style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Saved as draft — SMTP note:</p>
                      <p style={{ fontSize: 10, color: '#a16207', marginTop: 4 }}>{(result as any).send_error}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e1e0ff', border: '1px solid rgba(70,72,212,0.2)' }}>
                      <CheckCircle2 size={13} style={{ color: '#4648d4' }} />
                      <span style={{ fontSize: 12, color: '#4648d4' }}>Saved as draft in Email Composer</span>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Subject</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{result.subject || '(no subject)'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email Body</p>
                    <div className="p-3 rounded-xl max-h-64 overflow-y-auto" style={{ background: '#f0f3ff', border: '1px solid #e7eeff', fontSize: 12, color: '#464554', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {result.body || '(body empty — check AI service)'}
                    </div>
                  </div>
                </>
              )}
              {result.channel === 'call' && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 12, color: '#166534' }}>Call task logged as completed in Task Queue</span>
                </div>
              )}
              {result.channel === 'whatsapp' && result.message && (
                <>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>WhatsApp Message</p>
                    <div className="p-3 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff', fontSize: 12, color: '#464554', lineHeight: 1.6 }}>{result.message}</div>
                  </div>
                  {result.whatsapp_url && (
                    <a href={result.whatsapp_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold w-fit transition-all"
                      style={{ background: '#10b981' }}>
                      <ExternalLink size={12} /> Open in WhatsApp
                    </a>
                  )}
                </>
              )}
              {(result.channel === 'task' || result.channel === 'review') && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fef3c7', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <CheckCircle2 size={14} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: 12, color: '#92400e' }}>Review task marked complete in Task Queue</span>
                </div>
              )}
              {result.enrollment_status === 'completed' && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl mt-2" style={{ background: 'linear-gradient(135deg, rgba(107,56,212,0.08), rgba(70,72,212,0.08))', border: '1px solid rgba(107,56,212,0.2)' }}>
                  <CheckCircle2 size={14} style={{ color: '#6b38d4' }} />
                  <span style={{ fontSize: 12, color: '#6b38d4', fontWeight: 600 }}>🎉 All flow steps completed for this deal!</span>
                </div>
              )}
              <button onClick={() => setResult(null)} className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all" style={{ background: '#f0f3ff', color: '#767586' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
