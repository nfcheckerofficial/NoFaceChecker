import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { ShieldCheck, CreditCard, RefreshCw, Loader2, Receipt } from 'lucide-react'
import { CardValidator } from '@/features/payments/CardValidator'
import {
  fetchSavedCards,
  fetchCharges,
  chargeSavedCard,
  type SavedCard,
  type ChargeRecord,
} from '@/features/payments/paymentsApi'

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

/**
 * Card Vault: valida/guarda tarjetas (SetupIntent + 3D Secure, sin cobrar) y
 * permite cobrar off-session a una tarjeta guardada. Cada cobro genera un
 * recibo en la BD ligado al método de pago y al usuario.
 */
export function CardVaultPage() {
  if (!stripePromise) {
    return (
      <div className="p-6 text-center text-cyber-text-muted">
        <ShieldCheck size={48} className="mx-auto mb-3 opacity-30" />
        <p>Stripe is not configured</p>
        <p className="text-sm mt-1">Set <span className="font-mono text-cyber-blue">VITE_STRIPE_PUBLISHABLE_KEY</span> in your environment to enable card validation.</p>
      </div>
    )
  }
  return (
    <Elements stripe={stripePromise}>
      <VaultInner />
    </Elements>
  )
}

function VaultInner() {
  const stripe = useStripe()
  const [cards, setCards] = useState<SavedCard[]>([])
  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, ch] = await Promise.all([fetchSavedCards(), fetchCharges()])
      setCards(c)
      setCharges(ch)
    } catch {
      setCards([])
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCharge = async (card: SavedCard) => {
    if (!card.customerId) {
      setNotice({ kind: 'err', text: 'This card has no customer reference.' })
      return
    }
    const input = window.prompt('Amount to charge (USD):', '9.99')
    if (input == null) return
    const amount = Number(input)
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice({ kind: 'err', text: 'Invalid amount.' })
      return
    }

    setBusyId(card.id)
    setNotice(null)
    try {
      const result = await chargeSavedCard({
        paymentMethodId: card.paymentMethodId,
        customerId: card.customerId,
        amount,
        description: `Vault charge · ${card.brand} ····${card.last4}`,
      })

      if (result.status === 'succeeded') {
        setNotice({ kind: 'ok', text: `Charged $${result.amount} successfully.` })
      } else if (result.status === 'requires_action' && result.clientSecret && stripe) {
        // El banco exige 3D Secure: completa el reto.
        const { error, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret)
        if (error) {
          setNotice({ kind: 'err', text: error.message ?? 'Authentication failed.' })
        } else if (paymentIntent?.status === 'succeeded') {
          setNotice({ kind: 'ok', text: 'Charge authenticated & completed.' })
        } else {
          setNotice({ kind: 'err', text: `Charge ${paymentIntent?.status}.` })
        }
      } else {
        setNotice({ kind: 'err', text: result.error ?? result.message ?? 'Charge failed.' })
      }
    } catch {
      setNotice({ kind: 'err', text: 'Could not process charge.' })
    } finally {
      setBusyId(null)
      load()
    }
  }

  return (
    <div className="max-w-[980px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-green/15 border border-cyber-green/40 flex items-center justify-center">
          <ShieldCheck size={20} className="text-cyber-green" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">Card Vault</h1>
          <p className="text-xs text-cyber-text-muted">
            Validate, save &amp; charge cards — authenticated via 3D Secure
          </p>
        </div>
      </header>

      {notice && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            notice.kind === 'ok'
              ? 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Validar y guardar */}
        <div className="rounded-xl border border-cyber-border bg-cyber-panel/60 p-6">
          <h2 className="text-sm font-semibold text-cyber-text mb-4">Add a card</h2>
          <CardValidator />
        </div>

        {/* Tarjetas guardadas */}
        <div className="rounded-xl border border-cyber-border bg-cyber-panel/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-cyber-text">Saved cards</h2>
            <button
              onClick={load}
              className="text-cyber-text-muted hover:text-cyber-text transition-colors"
              title="Refresh"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
          </div>

          {cards.length === 0 && !loading && (
            <p className="text-sm text-cyber-text-muted">No validated cards yet.</p>
          )}

          <ul className="space-y-2.5">
            {cards.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-cyber-border bg-cyber-dark px-4 py-3"
              >
                <CreditCard size={18} className="text-cyber-blue shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono text-cyber-text">
                    {(c.brand ?? 'CARD').toUpperCase()} ···· {c.last4 ?? '????'}
                  </p>
                  <p className="text-[11px] text-cyber-text-muted">
                    {c.funding ?? '—'} · {c.country ?? '—'} · exp {c.expMonth}/{c.expYear}
                  </p>
                </div>
                <button
                  onClick={() => handleCharge(c)}
                  disabled={busyId === c.id}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-cyber-green/90 text-cyber-black hover:bg-cyber-green disabled:opacity-40 transition-colors shrink-0"
                >
                  {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : 'Charge'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Historial de recibos */}
      <div className="mt-5 rounded-xl border border-cyber-border bg-cyber-panel/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={16} className="text-cyber-blue" />
          <h2 className="text-sm font-semibold text-cyber-text">Charge history</h2>
        </div>

        {charges.length === 0 ? (
          <p className="text-sm text-cyber-text-muted">No charges yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-cyber-text-muted text-left">
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">AVS</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((ch) => (
                  <tr key={ch.id} className="border-t border-cyber-border/60 text-cyber-text">
                    <td className="py-2 pr-4 font-mono">
                      ${ch.amount.toFixed(2)} {ch.currency.toUpperCase()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
                          ch.status === 'succeeded'
                            ? 'text-cyber-green border-cyber-green/40 bg-cyber-green/10'
                            : ch.status === 'requires_action'
                              ? 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10'
                              : 'text-red-400 border-red-500/40 bg-red-500/10'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-cyber-text-muted">
                      {ch.avsPostal ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-xs text-cyber-text-muted truncate max-w-[180px]">
                      {ch.description ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-xs text-cyber-text-muted">{ch.createdAt}</td>
                    <td className="py-2">
                      {ch.receiptUrl ? (
                        <a
                          href={ch.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyber-blue hover:underline text-xs"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-cyber-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
