import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { GateShell } from '@/widgets/GateShell/GateShell'

interface Faq {
  q: string
  a: string
  tag: string
}

const FAQS: Faq[] = [
  {
    tag: 'General',
    q: 'What is this platform?',
    a: 'A simulated checker terminal with a cyberpunk interface. The gate engine is fully simulated for demonstration purposes — no real card processing happens anywhere in the app.',
  },
  {
    tag: 'General',
    q: 'Are any real charges made?',
    a: 'No. The gates are simulated. The only real network calls are public BIN lookups and the Stripe payments backend, which runs strictly in TEST mode (no real money moves).',
  },
  {
    tag: 'Credits',
    q: 'How do credits work?',
    a: 'Each check consumes credits depending on the selected gate (live and dead results may cost differently). Your balance is shown in the sidebar and on your profile.',
  },
  {
    tag: 'Credits',
    q: 'How do I top up credits?',
    a: 'Go to Pricing, pick a package and complete the Stripe test checkout using card 4242 4242 4242 4242, any future expiry date, and any CVC. Credits are added on success.',
  },
  {
    tag: 'Gates',
    q: 'What format should I paste cards in?',
    a: 'Use the format number|MM|YYYY|CVV, one per line. Invalid lines (failing Luhn, bad expiry or CVV) are flagged before processing.',
  },
  {
    tag: 'Gates',
    q: 'Where do my live cards go?',
    a: 'Any card flagged as live is stored in the Lives Vault, where issuer intel is enriched asynchronously via BIN lookup. You can filter, copy or export them.',
  },
  {
    tag: 'Tools',
    q: 'What is the BIN Lookup for?',
    a: 'It returns real issuer intelligence (scheme, brand, type, bank, country) for a 6–8 digit BIN using public APIs, with an offline fallback when they are unreachable.',
  },
  {
    tag: 'Tools',
    q: 'Is the Random Data real?',
    a: 'No. Identities are randomly generated for QA/testing and do not correspond to any real person.',
  },
  {
    tag: 'Account',
    q: 'Can I change my username?',
    a: 'Yes. Open Your Profile, click Edit, update your username or Telegram ID and save.',
  },
]

export function FaqsPage() {
  const [open, setOpen] = useState<number | null>(0)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = FAQS.filter(
    (f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q)
  )

  return (
    <GateShell title="FAQs" subtitle="Frequently asked questions">
      <div className="max-w-[820px] mx-auto">
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-10 pr-3.5 py-3 text-sm bg-cyber-panel/70 border border-cyber-border rounded-lg text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-blue focus:outline-none"
          />
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-cyber-text-muted py-12">No questions match “{query}”.</p>
          ) : (
            filtered.map((faq, i) => {
              const isOpen = open === i
              return (
                <div key={faq.q}
                  className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-cyber-border text-cyber-text-muted shrink-0">
                      {faq.tag}
                    </span>
                    <span className="flex-1 text-sm font-medium text-cyber-text">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={clsx('text-cyber-text-muted transition-transform shrink-0', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 animate-fade-in">
                      <p className="text-sm text-cyber-text-muted leading-relaxed border-t border-cyber-border pt-3">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </GateShell>
  )
}
