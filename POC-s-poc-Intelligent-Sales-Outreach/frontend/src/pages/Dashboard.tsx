import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { tasksApi, dealsApi, emailsApi, aiApi } from '../api/client'
import { Mail, ArrowRight, TrendingUp, Calendar, MoreVertical, Send, Briefcase, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { activeRep } = useAppStore()
  const [stats, setStats] = useState({ tasks: 0, emails: 0, deals: 0, forecast: 0 })
  const [topTasks, setTopTasks] = useState<any[]>([])
  const [activeDeals, setActiveDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [temperatures, setTemperatures] = useState<Record<string, any>>({})

  useEffect(() => {
    document.title = "Executive Dashboard | Vantage AI Outreach";
    loadData()
  }, [activeRep])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeRep) params.rep_id = activeRep.id

      const [taskRes, dealRes, emailRes] = await Promise.all([
        tasksApi.list({ ...params, status: 'pending' }),
        dealsApi.list(params),
        emailsApi.list({ ...params, limit: '10' }),
      ])

      setTopTasks((taskRes.data || []).slice(0, 3))
      const deals = dealRes.data || []
      const sortedDeals = [...deals].sort((a, b) => (b.amount || 0) - (a.amount || 0))
      setActiveDeals(sortedDeals.slice(0, 4))
      loadTemperatures(sortedDeals.slice(0, 4))

      const totalPipeline = deals.reduce((a: number, d: any) => a + (d.amount || 0), 0)
      setStats({
        tasks: (taskRes.data || []).length,
        emails: (emailRes.data || []).length,
        deals: deals.length,
        forecast: totalPipeline,
      })
    } catch (e) {
      toast.error('Failed to load Vantage workspace')
    }
    setLoading(false)
  }

  const loadTemperatures = async (deals: any[]) => {
    if (!deals.length) return
    const results = await Promise.allSettled(deals.map(d => aiApi.dealTemperature({ deal_id: d.id })))
    const map: Record<string, any> = {}
    results.forEach((r, i) => { if (r.status === 'fulfilled') map[deals[i].id] = r.value.data })
    setTemperatures(map)
  }

  if (loading) return <div className="p-12 animate-pulse space-y-8"><div className="h-20 bg-emerald-900/5 rounded-2xl w-1/3" /><div className="grid grid-cols-12 gap-8"><div className="col-span-4 h-96 bg-emerald-900/5 rounded-2xl" /><div className="col-span-8 h-96 bg-emerald-900/5 rounded-2xl" /></div></div>

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-12 max-w-[1600px] mx-auto space-y-12"
    >
      {/* Header with Stats */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-emerald-950 tracking-tight">Vantage Dashboard</h1>
            <p className="text-emerald-800/60 mt-1 text-lg font-medium">Strategic intelligence for {activeRep?.name || 'the Sales Team'}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/smart-assistant" className="btn-vantage btn-vantage-primary shadow-lg shadow-emerald-900/20 px-6 py-3">
              <Sparkles size={20} className="mr-2" />
              Open Smart Assistant
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Pipeline', value: `$${(stats.forecast / 1000).toFixed(0)}k`, icon: TrendingUp, color: 'emerald' },
            { label: 'Open Deals', value: stats.deals, icon: Briefcase, color: 'blue' },
            { label: 'Strategic Tasks', value: stats.tasks, icon: Calendar, color: 'yellow' },
            { label: 'Unread Emails', value: stats.emails, icon: Mail, color: 'purple' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-2xl flex items-center justify-between group cursor-default"
            >
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-3xl font-black text-emerald-950">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-600 group-hover:scale-110 transition-transform`}>
                <s.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Pane: Strategic Tasks */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
              <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
              Priority Actions
            </h2>
          </div>

          <div className="space-y-4">
            {topTasks.map((task) => (
              <motion.div 
                key={task.id} 
                whileHover={{ x: 4 }}
                className="glass-card p-5 rounded-xl border-l-4 border-yellow-400 group cursor-pointer hover:bg-white transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest rounded">
                    {task.priority} Priority
                  </span>
                  <MoreVertical size={16} className="text-slate-300" />
                </div>
                <h3 className="text-[17px] font-bold text-emerald-950 mb-1 leading-snug">{task.title}</h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">Strategic follow-up needed for the **{task.deals?.title || 'active'}** project.</p>
                <div className="flex items-center justify-between pt-3 border-t border-emerald-900/5">
                  <div className="flex items-center text-xs font-medium text-slate-400">
                    <Calendar size={13} className="mr-1" />
                    Due Today
                  </div>
                  <ArrowRight size={14} className="text-emerald-900 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.div>
            ))}
            {!topTasks.length && <div className="text-center py-12 text-slate-400 italic">No pending tasks for today.</div>}
          </div>
        </section>

        {/* Right Pane: Executive Deals Grid */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
              <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
              Top Opportunities
            </h2>
            <Link to="/forecast" className="text-emerald-700 text-sm font-bold hover:underline">View Full Pipeline</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeDeals.map((deal) => {
              const temp = temperatures[deal.id]
              return (
                <div key={deal.id} className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:bg-white transition-colors">
                  <div className="flex justify-between items-start relative z-10 mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{deal.stage}</p>
                      <h3 className="text-3xl font-black text-emerald-950">${(deal.amount || 0).toLocaleString()}</h3>
                    </div>
                    {temp && (
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        temp.temperature.toLowerCase() === 'hot' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {temp.temperature}
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 mb-8">
                    <h4 className="text-xl font-bold text-emerald-950">{deal.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Next Step: <span className="text-emerald-800">{deal.next_step || 'None scheduled'}</span></p>
                  </div>
                  <div className="flex items-center justify-between relative z-10 border-t border-emerald-900/5 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                        {deal.title[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-950 leading-none">{deal.contacts?.name || 'Contact'}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Key Prospect</p>
                      </div>
                    </div>
                    <Link to={`/deals/${deal.id}`} className="w-10 h-10 rounded-full bg-emerald-900 text-white flex items-center justify-center hover:scale-110 transition-transform">
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quarterly Forecast Card */}
          <div className="glass-card p-8 rounded-2xl border-t-4 border-emerald-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-emerald-900">Quarterly Forecast</h3>
                <p className="text-sm text-slate-500 mt-1">Performance against Target: <span className="font-bold text-emerald-900">$2,500,000</span></p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-4xl font-black text-emerald-900">${(stats.forecast / 1000).toFixed(0)}k</p>
                <div className="flex items-center justify-end text-yellow-600 mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">12.4% Increase vs LY</span>
                </div>
              </div>
            </div>
            <div className="relative w-full h-4 bg-emerald-50 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-emerald-900 rounded-full transition-all duration-1000" style={{ width: '74%' }}></div>
              <div className="absolute top-0 left-0 h-full bg-yellow-400 opacity-20 animate-pulse" style={{ width: '74%' }}></div>
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>$0.00</span>
              <span className="text-emerald-900 font-black">74% of Goal Achieved</span>
              <span>$2.50M</span>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  )
}
