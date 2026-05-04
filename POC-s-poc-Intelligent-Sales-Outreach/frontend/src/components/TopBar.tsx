import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { Search, Bell, Settings, Menu, X } from 'lucide-react'
import { dealsApi, contactsApi } from '../api/client'
import { motion, AnimatePresence } from 'framer-motion'

interface TopBarProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function TopBar({ onMenuToggle, isMenuOpen }: TopBarProps) {
  const { activeRep } = useAppStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setSearching(true)
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        dealsApi.list({ limit: '50' }),
        contactsApi.list({ limit: '50' }),
      ])
      const lower = q.toLowerCase()
      const matchedDeals = (dealsRes?.data || [])
        .filter((d: any) => d.title?.toLowerCase().includes(lower))
        .slice(0, 4)
        .map((d: any) => ({ type: 'deal', id: d.id, label: d.title, sub: d.stage, route: `/deals/${d.id}` }))

      const matchedContacts = (contactsRes?.data || [])
        .filter((c: any) => c.name?.toLowerCase().includes(lower))
        .slice(0, 3)
        .map((c: any) => ({ type: 'contact', id: c.id, label: c.name, sub: c.title, route: `/contacts/${c.id}` }))

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

  return (
    <div className="flex items-center justify-between w-full h-full px-6">
      <div className="flex items-center gap-8">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-emerald-50 text-emerald-900 transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="relative group" ref={searchRef}>
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searching ? 'text-emerald-700' : 'text-slate-400'}`}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { if (results.length > 0) setOpen(true) }}
            placeholder="Search accounts, deals..."
            className="w-64 md:w-96 h-11 pl-12 pr-12 bg-slate-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-900/10 transition-all placeholder:text-slate-500"
          />

          <AnimatePresence>
            {open && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-4 glass-card p-2 z-[100] rounded-2xl"
              >
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <button key={i} onClick={() => { navigate(r.route); setOpen(false); setQuery('') }} 
                      className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-xl transition-all border-none bg-transparent text-left group">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs font-bold">
                        {r.type === 'deal' ? '$' : r.label[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-950">{r.label}</p>
                        <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">{r.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-full hover:bg-emerald-50 text-emerald-700/60 transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-2.5 rounded-full hover:bg-emerald-50 text-emerald-700/60 transition-colors" onClick={() => navigate('/settings')}>
          <Settings size={18} />
        </button>
        
        {activeRep && (
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-emerald-900/5">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1qkNxJInpgQuOLdceukt7SlKTkAGSrBHriV6vVrzszKWhS8OWoL77oEKvjGrMWwsKlD_AHdTnxNguNt2mGC7FLGYPhERbOOhepXXv-8Z8s1EecSuiZyy2yW19JlLuFHxc9BZQ_LZRaMnTkj1WK2nuEESGuWljy_RE8xhL0s86T1WPBel6ITDiunam4KNVWcQFraM20e-UIXYiMDfvmD0m1eWrB8eXZA5PQaVfORGE7rfuWKUEUg9k2D2zmM2vhtEKlRGZV2Vxwg" 
              alt="Profile"
              className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )
}
