import { useState } from 'react'
import { LifeBuoy, Send, Check, MessageSquare, Mail, BookOpen, ChevronDown, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useUserStore } from '@/features/checker/store/userStore'
import { Section, Card, Grid, Divider } from '@/shared/ui/Section'

const TOPICS = ['Billing', 'Gate issue', 'Account', 'Bug report', 'Other']

const FAQS = [
  { q: 'How do credits work?', a: 'Each gate costs credits to run. Credits are deducted when you submit a card. Purchase credits in the Marketplace.' },
  { q: 'What is a "Live" result?', a: 'A Live result means the card passed all validation checks — CVV, AVS, and format.' },
  { q: 'How do I get more credits?', a: 'Purchase credit packs in the Marketplace via Stripe or crypto (Oxapay).' },
  { q: 'What gates are available?', a: 'Stripe CCN, Stripe Auth, Charge gates, PayPal, Special gates, and more.' },
  { q: 'Is my data secure?', a: 'Yes — all data is encrypted. No card details are permanently stored.' },
  { q: 'How do I contact support?', a: 'Telegram @nofaceclan_support (fastest) or open a ticket here.' },
]

export function SupportPage() {
  const username = useUserStore((s) => s.profile.username)
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setMessage('')
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="max-w-[960px] mx-auto space-y-5 motion-safe:animate-slide-up">
      {/* Channels + Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <Channel icon={<MessageSquare size={16} />} title="Telegram" value="@nofaceclan_support" hint="Fastest response" color="text-cyber-purple" />
          <Channel icon={<Mail size={16} />} title="Email" value="support@nofaceclan.io" hint="For billing" color="text-cyber-blue" />
          <Channel icon={<BookOpen size={16} />} title="Docs & FAQs" value="Read the FAQs" hint="Common questions" color="text-cyber-green" />
        </div>

        <Section title="Open a Ticket" icon={<LifeBuoy size={14} className="text-orange-400" />} accent="yellow" className="lg:col-span-2">
          {sent && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyber-green/30 bg-cyber-green/[0.06] px-4 py-3 text-cyber-green text-sm font-mono">
              <Check size={15} /> Ticket submitted — we&apos;ll reach out to {username} soon.
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-2">Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} type="button" onClick={() => setTopic(t)}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors',
                      topic === t ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' : 'border-white/[0.06] text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/[0.03]')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-2">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Describe your issue in detail..."
                className="w-full px-4 py-3 text-sm font-mono bg-white/[0.03] border border-white/[0.06] rounded-xl text-cyber-text placeholder:text-cyber-text-muted/30 focus:border-orange-500/50 focus:outline-none resize-none transition-colors" />
            </div>
            <button type="submit" disabled={!message.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/80 text-black text-sm font-semibold hover:bg-orange-500 disabled:opacity-40 transition-all font-mono">
              <Send size={14} /> Submit
            </button>
          </form>
        </Section>
      </div>

      {/* FAQ */}
      <Section title="FAQs" icon={<HelpCircle size={14} />} accent="blue">
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className={clsx('rounded-xl border transition-all duration-300 overflow-hidden',
              openFaq === i ? 'border-cyber-blue/30 bg-cyber-blue/[0.03]' : 'border-white/[0.04] hover:border-white/[0.08]')}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                <span className="text-sm font-mono text-cyber-text/80">{faq.q}</span>
                <ChevronDown size={14} className={clsx('text-cyber-text-muted/40 shrink-0 ml-2 transition-transform duration-300', openFaq === i && 'rotate-180')} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 motion-safe:animate-slide-up">
                  <p className="text-sm text-cyber-text-muted/70 font-mono leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Channel({ icon, title, value, hint, color }: { icon: React.ReactNode; title: string; value: string; hint: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 hover:bg-white/[0.03] transition-all duration-300">
      <div className="flex items-center gap-2.5 mb-2">
        <span className={clsx('w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center', color)}>{icon}</span>
        <span className="text-sm font-semibold text-cyber-text/90 font-mono">{title}</span>
      </div>
      <p className="text-sm text-cyber-text/70 font-mono">{value}</p>
      <p className="text-[10px] text-cyber-text-muted/50 mt-1 font-mono">{hint}</p>
    </div>
  )
}
