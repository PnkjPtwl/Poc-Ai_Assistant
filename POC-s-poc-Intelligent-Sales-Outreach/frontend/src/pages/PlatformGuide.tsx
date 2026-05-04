import { motion } from 'framer-motion'
import { Rocket, Workflow, Cpu, Sparkles, Target, Zap, MessageSquare, BarChart3, ClipboardList, Send, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PlatformGuide() {
  const categories = [
    {
      title: "Core Lifecycle",
      icon: Rocket,
      description: "Understand the end-to-end journey from raw lead to closed enterprise deal.",
      steps: [
        { name: "Radar Detection", desc: "AI scans CRM data to find high-intent signals." },
        { name: "Neural Analysis", desc: "Sentiment and velocity scoring determines priority." },
        { name: "Strategic Outreach", desc: "Multi-channel flows engage decision makers." }
      ]
    },
    {
      title: "Advanced Workflows",
      icon: Workflow,
      description: "Deep dive into automated sequences and territory mapping logic.",
      steps: [
        { name: "Automated Sequences", desc: "Pre-built plays for new leads and stale deals." },
        { name: "Multi-Channel Sync", desc: "Coordinated Email, LinkedIn, and Phone touchpoints." },
        { name: "Smart Follow-ups", desc: "AI-timed reminders based on prospect behavior." }
      ]
    },
    {
      title: "AI Features",
      icon: Cpu,
      description: "Leverage machine learning for predictive forecasting and coaching.",
      steps: [
        { name: "Email Scorer", desc: "Real-time reply-probability and tone adjustment." },
        { name: "Deal Temperature", desc: "Emoji-based health signals with AI reasoning." },
        { name: "Call Intelligence", desc: "Automated transcript summaries and next steps." }
      ]
    }
  ]

  const flows = [
    {
      id: 1,
      title: "1. Identify Opportunities",
      feature: "The Deal Radar",
      description: "The platform starts by surfacing high-intent deals. Our AI monitors your CRM 24/7 to find the 'hidden gems' that need attention.",
      howTo: [
        "Go to your Executive Dashboard.",
        "Check the 'Strategic Tasks' for AI-prioritized actions.",
        "Review the 'Deal Pipeline' for high-value forecast signals."
      ],
      tip: "Prioritize deals with 'Urgent' status in your Task Stream.",
      icon: Target,
      color: "#003527",
      bg: "#ecfdf5"
    },
    {
      id: 2,
      title: "2. Check Deal Health",
      feature: "Deal Temperature",
      description: "Before reaching out, check the 'Pulse Matrix'. The AI analyzes every interaction to determine if the deal is heating up or cooling down.",
      howTo: [
        "Locate the Emoji signal in the Pulse Matrix.",
        "Click the signal to read the AI's contextual reasoning.",
        "Adjust your strategy based on the 'At Risk' warnings."
      ],
      tip: "A 'Cold' deal requires a personalized 'Strategic Play' to revive interest.",
      icon: Zap,
      color: "#735c00",
      bg: "#fffbeb"
    },
    {
      id: 3,
      title: "3. Perfect & Execute",
      feature: "Outreach Lab",
      description: "Use the Outreach Lab to craft perfect emails. The AI scores your draft for reply probability and tone, ensuring you sound like an executive.",
      howTo: [
        "Select a task from your Stream and click 'Execute'.",
        "Refine your draft in the Outreach Lab.",
        "Use 'Apply & Adjust' to let the AI shift the tone to 'Persuasive' or 'Casual'."
      ],
      tip: "Emails with a score of 85+ are 3x more likely to get a response.",
      icon: Send,
      color: "#064e3b",
      bg: "#f0fdf4"
    }
  ]

  return (
    <div className="space-y-16 pb-32">
      {/* Hero Section - Vantage Style */}
      <section className="relative rounded-[32px] bg-emerald-900/5 overflow-hidden border border-white mb-12 min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
        <div className="relative p-12 text-center max-w-3xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/5 border border-emerald-900/10">
            <Sparkles size={16} className="text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">Platform Intelligence</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl font-black text-emerald-950 tracking-tighter">
            System Guide & Flows
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-emerald-800/60 leading-relaxed">
            Master the end-to-end intelligence cycle. Learn how Vantage turns CRM data into closed deals using advanced neural workflows.
          </motion.p>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-8 rounded-3xl flex flex-col group hover:-translate-y-2 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-900/5 flex items-center justify-center mb-8 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
              <cat.icon size={24} className="text-emerald-900 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 mb-4">{cat.title}</h2>
            <p className="text-sm text-emerald-800/60 mb-8 flex-grow">{cat.description}</p>
            <div className="space-y-3 pt-6 border-t border-emerald-900/5">
              {cat.steps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                  <p className="text-xs font-bold text-emerald-900">{step.name}: <span className="font-normal text-slate-500">{step.desc}</span></p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Detailed End-to-End Flow */}
      <section className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-emerald-950">End-to-End Intelligence Flow</h2>
          <p className="text-emerald-800/60 max-w-2xl mx-auto">Follow this 3-step cycle to maximize your territory performance.</p>
        </div>

        <div className="space-y-8">
          {flows.map((flow, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden rounded-[40px] group border-emerald-900/5 hover:border-emerald-900/20"
            >
              <div className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Visual Side */}
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center space-y-8" style={{ backgroundColor: flow.bg }}>
                  <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-emerald-900/5">
                    <flow.icon size={40} style={{ color: flow.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] mb-2">{flow.feature}</p>
                    <h3 className="text-4xl font-black text-emerald-950 leading-none">{flow.title}</h3>
                    <p className="text-lg text-emerald-800/70 mt-6 leading-relaxed">
                      {flow.description}
                    </p>
                  </div>
                </div>

                {/* Tactical Side */}
                <div className="w-full md:w-1/2 p-12 bg-white/50 flex flex-col justify-center">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <ClipboardList size={16} />
                    Tactical Execution
                  </h4>
                  <ul className="space-y-6">
                    {flow.howTo.map((instruction, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-lg shadow-emerald-900/20">
                          {i + 1}
                        </div>
                        <p className="text-emerald-950 font-bold leading-snug">{instruction}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-12 p-6 rounded-2xl bg-emerald-900 text-white flex items-start gap-4 shadow-2xl shadow-emerald-900/20">
                    <Sparkles size={24} className="text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-300">Executive Insight</p>
                      <p className="text-sm font-medium leading-relaxed italic">"{flow.tip}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="glass-card p-16 bg-emerald-950 rounded-[40px] text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-black text-white">Neural Matrix Ready</h2>
          <p className="text-emerald-300/60 text-lg max-w-xl mx-auto">
            Your intelligence streams are synchronized. Return to the matrix to begin execution.
          </p>
          <div className="pt-8">
            <Link to="/" className="btn-vantage bg-white text-emerald-950 px-12 py-6 rounded-2xl text-lg font-black hover:scale-105 transition-all no-underline inline-flex items-center gap-4">
              Enter Matrix
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
