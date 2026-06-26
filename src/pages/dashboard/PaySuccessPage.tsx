import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { getSessionStatus } from '@/features/payments/paymentsApi'
import { useUserStore } from '@/features/checker/store/userStore'

export function PaySuccessPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const addCredits = useUserStore((s) => s.addCredits)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [credits, setCredits] = useState(0)
  const [amount, setAmount] = useState(0)
  const applied = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      setState('error')
      return
    }
    let alive = true
    ;(async () => {
      try {
        const s = await getSessionStatus(sessionId)
        if (!alive) return
        if (s.status === 'paid') {
          // Evita acreditar dos veces (StrictMode / re-render).
          if (!applied.current) {
            applied.current = true
            addCredits(s.credits)
          }
          setCredits(s.credits)
          setAmount(s.amountTotal)
          setState('ok')
        } else {
          setState('error')
        }
      } catch {
        if (alive) setState('error')
      }
    })()
    return () => { alive = false }
  }, [sessionId, addCredits])

  return (
    <GateShell title="Payment" subtitle="Stripe test checkout">
      <div className="max-w-md mx-auto rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-8 text-center">
        {state === 'loading' && (
          <>
            <Loader2 size={40} className="mx-auto text-cyber-text-muted animate-spin mb-4" />
            <p className="text-sm text-cyber-text-muted">Confirming your payment…</p>
          </>
        )}

        {state === 'ok' && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-cyber-green mb-4" />
            <h2 className="text-xl font-bold text-cyber-text mb-1">Payment successful</h2>
            <p className="text-sm text-cyber-text-muted mb-5">
              ${amount.toFixed(2)} paid · <span className="text-cyber-green font-semibold">{credits.toLocaleString()} credits</span> added.
            </p>
            <Link to="/dashboard"
              className="inline-block px-5 py-2.5 rounded-lg bg-cyber-red text-white text-sm font-semibold hover:bg-cyber-red-dark transition-colors">
              Back to dashboard
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-cyber-red mb-4" />
            <h2 className="text-xl font-bold text-cyber-text mb-1">Could not confirm payment</h2>
            <p className="text-sm text-cyber-text-muted mb-5">
              The session is missing or unpaid. If you were charged in test mode, check the server logs.
            </p>
            <Link to="/dashboard/pricing"
              className="inline-block px-5 py-2.5 rounded-lg border border-cyber-border text-cyber-text text-sm font-semibold hover:border-cyber-red/50 transition-colors">
              Back to pricing
            </Link>
          </>
        )}
      </div>
    </GateShell>
  )
}
