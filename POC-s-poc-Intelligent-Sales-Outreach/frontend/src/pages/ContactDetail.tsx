import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { contactsApi } from '../api/client'
import { Mail, Phone, MessageCircle, Globe, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import EmailIntelligence from '../components/EmailIntelligence'

export default function ContactDetail() {
  const { id } = useParams()
  const [contact, setContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => { if (id) loadContact() }, [id])

  const loadContact = async () => {
    setLoading(true)
    try {
      const res = await contactsApi.get(id!)
      setContact(res.data)
    } catch { toast.error('Failed to load contact') }
    setLoading(false)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )
  if (!contact) return <p style={{ color: '#767586' }}>Contact not found</p>

  const tabs = ['overview', 'emails', 'deals', 'tasks', 'calls']

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6 flex items-center gap-5" style={{ borderRadius: 24 }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4648d4, #6b38d4)' }}>
          {contact.name?.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111c2d' }}>{contact.name}</h1>
          <p style={{ color: '#767586', fontSize: 13, marginTop: 4 }}>{contact.title} · {contact.companies?.name}</p>
          <div className="flex gap-2 mt-3">
            <Link to={`/email/compose?contact_id=${contact.id}`} className="btn-primary flex items-center gap-1.5 text-xs no-underline" style={{ padding: '8px 16px' }}>
              <Mail size={13} /> Email
            </Link>
            {contact.whatsapp_number && (
              <a href={`https://wa.me/${contact.whatsapp_number.replace('+', '').replace(/\s/g, '')}`} target="_blank"
                className="btn-secondary flex items-center gap-1.5 text-xs no-underline" style={{ padding: '8px 16px' }}>
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
          </div>
        </div>
        {/* Activity score ring */}
        <div className="text-center flex-shrink-0">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#e7eeff" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#4648d4" strokeWidth="3"
                strokeDasharray={`${contact.activity_score}, 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#4648d4' }}>{contact.activity_score}</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#767586', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize"
            style={{
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#4648d4' : '#767586',
              boxShadow: tab === t ? '0 2px 8px rgba(70,72,212,0.1)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Email', value: contact.email },
            { icon: Phone, label: 'Phone', value: contact.phone },
            { icon: Globe, label: 'Language', value: contact.preferred_language },
            { icon: Clock, label: 'Timezone', value: contact.timezone },
            { icon: MessageCircle, label: 'WhatsApp', value: contact.whatsapp_number, link: contact.whatsapp_number ? `https://wa.me/${contact.whatsapp_number.replace('+', '').replace(/\s/g, '')}` : null },
          ].map(item => (
            <div key={item.label} className="glass-card p-4 flex items-center gap-3" style={{ borderRadius: 16 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e1e0ff' }}>
                <item.icon size={16} style={{ color: '#4648d4' }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                {item.link
                  ? <a href={item.link} target="_blank" style={{ fontSize: 13, color: '#4648d4', fontWeight: 500, textDecoration: 'none' }}>{item.value}</a>
                  : <p style={{ fontSize: 13, color: '#111c2d', fontWeight: 500 }}>{item.value || '—'}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emails Tab */}
      {tab === 'emails' && (
        <div className="space-y-6">
          <EmailIntelligence contactName={contact.name} contactEmail={contact.email} />
          
          <div className="pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Platform Campaigns</h4>
            <div className="space-y-2">
              {(contact.emails || []).map((e: any) => (
                <div key={e.id} className="glass-card p-4 flex items-center gap-3" style={{ borderRadius: 16 }}>
                  <Mail size={14} style={{ color: e.status === 'sent' ? '#10b981' : e.status === 'opened' ? '#4648d4' : '#767586' }} />
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{e.subject}</p>
                    <p style={{ fontSize: 11, color: '#767586' }}>{e.sent_at?.split('T')[0] || e.created_at?.split('T')[0]}</p>
                  </div>
                  <span className="badge" style={{
                    background: e.status === 'sent' ? '#dcfce7' : e.status === 'opened' ? '#e1e0ff' : '#e2e8f0',
                    color: e.status === 'sent' ? '#166534' : e.status === 'opened' ? '#4648d4' : '#767586',
                  }}>{e.status}</span>
                </div>
              ))}
              {(!contact.emails || contact.emails.length === 0) && <p style={{ color: '#767586', textAlign: 'center', padding: '16px 0' }}>No emails sent via platform</p>}
            </div>
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {tab === 'deals' && (
        <div className="space-y-2">
          {(contact.deals || []).map((d: any) => (
            <Link key={d.id} to={`/deals/${d.id}`} className="glass-card p-4 flex items-center justify-between transition-all no-underline hover:-translate-y-0.5 group" style={{ borderRadius: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }} className="group-hover:text-primary transition-colors">{d.title}</p>
                <p style={{ fontSize: 11, color: '#767586' }}>{d.stage}</p>
              </div>
              <span className="font-mono" style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>${d.amount?.toLocaleString()}</span>
            </Link>
          ))}
          {(!contact.deals || contact.deals.length === 0) && <p style={{ color: '#767586', textAlign: 'center', padding: '32px 0' }}>No deals</p>}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-2">
          {(contact.tasks || []).map((t: any) => (
            <div key={t.id} className="glass-card p-4 flex items-center gap-3" style={{ borderRadius: 16 }}>
              <CheckCircle size={14} style={{ color: t.status === 'completed' ? '#10b981' : '#c7c4d7' }} />
              <div className="flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{t.title}</p>
                <p style={{ fontSize: 11, color: '#767586' }}>{t.due_date} · {t.type}</p>
              </div>
              <span className="badge" style={{
                background: t.status === 'completed' ? '#dcfce7' : '#e2e8f0',
                color: t.status === 'completed' ? '#166534' : '#767586',
              }}>{t.status}</span>
            </div>
          ))}
          {(!contact.tasks || contact.tasks.length === 0) && <p style={{ color: '#767586', textAlign: 'center', padding: '32px 0' }}>No tasks</p>}
        </div>
      )}

      {/* Calls Tab */}
      {tab === 'calls' && (
        <div className="space-y-2">
          {(contact.calls || []).map((c: any) => (
            <div key={c.id} className="glass-card p-4" style={{ borderRadius: 16 }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
                  <Phone size={14} style={{ color: '#10b981' }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111c2d' }}>{c.summary || 'No summary'}</p>
                  <p style={{ fontSize: 11, color: '#767586' }}>{c.call_date?.split('T')[0]}</p>
                </div>
                <span className="badge" style={{
                  background: c.sentiment === 'Positive' ? '#dcfce7' : c.sentiment === 'Negative' ? '#ffdad6' : '#fef3c7',
                  color: c.sentiment === 'Positive' ? '#166534' : c.sentiment === 'Negative' ? '#93000a' : '#92400e',
                }}>{c.sentiment || 'Pending'}</span>
              </div>
            </div>
          ))}
          {(!contact.calls || contact.calls.length === 0) && <p style={{ color: '#767586', textAlign: 'center', padding: '32px 0' }}>No calls</p>}
        </div>
      )}
    </div>
  )
}
