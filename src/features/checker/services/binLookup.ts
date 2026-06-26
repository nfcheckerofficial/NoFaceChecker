/**
 * BIN Lookup - Información REAL del emisor a partir de los primeros dígitos (BIN/IIN).
 *
 * Consulta varias APIs públicas y gratuitas con estrategia de respaldo:
 *   1) binlist.net
 *   2) binlist.io (espejo)
 *   3) lookup alternativo
 * Solo devuelve datos públicos del rango de numeración (banco, país, marca, tipo).
 * NUNCA verifica saldo ni estado del titular: eso no es posible legalmente.
 *
 * Incluye caché en memoria y un fallback offline por prefijo cuando todas
 * las APIs fallan (sin red, rate-limit, etc.).
 */

export interface BinInfo {
  scheme: string | null // visa, mastercard, amex...
  brand: string | null // marca comercial
  type: string | null // debit / credit
  category: string | null // prepaid, classic, gold...
  prepaid: boolean | null
  bankName: string | null
  bankUrl: string | null
  bankPhone: string | null
  bankCity: string | null
  countryName: string | null
  countryCode: string | null
  countryEmoji: string | null
  currency: string | null
  /** API que respondió, o 'fallback' si fue offline. */
  source: 'api' | 'fallback'
  /** Nombre del proveedor que respondió. */
  provider: string | null
}

const cache = new Map<string, BinInfo>()
/** Promesas en vuelo para deduplicar consultas concurrentes del mismo BIN. */
const inflight = new Map<string, Promise<BinInfo>>()

/** Datos aproximados offline por prefijo, para cuando todas las APIs fallan. */
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
    type: null,
    category: null,
    prepaid: null,
    bankName: null,
    bankUrl: null,
    bankPhone: null,
    bankCity: null,
    countryName: null,
    countryCode: null,
    countryEmoji: null,
    currency: null,
    source: 'fallback',
    provider: null,
  }
}

/** Convierte un código de país ISO alpha-2 a emoji de bandera. */
function flagEmoji(alpha2?: string | null): string | null {
  if (!alpha2 || alpha2.length !== 2) return null
  const cc = alpha2.toUpperCase()
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

const titleCase = (s?: string | null): string | null =>
  s ? s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase()) : null

/** Parser para data.handyapi.com */
function fromHandyApi(data: any, provider: string): BinInfo {
  if (data?.Status && data.Status !== 'SUCCESS') {
    throw new Error('handyapi: not found')
  }
  const a2 = data.Country?.A2 ?? null
  return {
    scheme: data.Scheme ? String(data.Scheme).toLowerCase() : null,
    brand: data.Scheme ? String(data.Scheme).toUpperCase() : null,
    type: data.Type ? String(data.Type).toLowerCase() : null,
    category: data.CardTier ? titleCase(data.CardTier) : null,
    prepaid: typeof data.Prepaid === 'boolean' ? data.Prepaid : null,
    bankName: titleCase(data.Issuer) ?? null,
    bankUrl: null,
    bankPhone: null,
    bankCity: null,
    countryName: data.Country?.Name ?? null,
    countryCode: a2,
    countryEmoji: flagEmoji(a2),
    currency: null,
    source: 'api',
    provider,
  }
}

/** Parser para bins.antipublic.cc */
function fromAntipublic(data: any, provider: string): BinInfo {
  if (!data || (!data.bank && !data.brand)) {
    throw new Error('antipublic: empty')
  }
  const a2 = data.country ?? null
  return {
    scheme: data.brand ? String(data.brand).toLowerCase() : null,
    brand: data.brand ? String(data.brand).toUpperCase() : null,
    type: data.type ? String(data.type).toLowerCase() : null,
    category: data.level ? titleCase(data.level) : null,
    prepaid: null,
    bankName: titleCase(data.bank) ?? null,
    bankUrl: null,
    bankPhone: null,
    bankCity: null,
    countryName: titleCase(data.country_name) ?? null,
    countryCode: a2,
    countryEmoji: flagEmoji(a2),
    currency: Array.isArray(data.country_currencies) ? data.country_currencies[0] ?? null : null,
    source: 'api',
    provider,
  }
}

/** Parser para el formato binlist (v3). */
function fromBinlist(data: any, provider: string): BinInfo {
  return {
    scheme: data.scheme ?? null,
    brand: data.brand ?? (data.scheme ? String(data.scheme).toUpperCase() : null),
    type: data.type ?? null,
    category:
      data.prepaid === true ? 'prepaid'
        : data.prepaid === false ? 'standard'
          : null,
    prepaid: typeof data.prepaid === 'boolean' ? data.prepaid : null,
    bankName: data.bank?.name ?? null,
    bankUrl: data.bank?.url ?? null,
    bankPhone: data.bank?.phone ?? null,
    bankCity: data.bank?.city ?? null,
    countryName: data.country?.name ?? null,
    countryCode: data.country?.alpha2 ?? null,
    countryEmoji: data.country?.emoji ?? flagEmoji(data.country?.alpha2),
    currency: data.country?.currency ?? null,
    source: 'api',
    provider,
  }
}

interface Provider {
  name: string
  url: (bin: string) => string
  headers?: Record<string, string>
  parse: (data: any, name: string) => BinInfo
}

/**
 * Proveedores en orden de preferencia.
 * handyapi y antipublic permiten peticiones desde el navegador (CORS),
 * a diferencia de binlist.net que bloquea con 403 desde el cliente.
 */
const PROVIDERS: Provider[] = [
  {
    name: 'handyapi',
    url: (bin) => `https://data.handyapi.com/bin/${bin}`,
    parse: fromHandyApi,
  },
  {
    name: 'antipublic',
    url: (bin) => `https://bins.antipublic.cc/bins/${bin}`,
    parse: fromAntipublic,
  },
  {
    name: 'binlist.net',
    url: (bin) => `https://lookup.binlist.net/${bin}`,
    headers: { 'Accept-Version': '3' },
    parse: fromBinlist,
  },
]

async function fetchProvider(p: Provider, bin: string, timeoutMs = 5000): Promise<BinInfo | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(p.url(bin), {
      headers: p.headers,
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const info = p.parse(data, p.name)
    // Considera válida solo si trae algo útil.
    if (!info.scheme && !info.bankName && !info.type) return null
    return info
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Consulta el BIN (primeros 6-8 dígitos). Prueba cada proveedor en orden
 * y cae al fallback offline si todos fallan. Cachea y deduplica.
 */
export async function lookupBin(cardNumber: string): Promise<BinInfo> {
  const digits = cardNumber.replace(/\D/g, '')
  const bin = digits.slice(0, 8)

  if (bin.length < 6) {
    return buildFallback(bin)
  }

  if (cache.has(bin)) {
    return cache.get(bin)!
  }

  if (inflight.has(bin)) {
    return inflight.get(bin)!
  }

  const job = (async () => {
    for (const provider of PROVIDERS) {
      const info = await fetchProvider(provider, bin)
      if (info) {
        cache.set(bin, info)
        return info
      }
    }
    const fallback = buildFallback(bin)
    cache.set(bin, fallback)
    return fallback
  })()

  inflight.set(bin, job)
  try {
    return await job
  } finally {
    inflight.delete(bin)
  }
}
