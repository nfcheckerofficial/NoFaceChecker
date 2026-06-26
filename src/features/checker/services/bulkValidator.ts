/**
 * Validador MASIVO de tarjetas.
 *
 * Procesa una lista de tarjetas (una por línea) y valida cada una usando las
 * mismas verificaciones reales que el validador individual (Luhn, longitud,
 * expiración y CVV). Opcionalmente enriquece con BIN intel real.
 *
 * Formatos de entrada aceptados por línea (separadores: | , : ; o espacios):
 *   4242424242424242|12/26|123
 *   4242 4242 4242 4242,12/2026,123
 *   4242424242424242 12 26 123
 */

import { runValidationChecks, CardData } from './cardValidator'
import { lookupBin } from './binLookup'

export interface BulkEntry {
  raw: string
  lineNumber: number
  number: string
  expiry: string
  cvv: string
  status: 'live' | 'dead' | 'error'
  reason: string
  brand: string
  bank?: string
  country?: string
}

export interface BulkSummary {
  total: number
  live: number
  dead: number
  errors: number
  duplicates: number
}

export interface BulkResult {
  entries: BulkEntry[]
  summary: BulkSummary
}

/**
 * Normaliza una expiración a formato MM/YY.
 */
function normalizeExpiry(month: string, year: string): string {
  const m = month.padStart(2, '0').slice(0, 2)
  let y = year
  if (y.length === 4) y = y.slice(2)
  y = y.padStart(2, '0').slice(0, 2)
  return `${m}/${y}`
}

/**
 * Intenta extraer numero/expiry/cvv de una línea cruda.
 */
function parseLine(raw: string): { number: string; expiry: string; cvv: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Tokens separados por | , : ; o espacios.
  const tokens = trimmed.split(/[\s|,:;]+/).filter(Boolean)
  if (tokens.length === 0) return null

  // El número es el primer token (o varios tokens de 4 dígitos juntos).
  // Primero intentamos detectar un bloque largo de dígitos.
  const digitsOnly = trimmed.replace(/\D/g, '')

  // Caso 1: separadores claros -> primer token es el número (puede tener espacios
  // si venía como "4242 4242 4242 4242", pero el split ya los separó). Reconstruimos.
  // Estrategia: tomamos los primeros tokens que sean solo dígitos hasta sumar 13-19.
  let number = ''
  let idx = 0
  while (idx < tokens.length && /^\d+$/.test(tokens[idx]) && number.length < 19) {
    const next = number + tokens[idx]
    if (next.length > 19) break
    number = next
    idx++
    if (number.length >= 13 && number.length <= 19) {
      // Mira si el siguiente token parece una fecha (contiene / o tiene 2-4 chars)
      const peek = tokens[idx]
      if (!peek || /\//.test(peek) || /^\d{2,4}$/.test(peek)) break
    }
  }

  if (number.length < 13 && digitsOnly.length >= 13) {
    number = digitsOnly.slice(0, 16)
  }

  const rest = tokens.slice(idx)

  let expiry = ''
  let cvv = ''

  // Buscar expiración: token con "/" o dos tokens consecutivos MM y YY/YYYY.
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i]
    if (/^\d{1,2}\/\d{2,4}$/.test(t)) {
      const [mm, yy] = t.split('/')
      expiry = normalizeExpiry(mm, yy)
      rest.splice(i, 1)
      break
    }
    if (/^\d{1,2}$/.test(t) && /^\d{2,4}$/.test(rest[i + 1] || '')) {
      expiry = normalizeExpiry(t, rest[i + 1])
      rest.splice(i, 2)
      break
    }
  }

  // CVV: primer token de 3-4 dígitos restante.
  const cvvToken = rest.find((t) => /^\d{3,4}$/.test(t))
  if (cvvToken) cvv = cvvToken

  if (!number) return null
  return { number, expiry, cvv }
}

/**
 * Valida una sola línea (sin BIN lookup).
 */
function validateEntry(raw: string, lineNumber: number): BulkEntry {
  const parsed = parseLine(raw)

  if (!parsed) {
    return {
      raw,
      lineNumber,
      number: '',
      expiry: '',
      cvv: '',
      status: 'error',
      reason: 'Could not parse line',
      brand: 'UNKNOWN',
    }
  }

  const cardData: CardData = {
    number: parsed.number,
    expiry: parsed.expiry,
    cvv: parsed.cvv,
  }

  const { checks, cardType, isValid } = runValidationChecks(cardData)
  const failed = checks.filter((c) => !c.passed).map((c) => c.label)
  const brand = cardType !== 'unknown' ? cardType.toUpperCase() : 'UNKNOWN'

  return {
    raw,
    lineNumber,
    number: parsed.number,
    expiry: parsed.expiry,
    cvv: parsed.cvv,
    status: isValid ? 'live' : 'dead',
    reason: isValid ? 'All checks passed' : `Failed: ${failed.join(', ')}`,
    brand,
  }
}

export interface BulkOptions {
  /** Consultar BIN intel real (más lento, llamadas a red). */
  withBinLookup?: boolean
  /** Saltar duplicados exactos de número. */
  dedupe?: boolean
  /** Callback de progreso (0-1). */
  onProgress?: (done: number, total: number) => void
}

/**
 * Valida un bloque de texto con múltiples tarjetas.
 */
export async function validateBulk(
  input: string,
  options: BulkOptions = {}
): Promise<BulkResult> {
  const { withBinLookup = false, dedupe = true, onProgress } = options

  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const entries: BulkEntry[] = []
  const seen = new Set<string>()
  let duplicates = 0

  for (let i = 0; i < lines.length; i++) {
    const entry = validateEntry(lines[i], i + 1)

    if (dedupe && entry.number) {
      if (seen.has(entry.number)) {
        duplicates++
        onProgress?.(i + 1, lines.length)
        continue
      }
      seen.add(entry.number)
    }

    entries.push(entry)
    onProgress?.(i + 1, lines.length)
  }

  // Enriquecer con BIN intel real solo para las válidas (en paralelo, limitado).
  if (withBinLookup) {
    const liveEntries = entries.filter((e) => e.status === 'live')
    const concurrency = 5
    for (let i = 0; i < liveEntries.length; i += concurrency) {
      const batch = liveEntries.slice(i, i + concurrency)
      await Promise.all(
        batch.map(async (entry) => {
          try {
            const bin = await lookupBin(entry.number)
            entry.bank = bin.bankName ?? undefined
            entry.country = bin.countryName ?? undefined
            if (bin.scheme) entry.brand = bin.scheme.toUpperCase()
          } catch {
            /* mantiene datos básicos */
          }
        })
      )
    }
  }

  const summary: BulkSummary = {
    total: entries.length,
    live: entries.filter((e) => e.status === 'live').length,
    dead: entries.filter((e) => e.status === 'dead').length,
    errors: entries.filter((e) => e.status === 'error').length,
    duplicates,
  }

  return { entries, summary }
}

/**
 * Exporta solo las tarjetas LIVE en formato pipe.
 */
export function exportLive(result: BulkResult): string {
  return result.entries
    .filter((e) => e.status === 'live')
    .map((e) => [e.number, e.expiry, e.cvv].filter(Boolean).join('|'))
    .join('\n')
}
