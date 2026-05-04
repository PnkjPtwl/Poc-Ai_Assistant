import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { contactsApi, dealsApi, emailsApi, aiApi, callsApi } from '../api/client'
import { Send, Clock, Sparkles, Globe, FileText, Phone, ChevronDown, Loader2, BarChart2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailComposer() {
  const { activeRep } = useAppStore()
  const [searchParams] = useSearchParams()
  const [contacts, setContacts] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [language, setLanguage] = useState('English')
  const [translatedSubject, setTranslatedSubject] = useState('')
  const [translatedBody, setTranslatedBody] = useState('')
  const [showTranslation, setShowTranslation] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [contextData, setContextData] = useState<any>(null)
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [emailHistory, setEmailHistory] = useState<any[]>([])
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  // ── Email Scorer state ──
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreResult, setScoreResult] = useState<{ score: number; tone: string; reasons: string[]; improvement: string } | null>(null)
  const [targetTone, setTargetTone] = useState('Professional')
  const [optimizeLoading, setOptimizeLoading] = useState(false)

  useEffect(() => {
    const cid = searchParams.get('contact_id')
    const did = searchParams.get('deal_id')
    if (cid) {
      contactsApi.get(cid).then(r => { setSelectedContact(r.data); setContactSearch(r.data.name) })
    }
    if (did) {
      dealsApi.get(did).then(r => setSelectedDeal(r.data))
    }
  }, [searchParams])

  useEffect(() => {
    if (contactSearch.length > 1) {
      contactsApi.list({ search: contactSearch, limit: '8' }).then(r => setContacts(r.data || []))
    }
  }, [contactSearch])

  useEffect(() => {
    if (selectedContact) {
      dealsApi.list({ limit: '10' }).then(r => {
        const filtered = (r.data || []).filter((d: any) => d.contact_id === selectedContact.id)
        setDeals(filtered)
        if (filtered.length > 0 && !selectedDeal) setSelectedDeal(filtered[0])
      })
      callsApi.list({ contact_id: selectedContact.id }).then(r => setTranscripts(r.data || []))
      if (selectedContact.preferred_language && selectedContact.preferred_language !== 'English') {
        setLanguage(selectedContact.preferred_language)
      }
    }
  }, [selectedContact])

  useEffect(() => {
    if (selectedDeal) {
      emailsApi.list({ deal_id: selectedDeal.id, limit: '10' }).then(r => setEmailHistory(r.data || []))
    }
  }, [selectedDeal])

  const handleAIDraft = async () => {
    if (!selectedContact) { toast.error('Select a contact first'); return }
    setAiLoading(true)
    try {
      const res = await aiApi.draftEmail({
        contact_id: selectedContact.id,
        deal_id: selectedDeal?.id,
        intent: 'follow-up',
        language: language !== 'English' ? language : undefined,
        transcript_id: selectedTranscriptId,
        rep_id: activeRep?.id,
      })
      setSubject(res.data.subject || '')
      setBody(res.data.body || '')
      if (res.data.subject_translated) {
        setTranslatedSubject(res.data.subject_translated)
        setTranslatedBody(res.data.body_translated || '')
        setShowTranslation(true)
      }
      toast.success('AI draft generated!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'AI draft failed')
    }
    setAiLoading(false)
  }

  const handleScoreEmail = async () => {
    const currentSubject = showTranslation ? translatedSubject : subject
    const currentBody = showTranslation ? translatedBody : body
    if (!currentSubject.trim() && !currentBody.trim()) {
      toast.error('Write something first before scoring')
      return
    }
    setScoreLoading(true)
    setScoreResult(null)
    try {
      const res = await aiApi.scoreEmail({ subject: currentSubject, body: currentBody })
      setScoreResult(res.data)
    } catch {
      toast.error('Scoring failed — check if backend is running')
    }
    setScoreLoading(false)
  }

  const handleOptimizeEmail = async () => {
    const currentSubject = showTranslation ? translatedSubject : subject
    const currentBody = showTranslation ? translatedBody : body
    setOptimizeLoading(true)
    try {
      const res = await aiApi.optimizeEmail({
        subject: currentSubject,
        body: currentBody,
        target_tone: targetTone
      })
      if (showTranslation) {
        setTranslatedSubject(res.data.subject)
        setTranslatedBody(res.data.body)
      } else {
        setSubject(res.data.subject)
        setBody(res.data.body)
      }
      toast.success(`Email adjusted to ${targetTone} tone!`)
      setScoreResult(null) // Reset score as it needs new analysis
    } catch {
      toast.error('Optimization failed')
    }
    setOptimizeLoading(false)
  }

  const handleSend = async () => {
    if (!selectedContact || !subject || !body) { toast.error('Fill in all fields'); return }
    setSending(true)
    try {
      const draftRes = await emailsApi.draft({
        contact_id: selectedContact.id,
        deal_id: selectedDeal?.id,
        rep_id: activeRep?.id,
        subject: showTranslation ? translatedSubject : subject,
        body: showTranslation ? translatedBody : body,
        language,
      })
      const emailId = draftRes.data.id
      await emailsApi.send(emailId)
      toast.success('Email sent!')
      setSubject(''); setBody(''); setTranslatedSubject(''); setTranslatedBody('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Send failed')
    }
    setSending(false)
  }

  const handleSchedule = async () => {
    if (!selectedContact || !subject || !body || !scheduleDate) { toast.error('Fill in all fields + schedule time'); return }
    setSending(true)
    try {
      const draftRes = await emailsApi.draft({
        contact_id: selectedContact.id, deal_id: selectedDeal?.id, rep_id: activeRep?.id,
        subject, body, language,
      })
      await emailsApi.schedule(draftRes.data.id, new Date(scheduleDate).toISOString())
      toast.success('Email scheduled!')
      setShowSchedule(false)
    } catch (e: any) { toast.error('Schedule failed') }
    setSending(false)
  }

  const sentimentBadge: Record<string, { bg: string; color: string }> = {
    Positive: { bg: '#dcfce7', color: '#166534' },
    Neutral: { bg: '#fef3c7', color: '#92400e' },
    Negative: { bg: '#ffdad6', color: '#93000a' },
  }

  const inputStyle = {
    width: '100%', height: 40, background: '#f0f3ff', border: '1px solid #c7c4d7',
    borderRadius: 12, padding: '0 16px', fontSize: 13, color: '#111c2d', outline: 'none',
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-128px)] animate-fade-in-up">
      {/* Left Pane - Compose */}
      <div className="flex-[3] flex flex-col space-y-4 min-w-0">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111c2d', letterSpacing: '-0.02em' }}>Email Composer</h1>

        {/* To field */}
        <div className="relative">
          <label style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>To</label>
          <input value={contactSearch} onChange={e => { setContactSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search contacts..."
            style={{ ...inputStyle }} />
          {showDropdown && contacts.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 20, width: '100%', marginTop: 4, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', border: '1px solid #c7c4d7', borderRadius: 16, boxShadow: '0 20px 60px rgba(15,23,42,0.12)', maxHeight: 200, overflowY: 'auto' }}>
              {contacts.map(c => (
                <button key={c.id} onClick={() => { setSelectedContact(c); setContactSearch(c.name); setShowDropdown(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f3ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <p style={{ fontSize: 13, color: '#111c2d', fontWeight: 600, margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: '#767586', margin: 0 }}>{c.email} · {c.companies?.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Deal selector */}
        {deals.length > 0 && (
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Deal</label>
            <select value={selectedDeal?.id || ''} onChange={e => setSelectedDeal(deals.find((d: any) => d.id === e.target.value))}
              style={{ ...inputStyle, appearance: 'auto', background: '#f0f3ff' }}>
              {deals.map((d: any) => <option key={d.id} value={d.id}>{d.title} — {d.stage}</option>)}
            </select>
          </div>
        )}

        {/* Subject */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Subject</label>
          <input value={showTranslation ? translatedSubject : subject}
            onChange={e => showTranslation ? setTranslatedSubject(e.target.value) : setSubject(e.target.value)}
            placeholder="Email subject..."
            style={{ ...inputStyle }} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleAIDraft} disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, rgba(70,72,212,0.1), rgba(107,56,212,0.1))', border: '1px solid rgba(70,72,212,0.3)', color: '#4648d4' }}>
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {aiLoading ? 'AI is drafting...' : 'AI Draft'}
          </button>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            style={{ height: 38, background: '#f0f3ff', border: '1px solid #e7eeff', borderRadius: 10, padding: '0 12px', fontSize: 13, color: '#464554', outline: 'none' }}>
            <option value="English">🇬🇧 English</option>
            <option value="Spanish">🇪🇸 Español</option>
            <option value="French">🇫🇷 Français</option>
            <option value="German">🇩🇪 Deutsch</option>
          </select>
          {translatedBody && (
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e7eeff' }}>
              <button onClick={() => setShowTranslation(false)} className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ background: !showTranslation ? '#e1e0ff' : '#f0f3ff', color: !showTranslation ? '#4648d4' : '#767586' }}>English</button>
              <button onClick={() => setShowTranslation(true)} className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ background: showTranslation ? '#e1e0ff' : '#f0f3ff', color: showTranslation ? '#4648d4' : '#767586' }}>{language}</button>
            </div>
          )}
          {/* Score button */}
          <button onClick={handleScoreEmail} disabled={scoreLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ml-auto"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}>
            {scoreLoading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
            {scoreLoading ? 'Scoring...' : 'Score Email'}
          </button>
        </div>

        {/* AI Loading State */}
        {aiLoading && (
          <div className="rounded-2xl p-6 space-y-3" style={{ background: 'rgba(70,72,212,0.04)', border: '1px solid rgba(70,72,212,0.15)' }}>
            <div className="flex items-center gap-2" style={{ color: '#4648d4' }}><Sparkles size={16} className="ai-pulse" /><span className="text-sm font-semibold ai-pulse">✦ AI is drafting your email...</span></div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          </div>
        )}

        {/* Score Result Panel */}
        {scoreResult && (
          <div className="rounded-2xl p-5 space-y-4 animate-fade-in-up" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e7eeff', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart2 size={18} style={{ color: '#059669' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111c2d' }}>Reply Probability Score</span>
              </div>
              <button onClick={() => setScoreResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#767586' }}>
                <XCircle size={16} />
              </button>
            </div>

            {/* Score gauge */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e7eeff" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" strokeWidth="3"
                    stroke={scoreResult.score >= 75 ? '#10b981' : scoreResult.score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeDasharray={`${scoreResult.score}, 100`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontSize: 18, fontWeight: 800, color: scoreResult.score >= 75 ? '#10b981' : scoreResult.score >= 50 ? '#f59e0b' : '#ef4444' }}>{scoreResult.score}</span>
                  <span style={{ fontSize: 9, color: '#767586', fontWeight: 600 }}>/ 100</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge" style={{
                    background: scoreResult.score >= 75 ? '#dcfce7' : scoreResult.score >= 50 ? '#fef3c7' : '#ffdad6',
                    color: scoreResult.score >= 75 ? '#166534' : scoreResult.score >= 50 ? '#92400e' : '#93000a',
                    fontSize: 11,
                  }}>
                    {scoreResult.score >= 75 ? '✅ Strong' : scoreResult.score >= 50 ? '⚠️ Good' : '❌ Needs Work'}
                  </span>
                  <span className="badge" style={{ background: '#e1e0ff', color: '#4648d4', fontSize: 11 }}>{scoreResult.tone}</span>
                </div>
                <div className="space-y-1.5">
                  {scoreResult.reasons.map((r, i) => {
                    const isPositive = !r.toLowerCase().startsWith('no ') && !r.toLowerCase().includes('generic') && !r.toLowerCase().includes('vague') && !r.toLowerCase().includes('missing') && !r.toLowerCase().includes('weak') && !r.toLowerCase().includes('too')
                    return (
                      <div key={i} className="flex items-start gap-1.5" style={{ fontSize: 12, color: '#464554' }}>
                        {isPositive
                          ? <CheckCircle2 size={12} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                          : <AlertCircle size={12} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />}
                        {r}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Improvement tip */}
            {scoreResult.improvement && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(70,72,212,0.05)', border: '1px solid rgba(70,72,212,0.15)' }}>
                  <Sparkles size={13} style={{ color: '#4648d4', marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#4648d4', fontWeight: 500, margin: 0 }}>💡 {scoreResult.improvement}</p>
                </div>

                <div className="flex items-center gap-3 p-1">
                  <div className="flex-1">
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Adjust Tone To</label>
                    <select 
                      value={targetTone} 
                      onChange={e => setTargetTone(e.target.value)}
                      style={{ ...inputStyle, height: 32, fontSize: 12 }}
                    >
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Persuasive">Persuasive</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleOptimizeEmail}
                    disabled={optimizeLoading}
                    className="btn-primary flex items-center gap-2 text-xs h-[32px] mt-4"
                    style={{ background: '#4648d4' }}
                  >
                    {optimizeLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Apply & Adjust
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <textarea value={showTranslation ? translatedBody : body}
          onChange={e => showTranslation ? setTranslatedBody(e.target.value) : setBody(e.target.value)}
          placeholder="Write your email..."
          style={{ flex: 1, minHeight: 200, background: '#f0f3ff', border: '1px solid #c7c4d7', borderRadius: 16, padding: 16, fontSize: 14, color: '#111c2d', outline: 'none', resize: 'none', lineHeight: 1.6 }} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={handleSend} disabled={sending} className="btn-primary flex items-center gap-2 text-sm">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Now
          </button>
          <div className="relative">
            <button onClick={() => setShowSchedule(!showSchedule)} className="btn-secondary flex items-center gap-2 text-sm">
              <Clock size={16} /> Schedule
            </button>
            {showSchedule && (
              <div style={{ position: 'absolute', bottom: '100%', marginBottom: 8, left: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', border: '1px solid #c7c4d7', borderRadius: 16, padding: 16, boxShadow: '0 20px 60px rgba(15,23,42,0.12)', zIndex: 20, width: 288 }}>
                <p style={{ fontSize: 11, color: '#767586', marginBottom: 8 }}>Schedule for:</p>
                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 8 }} />
                {selectedContact?.timezone && <p style={{ fontSize: 11, color: '#767586', marginBottom: 8 }}>Recipient timezone: {selectedContact.timezone}</p>}
                <button onClick={handleSchedule} className="btn-primary w-full text-sm">Confirm Schedule</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane - Context Panel */}
      <div className="flex-[2] space-y-4 overflow-y-auto min-w-[300px]">
        <h2 style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Context Panel</h2>

        {selectedDeal && (
          <div className="glass-card p-5 space-y-3" style={{ borderRadius: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deal</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111c2d' }}>{selectedDeal.title}</p>
            <div className="grid grid-cols-2 gap-2" style={{ fontSize: 12 }}>
              <div><span style={{ color: '#767586' }}>Stage:</span> <span style={{ color: '#111c2d', fontWeight: 500 }}>{selectedDeal.stage}</span></div>
              <div><span style={{ color: '#767586' }}>Amount:</span> <span className="font-mono" style={{ color: '#10b981', fontWeight: 600 }}>${selectedDeal.amount?.toLocaleString()}</span></div>
              <div><span style={{ color: '#767586' }}>Close:</span> <span style={{ color: '#111c2d' }}>{selectedDeal.close_date}</span></div>
              <div><span style={{ color: '#767586' }}>Prob:</span> <span style={{ color: '#111c2d' }}>{selectedDeal.probability}%</span></div>
            </div>
          </div>
        )}

        {selectedContact && (
          <div className="glass-card p-5 space-y-3" style={{ borderRadius: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111c2d' }}>{selectedContact.name}</p>
            <p style={{ fontSize: 12, color: '#767586' }}>{selectedContact.title} · {selectedContact.companies?.name}</p>
            <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
              <span style={{ color: '#767586' }}>🌐 {selectedContact.timezone}</span>
              <span style={{ color: '#767586' }}>🗣️ {selectedContact.preferred_language}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: '#767586' }}>Activity:</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e7eeff' }}>
                <div className="h-full rounded-full" style={{ width: `${selectedContact.activity_score}%`, background: '#4648d4' }} />
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: '#4648d4', fontWeight: 600 }}>{selectedContact.activity_score}</span>
            </div>
          </div>
        )}

        {/* Call Transcripts */}
        {transcripts.length > 0 && (
          <div className="glass-card p-5 space-y-3" style={{ borderRadius: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Call Transcripts</p>
            {transcripts.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl space-y-2" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: '#767586' }}>{t.call_date?.split('T')[0]}</span>
                  <span className="badge" style={{ background: sentimentBadge[t.sentiment]?.bg || '#e2e8f0', color: sentimentBadge[t.sentiment]?.color || '#475569' }}>{t.sentiment}</span>
                </div>
                <p style={{ fontSize: 12, color: '#464554' }} className="line-clamp-2">{t.summary}</p>
                {t.key_topics && <div className="flex flex-wrap gap-1">{(t.key_topics || []).map((topic: string) => (
                  <span key={topic} style={{ fontSize: 10, padding: '2px 6px', background: '#e1e0ff', borderRadius: 4, color: '#4648d4' }}>{topic}</span>
                ))}</div>}
                <button onClick={() => { setSelectedTranscriptId(t.id); toast.success('Transcript will be used in next AI draft') }}
                  style={{ fontSize: 12, fontWeight: 600, color: selectedTranscriptId === t.id ? '#4648d4' : '#767586', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {selectedTranscriptId === t.id ? '✓ Selected for Draft' : 'Use in Draft'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Email Thread */}
        {emailHistory.length > 0 && (
          <div className="glass-card p-5 space-y-3" style={{ borderRadius: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Thread</p>
            {emailHistory.map((e: any) => (
              <div key={e.id} className="p-3 rounded-xl space-y-1" style={{ background: '#f0f3ff', border: '1px solid #e7eeff' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: '#111c2d', fontWeight: 600 }} className="truncate flex-1">{e.subject}</span>
                  <span className="badge ml-2" style={{
                    background: e.status === 'sent' ? '#dcfce7' : e.status === 'opened' ? '#e1e0ff' : e.status === 'replied' ? '#e9ddff' : '#e2e8f0',
                    color: e.status === 'sent' ? '#166534' : e.status === 'opened' ? '#4648d4' : e.status === 'replied' ? '#6b38d4' : '#767586',
                  }}>
                    {e.status}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#767586' }}>{e.sent_at?.split('T')[0] || e.created_at?.split('T')[0]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
