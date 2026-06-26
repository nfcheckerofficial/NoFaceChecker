import { useState } from 'react'
import { LifeBuoy, Send, Check, MessageSquare, Mail, BookOpen, ChevronDown, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { useUserStore } from '@/features/checker/store/userStore'

const TOPICS = ['Billing & credits', 'Gate issue', 'Account', 'Bug report', 'Other']

const FAQS = [
  {
    q: 'How do credits work?',
    a: 'Each gate costs a certain number of credits to run. Credits are deducted when you submit a card for checking. You can purchase credits in the Marketplace.',
  },
  {
    q: 'What is a "Live" result?',
    a: 'A Live result means the card passed all validation checks and is considered valid. This includes CVV verification and AVS checks where applicable.',
  },
  {
    q: 'How do I get more credits?',
    a: 'You can purchase credit packs in the Marketplace section. We accept various payment methods including cryptocurrency and bank transfers.',
  },
  {
    q: 'What gates are available?',
    a: 'We offer Stripe CCN, Stripe Auth, Charge gates, PayPal gates, and Special gates. Each gate has different success rates and costs.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes, all data is encrypted and we never store card details. We use industry-standard security practices to protect your information.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us via Telegram @nofaceclan_support (fastest), email support@nofaceclan.io, or by opening a ticket here.',
  },
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
    <GateShell title="Get Support" subtitle="We usually reply within a few hours">
      <div className="max-w-[920px] mx-auto space-y-6">
        {/* Top Section: Channels + Ticket Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Channels */}
          <div className="space-y-3">
            <Channel
              icon={<MessageSquare size={18} className="text-cyber-purple" />}
              title="Telegram"
              value="@nofaceclan_support"
              hint="Fastest response"
            />
            <Channel
              icon={<Mail size={18} className="text-cyber-blue" />}
              title="Email"
              value="support@nofaceclan.io"
              hint="For billing matters"
            />
            <Channel
              icon={<BookOpen size={18} className="text-cyber-green" />}
              title="Docs & FAQs"
              value="Read the FAQs"
              hint="Common questions"
            />
          </div>

          {/* Ticket form */}
          <div className="lg:col-span-2 rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <LifeBuoy size={18} className="text-orange-500" />
              <h2 className="text-base font-semibold text-cyber-text">Open a ticket</h2>
            </div>

            {sent && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyber-green/40 bg-cyber-green/10 px-4 py-3 text-cyber-green text-sm animate-fade-in">
                <Check size={16} /> Ticket submitted. We&apos;ll reach out to {username} soon.
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-cyber-text-muted mb-2">Topic</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs border transition-colors',
                        topic === t
                          ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                          : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-cyber-text-muted mb-2">
                  How can we help?
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Describe your issue in detail…"
                  className="w-full px-3.5 py-3 text-sm bg-cyber-dark border border-cyber-border rounded-lg text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500/90 text-cyber-black text-sm font-semibold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={15} /> Submit ticket
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <HelpCircle size={18} className="text-cyber-blue" />
            <h2 className="text-base font-semibold text-cyber-text">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-lg border transition-colors',
                  openFaq === i
                    ? 'border-cyber-blue/50 bg-cyber-blue/5'
                    : 'border-cyber-border hover:border-cyber-border/80'
                )}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-cyber-text">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={clsx(
                      'text-cyber-text-muted transition-transform shrink-0 ml-2',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-cyber-text-muted leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GateShell>
  )
}

function Channel({ icon, title, value, hint }: {
  icon: React.ReactNode; title: string; value: string; hint: string
}) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 p-4">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="w-9 h-9 rounded-md bg-cyber-dark border border-cyber-border flex items-center justify-center">
          {icon}
        </span>
        <span className="text-sm font-semibold text-cyber-text">{title}</span>
      </div>
      <p className="text-sm text-cyber-text font-mono">{value}</p>
      <p className="text-[11px] text-cyber-text-muted mt-0.5">{hint}</p>
    </div>
  )
}
