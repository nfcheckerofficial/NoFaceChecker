import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Section } from '@/shared/ui/Section'

const FAQS = [
  { tag: 'General', q: 'What is this platform?', a: 'A simulated checker terminal with a cyberpunk interface. The gate engine is fully simulated — no real card processing.' },
  { tag: 'General', q: 'Are any real charges made?', a: 'No. Gates are simulated. Real network calls are only public BIN lookups and Stripe in TEST mode.' },
  { tag: 'Credits', q: 'How do credits work?', a: 'Each check consumes credits. Your balance is shown in the sidebar and on your profile.' },
  { tag: 'Credits', q: 'How do I top up?', a: 'Go to Pricing, pick a package and pay via Stripe (card) or Oxapay (crypto).' },
  { tag: 'Gates', q: 'What format for cards?', a: 'number|MM|YYYY|CVV, one per line. Invalid lines are flagged before processing.' },
  { tag: 'Gates', q: 'Where do live cards go?', a: 'Stored in Live Vault — filter, copy, or export them.' },
  { tag: 'Tools', q: 'What is BIN Lookup?', a: 'Returns issuer intelligence (brand, bank, country) for any 6-8 digit BIN.' },
  { tag: 'Tools', q: 'Is Random Data real?', a: 'No — randomly generated for testing, not real people.' },
  { tag: 'Account', q: 'Can I change my username?', a: 'Yes — open Your Profile, click Edit, update and save.' },
]

export function FaqsPage() {
  const [open, setOpen] = useState<number | null>(0)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = FAQS.filter(f => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q))

  return (
    <div className="max-w-[820px] mx-auto space-y-5 motion-safe:animate-slide-up">
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyber-text-muted/30" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions..."
          className="w-full pl-10 pr-4 py-3 text-sm font-mono bg-white/[0.02] border border-white/[0.06] rounded-xl text-cyber-text placeholder:text-cyber-text-muted/30 focus:border-cyber-blue/50 focus:outline-none transition-colors" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-cyber-text-muted/50 font-mono">No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : filtered.map((faq, i) => {
          const isOpen = open === i
          return (
            <div key={i} className={clsx('rounded-xl border transition-all duration-300 overflow-hidden',
              isOpen ? 'border-white/[0.08] bg-white/[0.02]' : 'border-white/[0.04] hover:border-white/[0.08]')}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-cyber-text-muted/60 font-mono shrink-0">{faq.tag}</span>
                <span className="flex-1 text-sm font-mono text-cyber-text/80">{faq.q}</span>
                <ChevronDown size={14} className={clsx('text-cyber-text-muted/30 shrink-0 transition-transform duration-300', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 motion-safe:animate-slide-up">
                  <p className="text-sm text-cyber-text-muted/70 font-mono leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
