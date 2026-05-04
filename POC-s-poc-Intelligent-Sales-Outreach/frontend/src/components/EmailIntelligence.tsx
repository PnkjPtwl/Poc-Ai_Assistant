import { useState } from 'react';
import { Sparkles, Mail, CheckCircle, AlertCircle, Clock, FileText, X } from 'lucide-react';
import { aiApi } from '../api/client';
import toast from 'react-hot-toast';

export default function EmailIntelligence({ contactName, contactEmail }: { contactName: string, contactEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [mode, setMode] = useState<'initial' | 'paste'>('initial');
  const [threadText, setThreadText] = useState('');

  const handleAnalyze = async () => {
    if (!threadText.trim()) {
      toast.error('Please paste an email thread to analyze.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await aiApi.analyzeRawThread({ thread_text: threadText });
      setSummary(res.data);
      setMode('initial');
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze thread. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4" style={{ borderRadius: 16 }}>
        <Sparkles size={32} className="animate-pulse" style={{ color: '#4648d4' }} />
        <p style={{ fontSize: 14, color: '#767586', fontWeight: 500 }} className="animate-pulse">
          Reading email thread and analyzing with AI...
        </p>
      </div>
    );
  }

  if (mode === 'paste') {
    return (
      <div className="glass-card p-5 space-y-4 animate-fade-in-up" style={{ borderRadius: 16, border: '1px solid #e7eeff' }}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111c2d' }} className="flex items-center gap-2">
            <FileText size={18} style={{ color: '#4648d4' }} />
            Paste Email Thread
          </h3>
          <button onClick={() => setMode('initial')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#767586' }}>
          Paste the raw text of an email thread below. Our AI will instantly extract action items, risks, and summarize the relationship.
        </p>
        <textarea
          value={threadText}
          onChange={(e) => setThreadText(e.target.value)}
          placeholder={`From: Prospect\nDate: Today\n\nHi ${contactName},\nThanks for reaching out...`}
          className="w-full p-4 rounded-xl resize-none focus:outline-none focus:ring-2"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '200px', fontSize: 13, color: '#111c2d' }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setMode('initial')} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg">
            Cancel
          </button>
          <button onClick={handleAnalyze} className="btn-primary flex items-center gap-2 text-sm" style={{ padding: '8px 16px', borderRadius: 10 }}>
            <Sparkles size={14} /> Analyze with Groq
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4" style={{ borderRadius: 16, border: '1px dashed #c7c4d7' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#f0f3ff' }}>
          <Sparkles size={24} style={{ color: '#4648d4' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111c2d' }}>AI Inbox Intelligence</h3>
          <p style={{ fontSize: 13, color: '#767586', maxWidth: 400, marginTop: 4 }}>
            Stop reading long email threads. Paste historical emails for {contactEmail} to generate an instant AI summary of the relationship, action items, and objections.
          </p>
        </div>
        <button onClick={() => setMode('paste')} className="btn-primary flex items-center gap-2" style={{ padding: '10px 20px', borderRadius: 12 }}>
          <Sparkles size={16} /> Paste Thread for Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111c2d' }} className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#4648d4' }} />
          AI Thread Summary
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setMode('paste')} className="text-xs font-semibold text-[#4648d4] hover:underline">
            Analyze New Thread
          </button>
          <span className="badge flex items-center gap-1" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
            <Mail size={12} /> {summary.sentiment || 'Neutral'} Sentiment
          </span>
        </div>
      </div>

      <div className="glass-card p-4" style={{ borderRadius: 16, background: '#f8fafc', borderLeft: '4px solid #4648d4' }}>
        <p style={{ fontSize: 14, color: '#111c2d', lineHeight: 1.6 }}>
          {summary.executiveSummary || 'No summary available.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4" style={{ borderRadius: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }} className="flex items-center gap-1.5">
            <CheckCircle size={14} style={{ color: '#10b981' }} /> Action Items
          </h4>
          <ul className="space-y-2">
            {(summary.actionItems || []).map((item: string, idx: number) => (
              <li key={idx} style={{ fontSize: 13, color: '#111c2d' }} className="flex items-start gap-2">
                <span style={{ color: '#4648d4', marginTop: 2 }}>•</span> {item}
              </li>
            ))}
            {(!summary.actionItems || summary.actionItems.length === 0) && (
              <p style={{ fontSize: 13, color: '#767586' }}>No specific action items identified.</p>
            )}
          </ul>
        </div>

        <div className="glass-card p-4" style={{ borderRadius: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#767586', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }} className="flex items-center gap-1.5">
            <AlertCircle size={14} style={{ color: '#ef4444' }} /> Objections / Risks
          </h4>
          <ul className="space-y-2">
            {(summary.objections || []).map((item: string, idx: number) => (
              <li key={idx} style={{ fontSize: 13, color: '#111c2d' }} className="flex items-start gap-2">
                <span style={{ color: '#ef4444', marginTop: 2 }}>•</span> {item}
              </li>
            ))}
            {(!summary.objections || summary.objections.length === 0) && (
              <p style={{ fontSize: 13, color: '#767586' }}>No major risks or objections identified.</p>
            )}
          </ul>
        </div>
      </div>
      
      <div className="text-right">
        <p style={{ fontSize: 11, color: '#a0aec0' }} className="flex items-center justify-end gap-1">
          <Clock size={12} /> Last synced: Just now
        </p>
      </div>
    </div>
  );
}
