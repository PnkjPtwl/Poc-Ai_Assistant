import { useState } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import TaskQueue from './pages/TaskQueue'
import EmailComposer from './pages/EmailComposer'
import Flows from './pages/Flows'
import FlowDetail from './pages/FlowDetail'
import Plays from './pages/Plays'
import PlayDetail from './pages/PlayDetail'
import ForecastBoard from './pages/ForecastBoard'
import CallTranscripts from './pages/CallTranscripts'
import ContactDetail from './pages/ContactDetail'
import DealDetail from './pages/DealDetail'
import SettingsPage from './pages/Settings'
import PlatformGuide from './pages/PlatformGuide'
import SmartAssistant from './pages/SmartAssistant'

export default function App() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Vantage Sidebar */}
      <nav 
        className={`fixed inset-y-0 left-0 z-50 vantage-nav w-[260px] p-6 flex flex-col gap-8 transition-all duration-500 ease-in-out ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Vantage Logo - Redirects to Guide */}
        <Link to="/guide" className="flex items-center gap-4 mb-4 no-underline group">
          <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-xl">dashboard</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-emerald-950 leading-none">Vantage</h1>
            <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Executive Suite</p>
          </div>
        </Link>

        <div className="flex flex-col gap-2 flex-grow">
          {[
            { label: 'Dashboard',   path: '/',          icon: 'dashboard' },
            { label: 'Pipeline',    path: '/forecast',  icon: 'analytics' },
            { label: 'Task Queue',  path: '/tasks',     icon: 'checklist' },
            { label: 'Vantage AI',  path: '/assistant', icon: 'smart_toy' },
            { label: 'Outreach',    path: '/email/compose', icon: 'mail' },
            { label: 'Workflows',   path: '/flows',     icon: 'account_tree' },
            { label: 'Plays',       path: '/plays',     icon: 'strategy' },
            { label: 'Call Intel',  path: '/calls',     icon: 'record_voice_over' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all no-underline ${location.pathname === item.path ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' : 'text-emerald-800/60 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-emerald-900/5">
          <Link to="/guide" onClick={() => setMenuOpen(false)} className={`flex items-center gap-4 px-4 py-3 rounded-xl no-underline mb-2 ${location.pathname === '/guide' ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' : 'text-emerald-800/60 hover:bg-emerald-50 hover:text-emerald-900'}`}>
            <span className="material-symbols-outlined text-xl">help</span>
            <span className="text-sm font-bold uppercase tracking-widest">Guide & Flows</span>
          </Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 px-4 py-3 text-emerald-800/60 hover:bg-emerald-50 hover:text-emerald-900 no-underline rounded-xl">
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-bold uppercase tracking-widest">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        <header className="h-20 vantage-header sticky top-0 z-40">
          <TopBar onMenuToggle={() => setMenuOpen(!menuOpen)} isMenuOpen={menuOpen} />
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Routes location={location}>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/tasks"         element={<TaskQueue />} />
                <Route path="/email/compose" element={<EmailComposer />} />
                <Route path="/flows"         element={<Flows />} />
                <Route path="/flows/:id"     element={<FlowDetail />} />
                <Route path="/plays"         element={<Plays />} />
                <Route path="/plays/:id"     element={<PlayDetail />} />
                <Route path="/forecast"      element={<ForecastBoard />} />
                <Route path="/calls"         element={<CallTranscripts />} />
                <Route path="/contacts/:id"  element={<ContactDetail />} />
                <Route path="/deals/:id"     element={<DealDetail />} />
                <Route path="/settings"      element={<SettingsPage />} />
                <Route path="/guide"         element={<PlatformGuide />} />
                <Route path="/assistant"     element={<SmartAssistant />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-emerald-950/20 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
