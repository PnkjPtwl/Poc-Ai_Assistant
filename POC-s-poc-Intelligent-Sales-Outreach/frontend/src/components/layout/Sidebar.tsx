import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import {
  LayoutDashboard, ListTodo, Mail, GitBranch, Target, BarChart3,
  Phone, Users, Briefcase, Settings, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/email/compose', icon: Mail, label: 'Composer' },
  { to: '/flows', icon: GitBranch, label: 'Flows' },
  { to: '/plays', icon: Target, label: 'Plays' },
  { to: '/forecast', icon: BarChart3, label: 'Forecast' },
  { to: '/calls', icon: Phone, label: 'Calls' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarExpanded, toggleSidebar } = useAppStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#161B27] border-r border-white/[0.06] z-50 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'w-[220px]' : 'w-[60px]'}`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06] gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        {sidebarExpanded && (
          <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">Vantage AI Outreach</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-[#8B95A5] hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarExpanded && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="h-12 flex items-center justify-center border-t border-white/[0.06] text-[#525B6B] hover:text-white transition-colors"
      >
        {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  )
}
