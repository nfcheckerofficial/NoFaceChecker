import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { Check, Loader2, Zap, AlertTriangle } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'
import {
  fetchPackages, startCheckout, paymentsHealth,
  type CreditPackage,
} from '@/features/payments/paymentsApi'

const HIGHLIGHT = 'pro'

export function PricingPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [serverUp, setServerUp] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

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
    setBusy(id)
    setError('')
    try {
      const url = await startCheckout(id)
      window.location.href = url // redirige a Stripe Checkout (test)
    } catch {
      setError('Could not start checkout. Is the payments server running?')
      setBusy(null)
    }
  }

  return (
    <GateShell title="Pricing" subtitle="Top up credits · Stripe test mode (no real charges)">
      {serverUp === false && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-3 text-cyber-yellow text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payments server is offline.</p>
            <p className="text-cyber-yellow/80 text-xs mt-0.5">
              Run <code className="font-mono">npm run server</code> and add your Stripe test keys to <code className="font-mono">.env</code>.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-cyber-text-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const featured = pkg.id === HIGHLIGHT
            return (
              <div
                key={pkg.id}
                className={clsx(
                  'relative rounded-xl border bg-cyber-panel/70 backdrop-blur-sm p-6 flex flex-col',
                  featured
                    ? 'border-cyber-red/60 shadow-[0_0_30px_rgba(255,0,64,0.2)]'
                    : 'border-cyber-border'
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-cyber-red text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={18} className="text-cyber-yellow" />
                  <h3 className="text-lg font-orbitron font-bold text-cyber-text">{pkg.name}</h3>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold text-cyber-text">${pkg.price.toFixed(2)}</span>
                  <span className="text-sm text-cyber-text-muted"> / one-time</span>
                </div>
                <ul className="space-y-2 text-sm text-cyber-text-muted mb-6 flex-1">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-cyber-green" /> {pkg.credits.toLocaleString()} credits
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-cyber-green" /> Use across all gates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-cyber-green" /> Instant top-up
                  </li>
                </ul>
                <button
                  onClick={() => buy(pkg.id)}
                  disabled={!serverUp || busy !== null}
                  className={clsx(
                    'w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                    featured
                      ? 'bg-cyber-red text-white hover:bg-cyber-red-dark'
                      : 'bg-cyber-panel border border-cyber-border text-cyber-text hover:border-cyber-red/50'
                  )}
                >
                  {busy === pkg.id ? <Loader2 size={16} className="animate-spin" /> : null}
                  Buy now
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-sm text-cyber-red mt-4 text-center">{error}</p>}

      <p className="text-xs text-cyber-text-muted/70 text-center mt-8">
        Test mode: use card <code className="font-mono text-cyber-text">4242 4242 4242 4242</code>, any future date, any CVC.
      </p>
    </GateShell>
  )
}
