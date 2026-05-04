import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { flowsApi } from '../api/client'
import { Mail, Phone, MessageCircle, CheckSquare, Play, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const channelIcons: Record<string, any> = { email: Mail, call: Phone, whatsapp: MessageCircle, task: CheckSquare }
const channelEmoji: Record<string, string> = { email: '📧', call: '📞', whatsapp: '📱', task: '✅' }
const channelColors: Record<string, { bg: string; icon: string }> = {
  email: { bg: '#e1e0ff', icon: '#4648d4' },
  call: { bg: '#dcfce7', icon: '#10b981' },
  whatsapp: { bg: '#dcfce7', icon: '#059669' },
  task: { bg: '#e2e8f0', icon: '#767586' },
}

export default function FlowDetail() {
  const { id } = useParams()
  const [flow, setFlow] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadFlow() }, [id])

  const loadFlow = async () => {
    setLoading(true)
    try {
      const [flowRes, enrollRes] = await Promise.all([flowsApi.get(id!), flowsApi.enrollments(id!)])
      setFlow(flowRes.data)
      setEnrollments(enrollRes.data || [])
    } catch { toast.error('Failed to load flow') }
    setLoading(false)
  }

  const handleAdvance = async (enrollmentId: string) => {
    try { await flowsApi.advance(enrollmentId); toast.success('Enrollment advanced'); loadFlow() }
    catch { toast.error('Failed to advance') }
  }

  const handleExit = async (enrollmentId: string) => {
    try { await flowsApi.exit(enrollmentId); toast.success('Enrollment exited'); loadFlow() }
    catch { toast.error('Failed to exit') }
  }

  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-1/3 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" /></div>
  if (!flow) return <p style={{ color: '#767586' }}>Flow not found</p>

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>{flow.name}</h1>
        <p style={{ color: '#767586', fontSize: 13, marginTop: 4 }}>{flow.description}</p>
      </div>

      {/* Step Timeline */}
      <div className="glass-card p-6" style={{ borderRadius: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 24 }}>Flow Steps</h2>
        <div className="relative">
          <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, width: 1, background: '#e7eeff' }} />
          <div className="space-y-5">
            {(flow.steps || []).map((step: any, i: number) => {
              const Icon = channelIcons[step.channel] || CheckSquare
              const colors = channelColors[step.channel] || channelColors.task
              return (
                <div key={step.id} className="flex gap-4 relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: i === 0 ? 'linear-gradient(135deg, #4648d4, #6063ee)' : colors.bg, border: i === 0 ? 'none' : `1px solid ${colors.icon}30` }}>
                    <Icon size={16} style={{ color: i === 0 ? 'white' : colors.icon }} />
                  </div>
                  <div className="flex-1 p-4 rounded-2xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>Step {step.step_number}: {step.action_description || step.channel}</span>
                      <span style={{ fontSize: 11, color: '#767586' }}>Day {step.delay_days}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: 12, color: '#767586' }}>
                      <span>{channelEmoji[step.channel]} {step.channel}</span>
                      {step.subject_template && <span style={{ color: '#767586' }}>· {step.subject_template}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="glass-card p-6" style={{ borderRadius: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }}>Enrollments ({enrollments.length})</h2>
        {enrollments.length === 0 ? (
          <p style={{ color: '#767586', textAlign: 'center', padding: '32px 0' }}>No enrollments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e7eeff' }}>
                  {['Contact', 'Deal', 'Step', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} className={i >= 4 ? 'text-right py-3 px-2' : 'text-left py-3 px-2'}
                      style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e: any) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f0f3ff' }}
                    onMouseEnter={el => el.currentTarget.style.background = '#f9f9ff'}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-2">
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{e.contacts?.name}</p>
                      <p style={{ fontSize: 11, color: '#767586' }}>{e.contacts?.companies?.name}</p>
                    </td>
                    <td className="py-3 px-2" style={{ fontSize: 13, color: '#767586' }}>{e.deals?.title || '—'}</td>
                    <td className="py-3 px-2 font-mono" style={{ fontSize: 13, color: '#4648d4', fontWeight: 600 }}>{e.current_step}</td>
                    <td className="py-3 px-2">
                      <span className="badge" style={{
                        background: e.status === 'active' ? '#dcfce7' : e.status === 'completed' ? '#e1e0ff' : '#e2e8f0',
                        color: e.status === 'active' ? '#166534' : e.status === 'completed' ? '#4648d4' : '#767586',
                      }}>{e.status}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {e.status === 'active' && (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleAdvance(e.id)} className="p-1.5 rounded-lg transition-all" title="Advance"
                            style={{ color: '#4648d4' }}
                            onMouseEnter={el => el.currentTarget.style.background = '#e1e0ff'}
                            onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                            <Play size={14} />
                          </button>
                          <button onClick={() => handleExit(e.id)} className="p-1.5 rounded-lg transition-all" title="Exit"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={el => el.currentTarget.style.background = '#ffdad6'}
                            onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
