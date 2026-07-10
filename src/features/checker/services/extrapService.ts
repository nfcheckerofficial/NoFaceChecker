export interface ExtrapResult {
  bin: string
  scheme: string | null
  brand: string | null
  type: string | null
  category: string | null
  bankName: string | null
  countryName: string | null
  countryCode: string | null
  countryEmoji: string | null
  currency: string | null
  provider: string | null
  error?: string
}

const BIN_RANGES: Array<{ prefix: string; brand: string; type: string; banks: string[] }> = [
  { prefix: '4', brand: 'VISA', type: 'credit/debit', banks: ['Various'] },
  { prefix: '51', brand: 'MASTERCARD', type: 'credit/debit', banks: ['Various'] },
  { prefix: '52', brand: 'MASTERCARD', type: 'credit/debit', banks: ['Various'] },
  { prefix: '53', brand: 'MASTERCARD', type: 'credit/debit', banks: ['Various'] },
  { prefix: '54', brand: 'MASTERCARD', type: 'credit/debit', banks: ['Various'] },
  { prefix: '55', brand: 'MASTERCARD', type: 'credit/debit', banks: ['Various'] },
  { prefix: '34', brand: 'AMEX', type: 'credit', banks: ['American Express'] },
  { prefix: '37', brand: 'AMEX', type: 'credit', banks: ['American Express'] },
  { prefix: '6011', brand: 'DISCOVER', type: 'credit/debit', banks: ['Discover'] },
  { prefix: '65', brand: 'DISCOVER', type: 'credit/debit', banks: ['Discover'] },
  { prefix: '35', brand: 'JCB', type: 'credit', banks: ['JCB'] },
  { prefix: '30', brand: 'DINERS', type: 'credit', banks: ['Diners Club'] },
  { prefix: '36', brand: 'DINERS', type: 'credit', banks: ['Diners Club'] },
  { prefix: '38', brand: 'DINERS', type: 'credit', banks: ['Diners Club'] },
  { prefix: '39', brand: 'DINERS', type: 'credit', banks: ['Diners Club'] },
]

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''

export async function extrapolateBins(prefix: string): Promise<{
  exact: ExtrapResult | null
  nearby: ExtrapResult[]
  ranges: typeof BIN_RANGES
}> {
  const digits = prefix.replace(/\D/g, '').slice(0, 8)

  let exact: ExtrapResult | null = null
  let nearby: ExtrapResult[] = []

  try {
    const res = await fetch(`${API_BASE}/api/extrap/${digits}`)
    if (res.ok) {
      const data = await res.json()
      exact = data.exact ?? null
      nearby = data.nearby ?? []
    }
  } catch {}

  const matchedRanges = BIN_RANGES.filter((r) => digits.startsWith(r.prefix) || r.prefix.startsWith(digits))

  return { exact, nearby, ranges: matchedRanges }
}
