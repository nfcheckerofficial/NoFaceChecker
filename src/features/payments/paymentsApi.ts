/**
 * Cliente del servidor de pagos (Stripe Checkout, modo TEST).
 * El frontend nunca toca la clave secreta: solo llama a nuestro backend.
 */

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? 'http://localhost:4242'

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
}

export interface SessionStatus {
  status: string // 'paid' | 'unpaid' | 'no_payment_required'
  credits: number
  amountTotal: number
  customerEmail: string | null
}

export async function fetchPackages(): Promise<CreditPackage[]> {
  const res = await fetch(`${API_BASE}/api/packages`)
  if (!res.ok) throw new Error('Could not load packages')
  return res.json()
}

/** Inicia el Checkout y devuelve la URL de Stripe para redirigir. */
export async function startCheckout(packageId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId }),
  })
  if (!res.ok) throw new Error('Could not start checkout')
  const data = await res.json()
  if (!data.url) throw new Error('No checkout URL returned')
  return data.url as string
}

export async function getSessionStatus(sessionId: string): Promise<SessionStatus> {
  const res = await fetch(`${API_BASE}/api/checkout-session/${sessionId}`)
  if (!res.ok) throw new Error('Session not found')
  return res.json()
}

// --- Validación de tarjeta sin cobro (SetupIntent + 3D Secure) ---

export interface SetupIntentInit {
  clientSecret: string
  customerId: string
}

export interface CardValidationResult {
  status: string // 'succeeded' => válida y titular autenticado
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
    funding: string
    country: string
  } | null
  validation: {
    cvcCheck: string | null
    addressLine1Check: string | null
    postalCodeCheck: string | null
    threeDSecure: string
  }
}

/** Pide al backend un SetupIntent para validar/guardar una tarjeta sin cobrar. */
export async function createSetupIntent(email?: string): Promise<SetupIntentInit> {
  const res = await fetch(`${API_BASE}/api/create-setup-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Could not create setup intent')
  return res.json()
}

/** Consulta el resultado completo de la validación (3DS, CVC, AVS). */
export async function getSetupIntentResult(id: string): Promise<CardValidationResult> {
  const res = await fetch(`${API_BASE}/api/setup-intent/${id}`)
  if (!res.ok) throw new Error('Setup intent not found')
  return res.json()
}

export interface SavedCard {
  id: number
  paymentMethodId: string
  customerId: string | null
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
  funding: string | null
  country: string | null
  cvcCheck: string | null
  threeDSecure: string | null
  email: string | null
  validatedAt: string
}

/** Lista los métodos de pago validados y guardados en la BD (solo metadatos). */
export async function fetchSavedCards(email?: string): Promise<SavedCard[]> {
  const url = new URL(`${API_BASE}/api/saved-cards`)
  if (email) url.searchParams.set('email', email)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Could not load saved cards')
  return res.json()
}

export interface ChargeResult {
  status: string // 'succeeded' | 'requires_action' | 'failed'
  paymentIntentId?: string
  clientSecret?: string
  amount?: number
  currency?: string
  receiptUrl?: string | null
  message?: string
  error?: string
}

export interface ChargeRecord {
  id: number
  paymentIntentId: string
  email: string | null
  amount: number
  currency: string
  status: string
  description: string | null
  avsLine1: string | null
  avsPostal: string | null
  receiptUrl: string | null
  createdAt: string
}

/** Cobra una tarjeta guardada (off-session). Puede devolver requires_action. */
export async function chargeSavedCard(params: {
  paymentMethodId: string
  customerId: string
  amount: number
  currency?: string
  description?: string
}): Promise<ChargeResult> {
  const res = await fetch(`${API_BASE}/api/charge-saved-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}

/** Historial de cobros (recibos). */
export async function fetchCharges(email?: string): Promise<ChargeRecord[]> {
  const url = new URL(`${API_BASE}/api/charges`)
  if (email) url.searchParams.set('email', email)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Could not load charges')
  return res.json()
}

/** Comprueba si el servidor de pagos está disponible. */
export async function paymentsHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.ok
  } catch {
    return false
  }
}
