import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Search, X } from 'lucide-react'
import API from '../../api/client'
import StaggeredMenu from '../animations/StaggeredMenu'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
  const { activeRep } = useAppStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<any>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setSearching(true)
    try {
      // Search deals and contacts in parallel
      const [dealsRes, contactsRes] = await Promise.all([
        API.get('/deals', { params: { limit: 50 } }),
        API.get('/contacts', { params: { limit: 50 } }),
      ])
      const lower = q.toLowerCase()

      const matchedDeals = (dealsRes.data || [])
        .filter((d: any) =>
          d.title?.toLowerCase().includes(lower) ||
          d.stage?.toLowerCase().includes(lower) ||
          d.contacts?.name?.toLowerCase().includes(lower) ||
          d.companies?.name?.toLowerCase().includes(lower)
        )
        .slice(0, 5)
        .map((d: any) => ({ type: 'deal', id: d.id, label: d.title, sub: `${d.stage} · $${d.amount?.toLocaleString()}`, route: `/deals/${d.id}` }))

      const matchedContacts = (contactsRes.data || [])
        .filter((c: any) =>
          c.name?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower) ||
          c.title?.toLowerCase().includes(lower)
        )
        .slice(0, 4)
        .map((c: any) => ({ type: 'contact', id: c.id, label: c.name, sub: `${c.title || ''} · ${c.email || ''}`, route: `/contacts/${c.id}` }))

      setResults([...matchedDeals, ...matchedContacts])
      setOpen(true)
    } catch { setResults([]) }
    setSearching(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  const handleSelect = (route: string) => {
    navigate(route)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].route)
  }

  return (
    <header className="h-16 bg-[#161B27]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-6 flex-1 max-w-md">
        <div className="z-[60] flex items-center -ml-2">
          <StaggeredMenu
            isFixed={true}
            position="left"
            accentColor="#3b82f6"
            colors={['#161B27', '#1C2333', '#252D3F']}
            items={[
              { label: 'Dashboard', link: '/', onClick: () => navigate('/') },
              { label: 'Task Queue', link: '/tasks', onClick: () => navigate('/tasks') },
              { label: 'Email Composer', link: '/email/compose', onClick: () => navigate('/email/compose') },
              { label: 'Flows', link: '/flows', onClick: () => navigate('/flows') },
              { label: 'Plays', link: '/plays', onClick: () => navigate('/plays') },
              { label: 'Forecast', link: '/forecast', onClick: () => navigate('/forecast') },
              { label: 'Transcripts', link: '/calls', onClick: () => navigate('/calls') },
              { label: 'Settings', link: '/settings', onClick: () => navigate('/settings') },
            ]}
          />
        </div>

        {/* Global Search */}
        <div className="relative w-full" ref={searchRef}>
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searching ? 'text-blue-400' : 'text-[#525B6B]'}`} />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true) }}
            placeholder="Search deals, contacts..."
            className="w-full h-9 bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-8 text-sm text-white placeholder-[#525B6B] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#525B6B] hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}

          {/* Dropdown Results */}
          {open && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              marginTop: '6px', background: '#1C2333',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden', zIndex: 9999,
            }}>
              {results.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: '11px', color: '#525B6B' }}>
                  No results for "{query}"
                </div>
              ) : (
                <>
                  {results.some(r => r.type === 'deal') && (
                    <div style={{ padding: '8px 12px 4px', fontSize: '10px', color: '#525B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Deals
                    </div>
                  )}
                  {results.filter(r => r.type === 'deal').map(r => (
                    <button key={r.id} onClick={() => handleSelect(r.route)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#60A5FA', fontWeight: 700 }}>$</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: '#F0F2F5', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{r.label}</p>
                        <p style={{ fontSize: 10, color: '#525B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{r.sub}</p>
                      </div>
                    </button>
                  ))}

                  {results.some(r => r.type === 'contact') && (
                    <div style={{ padding: '8px 12px 4px', fontSize: '10px', color: '#525B6B', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 4 }}>
                      Contacts
                    </div>
                  )}
                  {results.filter(r => r.type === 'contact').map(r => (
                    <button key={r.id} onClick={() => handleSelect(r.route)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#A78BFA', fontWeight: 700 }}>{r.label[0]}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: '#F0F2F5', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{r.label}</p>
                        <p style={{ fontSize: 10, color: '#525B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{r.sub}</p>
                      </div>
                    </button>
                  ))}

                  <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 10, color: '#525B6B', margin: 0 }}>
                      {results.length} result{results.length !== 1 ? 's' : ''} · Press Enter to open first
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right: Rep Selector only */}
      <div className="flex items-center gap-4">
        {activeRep && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {activeRep.avatar_initials || activeRep.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="text-sm">
              <div className="text-white font-medium leading-tight">{activeRep.name}</div>
              <div className="text-[#525B6B] text-[10px] leading-tight">{activeRep.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
