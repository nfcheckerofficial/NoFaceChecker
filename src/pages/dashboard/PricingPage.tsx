import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { Check, Loader2, Zap, AlertTriangle, CreditCard, Bitcoin, Sparkles, Shield, Star } from 'lucide-react'
import {
  fetchPackages, startCheckout, createOxapayInvoice, paymentsHealth,
  type CreditPackage,
} from '@/features/payments/paymentsApi'

type PayMethod = 'stripe' | 'crypto'

const HIGHLIGHT = 'pro'

const GRADIENT_BG: Record<string, string> = {
  starter: 'from-cyber-blue/10 via-transparent to-transparent',
  pro: 'from-cyber-purple/15 via-cyber-red/5 to-transparent',
  elite: 'from-cyber-yellow/10 via-transparent to-transparent',
}

const GRADIENT_BORDER: Record<string, string> = {
  starter: 'from-cyber-blue/40 via-cyber-blue/20 to-transparent',
  pro: 'from-cyber-purple/50 via-cyber-red/30 to-cyber-purple/50',
  elite: 'from-cyber-yellow/40 via-orange-500/20 to-transparent',
}

const CARD_ICON: Record<string, React.ReactNode> = {
  starter: <Shield size={18} />,
  pro: <Star size={18} />,
  elite: <Zap size={18} />,
}

const BENEFITS = [
  'All gates access',
  'Instant top-up',
  'Priority support',
  'No hidden fees',
]

export function PricingPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [serverUp, setServerUp] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('stripe')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const up = await paymentsHealth()
      if (!alive) return
      setServerUp(up)
      if (up) {
        try {
          const pkgs = await fetchPackages()
          if (alive) setPackages(pkgs)
        } catch {
          if (alive) setError('Could not load packages.')
        }
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const buy = async (id: string) => {
    setBusy(id); setError('')
    try {
      const url = payMethod === 'stripe' ? await startCheckout(id) : (await createOxapayInvoice(id)).url
      window.location.href = url
    } catch {
      setError('Could not start checkout.')
      setBusy(null)
    }
  }

  return (
    <div className="relative motion-safe:animate-slide-up">
      {serverUp === false && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyber-yellow/30 bg-cyber-yellow/[0.06] px-5 py-4 text-cyber-yellow text-sm font-mono">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payments server offline</p>
            <p className="text-cyber-yellow/70 text-xs mt-1">Run <code className="font-mono">npm run server</code> and add API keys to <code className="font-mono">.env</code>.</p>
          </div>
        </div>
      )}

      {/* Payment method toggle */}
      {serverUp !== false && (
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <button onClick={() => setPayMethod('stripe')}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 font-mono',
                payMethod === 'stripe'
                  ? 'bg-cyber-blue/15 text-cyber-blue shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text/80'
              )}>
              <CreditCard size={15} /> Card
            </button>
            <button onClick={() => setPayMethod('crypto')}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 font-mono',
                payMethod === 'crypto'
                  ? 'bg-cyber-purple/15 text-cyber-purple shadow-[0_0_15px_rgba(157,0,255,0.15)]'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text/80'
              )}>
              <Bitcoin size={15} /> Crypto
            </button>
          </div>
        </div>
      )}

      {/* Packages */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={22} className="animate-spin text-cyber-text-muted/30" />
            <p className="text-xs text-cyber-text-muted/30 font-mono">Loading plans...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] mx-auto">
          {packages.map((pkg) => {
            const featured = pkg.id === HIGHLIGHT
            return (
              <div key={pkg.id} className={clsx(
                'relative rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-sm',
                featured ? 'ring-1 ring-cyber-purple/40' : 'hover:ring-1 hover:ring-white/[0.08]'
              )}>
                <div className={clsx(
                  'relative h-full rounded-2xl p-5 flex flex-col',
                  'bg-gradient-to-b',
                  GRADIENT_BG[pkg.id] || 'from-white/[0.02] to-transparent'
                )}>
                  {featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-lg bg-gradient-to-r from-cyber-purple to-cyber-red text-white text-[9px] font-bold uppercase tracking-widest font-mono shadow-[0_0_15px_rgba(157,0,255,0.25)]">
                      Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', featured ? 'text-cyber-purple bg-cyber-purple/10' : 'text-cyber-text-muted/50 bg-white/[0.03]')}>
                      {CARD_ICON[pkg.id] || <Zap size={15} />}
                    </span>
                    <h3 className={clsx('text-sm font-bold font-mono', featured ? 'text-cyber-text' : 'text-cyber-text/80')}>{pkg.name}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={clsx('text-3xl font-bold font-mono', featured ? 'text-cyber-text' : 'text-cyber-text/90')}>${pkg.price.toFixed(2)}</span>
                      <span className="text-[10px] text-cyber-text-muted/50 font-mono">/ one</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Zap size={11} className={featured ? 'text-cyber-purple' : 'text-cyber-yellow/60'} />
                      <span className={clsx('text-xs font-semibold font-mono', featured ? 'text-cyber-purple' : 'text-cyber-yellow/80')}>{pkg.credits.toLocaleString()} credits</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5 flex-1">
                    <li className="flex items-center gap-2 text-xs font-mono">
                      <Check size={12} className={clsx('shrink-0', featured ? 'text-cyber-purple' : 'text-cyber-green')} />
                      <span className="text-cyber-text-muted/80">{pkg.credits.toLocaleString()} Credits</span>
                    </li>
                    {BENEFITS.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-mono">
                        <Check size={12} className={clsx('shrink-0', featured ? 'text-cyber-purple' : 'text-cyber-green/70')} />
                        <span className="text-cyber-text-muted/70">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => buy(pkg.id)} disabled={!serverUp || busy !== null}
                    className={clsx(
                      'relative w-full py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group/btn',
                      featured ? 'bg-gradient-to-r from-cyber-purple to-cyber-red text-white hover:shadow-[0_0_25px_rgba(157,0,255,0.25)]' : 'border border-white/[0.08] text-cyber-text/80 hover:bg-white/[0.04]'
                    )}>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-1.5">
                      {busy === pkg.id ? <Loader2 size={12} className="animate-spin" /> : payMethod === 'crypto' ? <Bitcoin size={12} /> : <CreditCard size={12} />}
                      {busy === pkg.id ? '...' : payMethod === 'crypto' ? 'Pay Crypto' : 'Buy Now'}
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-sm text-cyber-red/80 mt-5 text-center font-mono">{error}</p>}

      <p className="text-xs text-cyber-text-muted/40 text-center mt-10 font-mono">
        {payMethod === 'stripe'
          ? 'Test mode: use card 4242 4242 4242 4242, any future date, any CVC.'
          : 'Powered by Oxapay — Bitcoin, USDT, ETH, and 100+ cryptocurrencies.'}
      </p>
    </div>
  )
}
