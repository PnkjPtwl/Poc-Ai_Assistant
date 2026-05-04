import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { tasksApi, aiApi } from '../api/client'
import { Mail, Phone, MessageCircle, ClipboardCheck, CheckCircle, Clock, X, ChevronRight, AlertTriangle, ArrowDownAZ } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AnimatedList from '../components/animations/AnimatedList'

const typeIcons: Record<string, any> = { email: Mail, call: Phone, whatsapp: MessageCircle, review: ClipboardCheck, custom: ClipboardCheck }
const priorityBg: Record<string, string> = { urgent: '#ffdad6', high: '#fef3c7', normal: '#e1e0ff', low: '#e2e8f0' }
const priorityColor: Record<string, string> = { urgent: '#ba1a1a', high: '#92400e', normal: '#4648d4', low: '#475569' }
const priorityDot: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', normal: '#4648d4', low: '#94a3b8' }
const priorityWeights: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 }

export default function TaskQueue() {
  const { activeRep } = useAppStore()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'priority' | 'due_date'>('priority')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawer, setDrawer] = useState<any>(null)
  const [generatingWA, setGeneratingWA] = useState(false)

  useEffect(() => {
    document.title = "High-Velocity Task Queue | Vantage AI";
    loadTasks();
  }, [activeRep, filter])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params: any = { status: 'pending' }
      if (activeRep) params.rep_id = activeRep.id
      if (filter !== 'all') params.type = filter
      const res = await tasksApi.list(params)
      setTasks(res.data || [])
    } catch { toast.error('Failed to load tasks') }
    setLoading(false)
  }

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'complete') await tasksApi.update(id, { status: 'completed' })
      else if (action === 'dismiss') await tasksApi.update(id, { status: 'dismissed' })
      else if (action === 'snooze') {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
        await tasksApi.update(id, { snoozed_until: tomorrow.toISOString().split('T')[0] })
      }
      toast.success(`Task ${action}d`)
      setTasks(prev => prev.filter(t => t.id !== id))
      if (drawer?.id === id) setDrawer(null)
    } catch { toast.error('Failed to update task') }
  }

  const handleBulk = async (action: string) => {
    if (selected.size === 0) return
    try {
      await tasksApi.bulk({ task_ids: Array.from(selected), action })
      toast.success(`${selected.size} tasks ${action}d`)
      setTasks(prev => prev.filter(t => !selected.has(t.id)))
      setSelected(new Set())
    } catch { toast.error('Bulk action failed') }
  }

  const handleWhatsApp = async (task: any) => {
    setGeneratingWA(true)
    try {
      const res = await aiApi.whatsappMessage({ contact_id: task.contact_id, deal_id: task.deal_id, intent: task.title })
      window.open(res.data.whatsapp_url, '_blank')
      await handleAction(task.id, 'complete')
    } catch {
      toast.error('Failed to generate WhatsApp message')
    }
    setGeneratingWA(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const tabs = [
    { key: 'all', label: 'All' }, { key: 'email', label: 'Email' }, { key: 'call', label: 'Call' },
    { key: 'whatsapp', label: 'WhatsApp' }, { key: 'review', label: 'Review' },
  ]

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
        if (pDiff !== 0) return pDiff
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      } else {
        const dDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (dDiff !== 0) return dDiff
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
      }
    })
  }, [tasks, sortBy])

  return (
    <div className="flex gap-0 animate-fade-in-up">
      <div className={`flex-1 space-y-5 transition-all ${drawer ? 'mr-[420px]' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>Task Queue</h1>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 glass-card rounded-xl p-2">
              <span style={{ fontSize: 13, color: '#767586', padding: '0 8px' }}>{selected.size} selected</span>
              <button onClick={() => handleBulk('complete')} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: '#dcfce7', color: '#166534' }}>Complete All</button>
              <button onClick={() => handleBulk('dismiss')} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: '#ffdad6', color: '#93000a' }}>Dismiss All</button>
              <button onClick={() => handleBulk('snooze')} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: '#fef3c7', color: '#92400e' }}>Snooze All</button>
            </div>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                style={{
                  background: filter === t.key ? 'white' : 'transparent',
                  color: filter === t.key ? '#4648d4' : '#767586',
                  boxShadow: filter === t.key ? '0 2px 8px rgba(70,72,212,0.1)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
            <ArrowDownAZ size={14} style={{ color: '#767586' }} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ background: 'transparent', fontSize: 13, color: '#464554', outline: 'none', border: 'none', fontWeight: 500 }}
            >
              <option value="priority">Sort by Priority</option>
              <option value="due_date">Sort by Due Date</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#767586' }}><CheckCircle size={48} className="mx-auto mb-4 opacity-40" /><p>All caught up! No pending tasks.</p></div>
        ) : (
          <AnimatedList 
            items={sortedTasks}
            className="max-h-[calc(100vh-280px)]"
            showGradients={true}
            renderItem={(task) => {
              const Icon = typeIcons[task.type] || ClipboardCheck
              const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString())
              return (
                <div key={task.id} className="group glass-card p-4 transition-all cursor-pointer hover:-translate-y-0.5"
                  style={{ borderRadius: 16, borderColor: selected.has(task.id) ? '#4648d4' : undefined }}
                  onClick={() => setDrawer(task)}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selected.has(task.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(task.id) }}
                      className="w-4 h-4 rounded accent-primary" style={{ accentColor: '#4648d4' }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: priorityDot[task.priority] || '#4648d4' }} />
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                      <Icon size={16} style={{ color: '#767586' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }} className="truncate">{task.title}</p>
                      <p style={{ fontSize: 11, color: '#767586' }}>
                        {task.contacts?.name}{task.contacts?.companies?.name ? ` · ${task.contacts.companies.name}` : ''}
                        {task.deals ? ` · ${task.deals.title}` : ''}
                      </p>
                    </div>
                    {task.deals?.amount && <span className="font-mono" style={{ fontSize: 12, color: '#464554', fontWeight: 600 }}>${(task.deals.amount/1000).toFixed(0)}k</span>}
                    {isOverdue && <span className="flex items-center gap-1 badge-red badge"><AlertTriangle size={10} />Overdue</span>}
                    <span style={{ fontSize: 11, color: '#767586' }}>{task.due_date}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleAction(task.id, 'complete')} className="p-1.5 rounded-lg transition-all" style={{ color: '#10b981' }} onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><CheckCircle size={14} /></button>
                      <button onClick={() => handleAction(task.id, 'snooze')} className="p-1.5 rounded-lg transition-all" style={{ color: '#f59e0b' }} onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Clock size={14} /></button>
                      <button onClick={() => handleAction(task.id, 'dismiss')} className="p-1.5 rounded-lg transition-all" style={{ color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background = '#ffdad6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={14} /></button>
                    </div>
                    <ChevronRight size={14} style={{ color: '#c7c4d7' }} />
                  </div>
                </div>
              )
            }}
          />
        )}
      </div>

      {/* Side Drawer */}
      {drawer && (
        <div className="fixed right-0 top-16 w-[420px] h-[calc(100vh-64px)] overflow-y-auto z-30 p-6 space-y-5 animate-slide-in"
          style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', borderLeft: '1px solid #c7c4d7', boxShadow: '-10px 0 40px rgba(15,23,42,0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d' }}>Task Details</h3>
            <button onClick={() => setDrawer(null)} className="p-1.5 rounded-lg transition-all" style={{ color: '#767586' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f3ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl space-y-2" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111c2d' }}>{drawer.title}</p>
              <p style={{ fontSize: 12, color: '#767586' }}>{drawer.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="badge" style={{ background: priorityBg[drawer.priority], color: priorityColor[drawer.priority] }}>{drawer.priority}</span>
                <span className="badge-slate badge">{drawer.type}</span>
              </div>
            </div>

            {drawer.contacts && (
              <div className="p-4 rounded-2xl space-y-2" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111c2d' }}>{drawer.contacts.name}</p>
                <p style={{ fontSize: 12, color: '#767586' }}>{drawer.contacts.email}</p>
              </div>
            )}

            {drawer.deals && (
              <div className="p-4 rounded-2xl space-y-2" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deal</p>
                <Link to={`/deals/${drawer.deal_id}`} style={{ fontSize: 14, fontWeight: 600, color: '#4648d4', textDecoration: 'none' }}>{drawer.deals.title}</Link>
                <div className="flex gap-3" style={{ fontSize: 12 }}>
                  <span style={{ color: '#767586' }}>{drawer.deals.stage}</span>
                  <span className="font-mono" style={{ color: '#10b981', fontWeight: 600 }}>${drawer.deals.amount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {drawer.type === 'email' && (
                <Link to={`/email/compose?contact_id=${drawer.contact_id}&deal_id=${drawer.deal_id || ''}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm no-underline">
                  <Mail size={16} /> Open in Composer
                </Link>
              )}
              {drawer.type === 'whatsapp' && (
                <button 
                  onClick={() => handleWhatsApp(drawer)}
                  disabled={generatingWA}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  style={{ background: '#10b981' }}>
                  <MessageCircle size={16} /> {generatingWA ? 'Generating...' : 'Generate & Open WhatsApp'}
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleAction(drawer.id, 'complete')} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all" style={{ background: '#dcfce7', color: '#166534' }}>Complete</button>
                <button onClick={() => handleAction(drawer.id, 'snooze')} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all" style={{ background: '#fef3c7', color: '#92400e' }}>Snooze</button>
                <button onClick={() => handleAction(drawer.id, 'dismiss')} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all" style={{ background: '#ffdad6', color: '#93000a' }}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
