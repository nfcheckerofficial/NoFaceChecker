/**
 * BIN Lookup - Información del emisor a partir de los primeros dígitos (BIN/IIN).
 *
 * Consulta vía el proxy del servidor (/api/extrap/:bin) para evitar bloqueos CORS,
 * y también implementa un fallback offline por prefijo cuando no hay conexión.
 */

export interface BinInfo {
  scheme: string | null
  brand: string | null
  type: string | null
  category: string | null
  prepaid: boolean | null
  bankName: string | null
  bankUrl: string | null
  bankPhone: string | null
  bankCity: string | null
  countryName: string | null
  countryCode: string | null
  countryEmoji: string | null
  currency: string | null
  source: 'api' | 'fallback'
  provider: string | null
}

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const cache = new Map<string, BinInfo>()
const inflight = new Map<string, Promise<BinInfo>>()

const FALLBACK_SCHEMES: Array<{ test: (bin: string) => boolean; scheme: string }> = [
  { test: (b) => /^4/.test(b), scheme: 'visa' },
  { test: (b) => /^5[1-5]/.test(b), scheme: 'mastercard' },
  { test: (b) => /^2(2[2-9]|[3-6]|7[01]|720)/.test(b), scheme: 'mastercard' },
  { test: (b) => /^3[47]/.test(b), scheme: 'amex' },
  { test: (b) => /^6(011|5)/.test(b), scheme: 'discover' },
  { test: (b) => /^(2131|1800|35)/.test(b), scheme: 'jcb' },
  { test: (b) => /^3(0[0-5]|[68])/.test(b), scheme: 'diners' },
]

function buildFallback(bin: string): BinInfo {
  const match = FALLBACK_SCHEMES.find((s) => s.test(bin))
  return {
    scheme: match?.scheme ?? null,
    brand: match?.scheme ? match.scheme.toUpperCase() : null,
    type: null, category: null, prepaid: null,
    bankName: null, bankUrl: null, bankPhone: null, bankCity: null,
    countryName: null, countryCode: null, countryEmoji: null, currency: null,
    source: 'fallback', provider: null,
  }
}

export async function lookupBin(cardNumber: string): Promise<BinInfo> {
  const digits = cardNumber.replace(/\D/g, '')
  const bin = digits.slice(0, 8)

  if (bin.length < 6) return buildFallback(bin)
  if (cache.has(bin)) return cache.get(bin)!
  if (inflight.has(bin)) return inflight.get(bin)!

  const job = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/extrap/${bin}`)
      if (res.ok) {
        const { exact } = await res.json()
        if (exact) {
          const info: BinInfo = {
            scheme: exact.scheme ?? null,
            brand: exact.brand ?? null,
            type: exact.type ?? null,
            category: exact.category ?? null,
            prepaid: null,
            bankName: exact.bankName ?? null,
            bankUrl: null,
            bankPhone: null,
            bankCity: null,
            countryName: exact.countryName ?? null,
            countryCode: exact.countryCode ?? null,
            countryEmoji: exact.countryEmoji ?? null,
            currency: exact.currency ?? null,
            source: 'api',
            provider: exact.provider ?? null,
          }
          cache.set(bin, info)
          return info
        }
      }
    } catch {}
    const fallback = buildFallback(bin)
    cache.set(bin, fallback)
    return fallback
  })()

  inflight.set(bin, job)
  try { return await job } finally { inflight.delete(bin) }
}
