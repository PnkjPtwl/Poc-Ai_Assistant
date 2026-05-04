import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { aiApi } from '../api/client';
import { Send, Sparkles, User, Bot, Mail, Calendar, MessageSquare, Briefcase, CheckCircle, Maximize2, Minimize2, Trash2 } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export default function SmartAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('vantage_chat_history');
    if (saved) return JSON.parse(saved);
    return [{
      id: '1',
      role: 'assistant',
      content: 'Hi! I am **Vantage**, your proactive AI assistant. I have synchronized your executive channels. How can I help you today?',
      timestamp: Date.now()
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // SEO and Persistence
  useEffect(() => {
    document.title = "Vantage AI Assistant | Executive Command Center";
    localStorage.setItem('vantage_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 50); // Small delay to let markdown render completely
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.assistantChat({ message: userMessage.content });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply || 'Sorry, I could not process that request.',
        timestamp: Date.now()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Failed to connect to the Vantage AI backend.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isFullscreen
    ? "fixed inset-0 z-[100] bg-[#f9f9ff] p-2 md:p-4 flex flex-col h-screen w-screen overflow-hidden"
    : "p-2 md:p-3 max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex flex-col overflow-hidden";

  return (
    <div className={containerClass}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center gap-3">
            <Sparkles className="text-emerald-600" size={28} />
            Vantage Assistant
          </h1>
          <p className="text-emerald-800/60 mt-1">Chat with your inbox, pipeline, and calendar—all in one place.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowClearMenu(!showClearMenu)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${showClearMenu ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-emerald-100'}`}
              title="Clear History Options"
            >
              <Trash2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Clear</span>
            </button>
            {showClearMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-emerald-900/10 shadow-2xl rounded-xl py-2 z-[110]">
                {[
                  { label: 'Last Hour', value: 60 * 60 * 1000 },
                  { label: 'Last 24 Hours', value: 24 * 60 * 60 * 1000 },
                  { label: 'Last 7 Days', value: 7 * 24 * 60 * 60 * 1000 },
                  { label: 'Entire History', value: Infinity }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      const mode = opt.label.toLowerCase();
                      if (window.confirm(`ACTION REQUIRED: Permanently delete your ${mode}?`)) {
                        const now = Date.now();
                        
                        if (opt.value === Infinity) {
                          // Nuclear wipe
                          localStorage.setItem('vantage_chat_history', JSON.stringify([]));
                          alert("History cleared successfully. System will now restart.");
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                          return;
                        }

                        const cutoff = now - opt.value;
                        setMessages(prev => {
                          const updated = prev.filter(m => {
                            if (m.id === '1') return true; 
                            if (!m.timestamp) return false; 
                            return m.timestamp < cutoff;
                          });
                          localStorage.setItem('vantage_chat_history', JSON.stringify(updated));
                          return [...updated];
                        });
                        
                        setShowClearMenu(false);
                        alert(`Cleared ${mode}.`);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-colors border-b border-emerald-900/5 last:border-0"
                  >
                    Clear {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden" style={{ border: '1px solid rgba(6, 78, 59, 0.1)' }}>
        
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex gap-4 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`py-3 px-4 md:py-3 md:px-5 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-900 text-white rounded-tr-none' : 'bg-white border border-emerald-900/10 rounded-tl-none shadow-sm'}`}>
                <div className={`prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-3 text-[14px] leading-[1.6] ${msg.role === 'user' ? 'prose-invert' : 'prose-emerald'} ${msg.role === 'user' ? 'text-white' : 'text-emerald-950'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-emerald-900/10 rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggested Actions */}
        <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-900/10 flex flex-wrap gap-2">
          {[
            { label: 'Brief me on my inbox', icon: Mail },
            { label: 'Analyze pipeline health', icon: Briefcase },
            { label: 'Review daily schedule', icon: Calendar },
            { label: 'Synchronize Live Channels', icon: CheckCircle, isAction: true },
            { label: 'Draft high-intent follow-up', icon: MessageSquare },
            { label: 'What more can Vantage do?', icon: Sparkles, isCapability: true }
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={async () => { 
                if (action.isAction) {
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Synchronizing your executive channels via secure `.env` protocols...',
                    timestamp: Date.now()
                  }]);
                  setLoading(true);
                  try {
                    const res = await aiApi.connectEmail({ email: '', app_password: '' });
                    setMessages(prev => [...prev, {
                      id: (Date.now() + 1).toString(),
                      role: 'assistant',
                      content: res.data.message,
                      timestamp: Date.now()
                    }]);
                  } catch (err) {
                    setMessages(prev => [...prev, {
                      id: (Date.now() + 1).toString(),
                      role: 'assistant',
                      content: 'Channel sync failed. Please verify secure credentials in environment settings.',
                      timestamp: Date.now()
                    }]);
                  } finally {
                    setLoading(false);
                  }
                } else if (action.isCapability) {
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `### Vantage Executive Capabilities
I am designed to be your autonomous sales command center. Here is what I can do:

1. **Inbox Intelligence**: Summarize threads, identify urgent replies, and draft high-conversion follow-ups.
2. **Pipeline Autonomy**: Update deal stages, calculate "temperature," and suggest next steps to close faster.
3. **Calendar Management**: Brief you on your daily schedule and identify gaps for deep-work or prospecting.
4. **Autonomous Action**: Send emails on your behalf using the \`COMMAND: SEND_EMAIL\` protocol.
5. **Data Enrichment**: Pull real-time context from your CRM to ensure every message is hyper-personalized.

*What would you like me to tackle first?*`,
                    timestamp: Date.now()
                  }]);
                } else {
                  setInput(action.label); 
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-900/10 rounded-full text-[11px] font-bold text-emerald-800 whitespace-nowrap hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <action.icon size={12} className="text-emerald-600" /> {action.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-emerald-900/10">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!input.trim()) return;

            const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setLoading(true);

            try {
              const res = await aiApi.assistantChat({ 
                message: userMessage.content,
                history: messages // Pass existing context
              });
              const rawReply = res.data.reply || 'Sorry, I could not process that request.';
              
              // Filter out internal protocol commands from user view
              const cleanReply = rawReply
                .split('\n')
                .filter(line => !line.trim().startsWith('COMMAND:'))
                .join('\n')
                .trim();

              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanReply,
                timestamp: Date.now()
              }]);
            } catch (err) {
              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Error: Failed to connect to the Vantage AI backend.'
              }]);
            } finally {
              setLoading(false);
            }
          }} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vantage to check emails, draft messages, or manage pipeline..."
              className="w-full pl-6 pr-14 py-4 bg-emerald-50/50 border border-emerald-900/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 placeholder:text-emerald-800/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 w-10 h-10 rounded-full bg-emerald-900 text-white flex items-center justify-center hover:bg-emerald-800 disabled:opacity-50 disabled:hover:bg-emerald-900 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
            Vantage AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
}
