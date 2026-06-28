// Lookup de BIN (Bank Identification Number) usando APIs publicas.
// Misma logica que src/features/checker/services/extrapService.ts pero
// en el backend, para poder consumirla desde el bot de Telegram.

const PROVIDERS = [
  {
    name: 'antipublic',
    url: (bin) => `https://bins.antipublic.cc/bins/${bin}`,
  },
  {
    name: 'handyapi',
    url: (bin) => `https://data.handyapi.com/bin/${bin}`,
  },
  {
    name: 'binlist',
    url: (bin) => `https://lookup.binlist.net/${bin}`,
    headers: { 'Accept-Version': '3' },
  },
]

function flagEmoji(alpha2) {
  if (!alpha2 || alpha2.length !== 2) return null
  const cc = alpha2.toUpperCase()
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

function titleCase(s) {
  if (!s) return null
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase())
}

async function fetchSingle(bin) {
  for (const p of PROVIDERS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(p.url(bin), {
        headers: p.headers,
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

export async function lookupBin(bin) {
  const digits = String(bin || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length < 6) return { error: 'BIN must be at least 6 digits' }

  const exact = await fetchSingle(digits)

  // Hasta 40 BINs cercanos (±20) en paralelo
  const base = parseInt(digits.slice(0, 6), 10)
  const offsets = []
  for (let i = 1; i <= 20; i++) offsets.push(i, -i)
  const batch = offsets.map((off) => fetchSingle(String(base + off).padStart(6, '0')))
  const settled = await Promise.allSettled(batch)
  const nearby = settled
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value)

  return { exact, nearby }
}
