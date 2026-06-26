/**
 * Formulario de validación de tarjeta SIN cobro.
 *
 * Flujo:
 *   1. Pide un SetupIntent al backend (no mueve dinero).
 *   2. El usuario introduce SU tarjeta en el CardElement (iframe de Stripe;
 *      el número nunca toca nuestro servidor ni nuestro JS).
 *   3. confirmCardSetup dispara 3D Secure: el banco autentica al titular.
 *   4. Consultamos el resultado: estado, CVC check y AVS.
 *
 * Caso de uso legítimo: el propio usuario valida/guarda SU tarjeta para
 * pagos futuros. La autenticación 3DS garantiza que es el titular real.
 */

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  createSetupIntent,
  getSetupIntentResult,
  type CardValidationResult,
} from './paymentsApi'

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const CARD_STYLE = {
  style: {
    base: {
      color: '#e5e7eb',
      fontFamily: 'monospace',
      fontSize: '15px',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#ef4444' },
  },
}

function ValidatorForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CardValidationResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 1. SetupIntent (sin cargo)
      const { clientSecret } = await createSetupIntent(email || undefined)

      const card = elements.getElement(CardElement)
      if (!card) throw new Error('Card element not found')

      // 2 + 3. Confirma y dispara 3D Secure si el banco lo pide.
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        { payment_method: { card } }
      )

      if (stripeError) {
        setError(stripeError.message ?? 'Validation failed')
        return
      }

      // 4. Resultado detallado del backend (CVC/AVS/estado).
      const full = await getSetupIntentResult(setupIntent!.id)
      setResult(full)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const ok = result?.status === 'succeeded'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-cyber-text-muted mb-2">
          Email (optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3.5 py-2.5 text-sm bg-cyber-dark border border-cyber-border rounded-lg text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-blue focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-cyber-text-muted mb-2">
          Your card
        </label>
        <div className="px-3.5 py-3 bg-cyber-dark border border-cyber-border rounded-lg">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2.5 rounded-lg bg-cyber-blue/90 text-cyber-black text-sm font-semibold hover:bg-cyber-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Validating…' : 'Validate card (no charge)'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm space-y-1.5 ${
            ok
              ? 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green'
              : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
          }`}
        >
          <p className="font-semibold">
            {ok ? '✓ Card valid & cardholder authenticated' : `Status: ${result.status}`}
          </p>
          {result.card && (
            <p className="font-mono text-cyber-text">
              {result.card.brand.toUpperCase()} ···· {result.card.last4} ·{' '}
              {result.card.funding} · {result.card.country}
            </p>
          )}
          <ul className="text-xs text-cyber-text-muted space-y-0.5">
            <li>CVC check: {result.validation.cvcCheck ?? 'n/a'}</li>
            <li>Postal code: {result.validation.postalCodeCheck ?? 'n/a'}</li>
            <li>3D Secure: {result.validation.threeDSecure}</li>
          </ul>
        </div>
      )}
    </form>
  )
}

export function CardValidator() {
  if (!stripePromise) {
    return (
      <div className="text-center text-cyber-text-muted py-8">
        <p className="text-sm">Stripe not configured — set VITE_STRIPE_PUBLISHABLE_KEY</p>
      </div>
    )
  }
  return (
    <Elements stripe={stripePromise}>
      <ValidatorForm />
    </Elements>
  )
}
