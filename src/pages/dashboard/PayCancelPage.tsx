import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'

export function PayCancelPage() {
  return (
    <GateShell title="Payment" subtitle="Stripe test checkout">
      <div className="max-w-md mx-auto rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-8 text-center">
        <Ban size={48} className="mx-auto text-cyber-yellow mb-4" />
        <h2 className="text-xl font-bold text-cyber-text mb-1">Checkout canceled</h2>
        <p className="text-sm text-cyber-text-muted mb-5">
          No charge was made. You can pick a package and try again whenever you're ready.
        </p>
        <Link to="/dashboard/pricing"
          className="inline-block px-5 py-2.5 rounded-lg bg-cyber-red text-white text-sm font-semibold hover:bg-cyber-red-dark transition-colors">
          Back to pricing
        </Link>
      </div>
    </GateShell>
  )
}
