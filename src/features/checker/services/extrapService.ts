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

const PROVIDERS = [
  {
    name: 'antipublic',
    url: (bin: string) => `https://bins.antipublic.cc/bins/${bin}`,
  },
  {
    name: 'handyapi',
    url: (bin: string) => `https://data.handyapi.com/bin/${bin}`,
  },
  {
    name: 'binlist',
    url: (bin: string) => `https://lookup.binlist.net/${bin}`,
    headers: { 'Accept-Version': '3' },
  },
]

function flagEmoji(alpha2?: string | null): string | null {
  if (!alpha2 || alpha2.length !== 2) return null
  const cc = alpha2.toUpperCase()
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

function titleCase(s?: string | null): string | null {
  return s ? s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase()) : null
}

async function fetchSingle(bin: string): Promise<ExtrapResult | null> {
  for (const p of PROVIDERS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(p.url(bin), {
        headers: (p as any).headers,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) continue
      const data = await res.json()
      if (p.name === 'antipublic') {
        if (!data || (!data.bank && !data.brand)) continue
        const a2 = data.country ?? null
        return {
          bin,
          scheme: data.brand ? String(data.brand).toLowerCase() : null,
          brand: data.brand ? String(data.brand).toUpperCase() : null,
          type: data.type ? String(data.type).toLowerCase() : null,
          category: data.level ? titleCase(data.level) : null,
          bankName: titleCase(data.bank) ?? null,
          countryName: titleCase(data.country_name) ?? null,
          countryCode: a2,
          countryEmoji: flagEmoji(a2),
          currency: Array.isArray(data.country_currencies) ? data.country_currencies[0] ?? null : null,
          provider: p.name,
        }
      }
      if (p.name === 'handyapi') {
        if (data?.Status && data.Status !== 'SUCCESS') continue
        const a2 = data.Country?.A2 ?? null
        return {
          bin,
          scheme: data.Scheme ? String(data.Scheme).toLowerCase() : null,
          brand: data.Scheme ? String(data.Scheme).toUpperCase() : null,
          type: data.Type ? String(data.Type).toLowerCase() : null,
          category: data.CardTier ? titleCase(data.CardTier) : null,
          bankName: titleCase(data.Issuer) ?? null,
          countryName: data.Country?.Name ?? null,
          countryCode: a2,
          countryEmoji: flagEmoji(a2),
          currency: null,
          provider: p.name,
        }
      }
      if (p.name === 'binlist') {
        return {
          bin,
          scheme: data.scheme ?? null,
          brand: data.brand ?? (data.scheme ? String(data.scheme).toUpperCase() : null),
          type: data.type ?? null,
          category: data.prepaid === true ? 'prepaid' : data.prepaid === false ? 'standard' : null,
          bankName: data.bank?.name ?? null,
          countryName: data.country?.name ?? null,
          countryCode: data.country?.alpha2 ?? null,
          countryEmoji: data.country?.emoji ?? flagEmoji(data.country?.alpha2),
          currency: data.country?.currency ?? null,
          provider: p.name,
        }
      }
    } catch {
      continue
    }
  }
  return null
}

export async function extrapolateBins(prefix: string): Promise<{
  exact: ExtrapResult | null
  nearby: ExtrapResult[]
  ranges: typeof BIN_RANGES
}> {
  const digits = prefix.replace(/\D/g, '').slice(0, 8)

  const exact = digits.length >= 6 ? await fetchSingle(digits) : null

  const nearby: ExtrapResult[] = []
  if (digits.length >= 6) {
    const base = parseInt(digits.slice(0, 6), 10)
    // Rango ampliado a ±20: 40 BINs extras ademas del exacto.
    const offsets: number[] = []
    for (let i = 1; i <= 20; i++) {
      offsets.push(i, -i)
    }
    const batch = offsets.map((off) => {
      const next = String(base + off)
      // Mantener 6 digitos (pad con ceros a la izquierda).
      return fetchSingle(next.padStart(6, '0'))
    })
    const results = await Promise.allSettled(batch)
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        nearby.push(r.value)
      }
    }
  }

  const matchedRanges = BIN_RANGES.filter((r) => digits.startsWith(r.prefix) || r.prefix.startsWith(digits))

  return { exact, nearby, ranges: matchedRanges }
}
