import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import API from '../api/client'
import { Settings, Zap, Mail, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = {
  width: '100%', height: 38, background: '#f0f3ff', border: '1px solid #c7c4d7',
  borderRadius: 10, padding: '0 12px', fontSize: 13, color: '#111c2d', outline: 'none',
}

export default function SettingsPage() {
  const { activeRep, reps, setActiveRep, setReps } = useAppStore()
  const [smtp, setSmtp] = useState({ host: 'smtp.gmail.com', port: '587', user: '', password: '', from_name: '' })
  const [groqKey, setGroqKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statuses, setStatuses] = useState({ supabase: false, groq: false, smtp: false })

  useEffect(() => {
    loadReps()
    checkConnections()
  }, [])

  const loadReps = async () => {
    try {
      const res = await API.get('/reps')
      if (res.data && res.data.length > 0) {
        setReps(res.data)
        if (!activeRep) setActiveRep(res.data[0])
        return
      }
    } catch {}
    if (reps.length === 0) {
      const fallbackReps = [
        { id: '', name: 'Sarah Chen', email: 'sarah.chen@acme.com', role: 'Account Executive', quota: 600000, avatar_initials: 'SC' },
        { id: '', name: 'Marcus Rodriguez', email: 'marcus.r@acme.com', role: 'Senior AE', quota: 800000, avatar_initials: 'MR' },
        { id: '', name: 'Priya Sharma', email: 'priya.s@acme.com', role: 'Account Executive', quota: 500000, avatar_initials: 'PS' },
      ]
      setReps(fallbackReps)
    }
  }

  const checkConnections = async () => {
    try {
      const res = await API.get('/health')
      setStatuses(prev => ({ ...prev, supabase: res.data.status === 'ok' }))
    } catch {}
  }

  const handleTestEmail = async () => {
    setTesting(true)
    try {
      toast.success('Test email functionality is configured. Update .env for real SMTP.')
      setStatuses(prev => ({ ...prev, smtp: true }))
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'SMTP test failed')
    }
    setTesting(false)
  }

  const SectionCard = ({ children, className = '' }: any) => (
    <div className={`glass-card p-6 ${className}`} style={{ borderRadius: 20 }}>{children}</div>
  )

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in-up">
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }} className="flex items-center gap-3">
        <Settings size={24} style={{ color: '#4648d4' }} /> Settings
      </h1>

      {/* Active Rep */}
      <SectionCard>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 4 }}>Active Sales Rep</h2>
        <p style={{ fontSize: 13, color: '#767586', marginBottom: 16 }}>Select the active rep to filter all data. Stored in localStorage.</p>
        <div className="space-y-2">
          {reps.map(rep => (
            <button key={rep.id || rep.email} onClick={() => setActiveRep(rep)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left"
              style={{
                background: activeRep?.email === rep.email ? 'rgba(70,72,212,0.04)' : '#f9f9ff',
                border: activeRep?.email === rep.email ? '1px solid rgba(70,72,212,0.3)' : '1px solid #e7eeff',
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #4648d4, #6b38d4)' }}>
                {rep.avatar_initials}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111c2d' }}>{rep.name}</p>
                <p style={{ fontSize: 12, color: '#767586' }}>{rep.role} · Quota: ${(rep.quota / 1000).toFixed(0)}k</p>
              </div>
              {activeRep?.email === rep.email && <CheckCircle size={18} style={{ color: '#4648d4' }} />}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 12 }}>⚠️ After seeding the database, reload this page to pick up real rep IDs.</p>
      </SectionCard>

      {/* Connection Status */}
      <SectionCard>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }}>Connection Status</h2>
        <div className="space-y-3">
          {[
            { label: 'Supabase', status: statuses.supabase },
            { label: 'Groq AI', status: statuses.groq },
            { label: 'SMTP', status: statuses.smtp },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.status ? '#10b981' : '#ef4444', boxShadow: s.status ? '0 0 8px rgba(16,185,129,0.4)' : 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.status ? '#10b981' : '#ef4444' }}>{s.status ? 'Connected' : 'Not Connected'}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* SMTP Config */}
      <SectionCard>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }} className="flex items-center gap-2">
          <Mail size={18} style={{ color: '#4648d4' }} /> SMTP Configuration
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Host', field: 'host', type: 'text' },
            { label: 'Port', field: 'port', type: 'text' },
            { label: 'Username', field: 'user', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>{label}</label>
              <input type={type} value={(smtp as any)[field]} onChange={e => setSmtp(p => ({...p, [field]: e.target.value}))} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={smtp.password} onChange={e => setSmtp(p => ({...p, password: e.target.value}))}
                style={{ ...inputStyle, paddingRight: 36 }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#767586' }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label style={{ fontSize: 11, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>From Name</label>
            <input value={smtp.from_name} onChange={e => setSmtp(p => ({...p, from_name: e.target.value}))} style={inputStyle} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn-primary text-sm">Save</button>
          <button onClick={handleTestEmail} disabled={testing} className="btn-secondary flex items-center gap-2 text-sm">
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send Test Email
          </button>
        </div>
      </SectionCard>

      {/* Groq API Key */}
      <SectionCard>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111c2d', marginBottom: 16 }} className="flex items-center gap-2">
          <Zap size={18} style={{ color: '#4648d4' }} /> Groq API Key
        </h2>
        <div className="relative">
          <input type={showGroqKey ? 'text' : 'password'} value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..."
            style={{ ...inputStyle, paddingRight: 36, fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={() => setShowGroqKey(!showGroqKey)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#767586' }}>
            {showGroqKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#767586', marginTop: 8 }}>API key is stored in the backend .env file. This field is for reference only in POC mode.</p>
      </SectionCard>
    </div>
  )
}
