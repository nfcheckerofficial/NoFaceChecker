/**
 * Validador de tarjetas REAL.
 *
 * Determina si una tarjeta es válida (LIVE) o inválida (DEAD) en base a
 * verificaciones legítimas y deterministas:
 *   - Algoritmo de Luhn (checksum)
 *   - Longitud correcta para la marca detectada
 *   - Vigencia de la fecha de expiración
 *   - Longitud correcta del CVV
 *
 * Adicionalmente enriquece el resultado con información REAL del BIN
 * (banco emisor, país, tipo de tarjeta) consultando binLookup.
 *
 * IMPORTANTE: "LIVE/DEAD" aquí significa VÁLIDA/INVÁLIDA según el formato y
 * el checksum. NO indica que la tarjeta tenga fondos ni que esté activa en el
 * banco; eso es imposible de comprobar sin ser el titular o un comercio
 * autorizado realizando un cargo real.
 */

import { validateLuhn } from './luhn'
import {
  detectCardType,
  validateExpiry,
  validateCVV,
  CardType,
} from './cardDetector'
import { lookupBin, BinInfo } from './binLookup'

export interface CardData {
  number: string
  expiry: string
  cvv: string
}

export interface ValidationCheck {
  label: string
  passed: boolean
  detail: string
}

export interface CheckResult {
  status: 'live' | 'dead'
  cardNumber: string
  cardType: CardType
  brand: string
  bank: string
  country: string
  countryEmoji: string
  cardCategory: string
  bin: string
  checks: ValidationCheck[]
  binSource: 'api' | 'fallback'
  timestamp: Date
  message: string
  gateName?: string
}

function maskNumber(cleaned: string): string {
  if (cleaned.length <= 4) return cleaned
  const last4 = cleaned.slice(-4)
  const masked = '*'.repeat(cleaned.length - 4) + last4
  return masked.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Construye la lista de comprobaciones reales sobre la tarjeta.
 */
export function runValidationChecks(cardData: CardData): {
  checks: ValidationCheck[]
  cardType: CardType
  isValid: boolean
} {
  const cleaned = cardData.number.replace(/\D/g, '')
  const cardInfo = detectCardType(cleaned)

  const luhnOk = validateLuhn(cleaned)
  const knownBrand = cardInfo.type !== 'unknown'
  const lengthOk = knownBrand ? cleaned.length === cardInfo.maxLength : cleaned.length >= 13
  const expiryOk = validateExpiry(cardData.expiry)
  const cvvOk = validateCVV(cardData.cvv, cardInfo.type)

  const checks: ValidationCheck[] = [
    {
      label: 'Luhn Checksum',
      passed: luhnOk,
      detail: luhnOk ? 'Valid checksum' : 'Failed Luhn algorithm',
    },
    {
      label: 'Card Brand',
      passed: knownBrand,
      detail: knownBrand ? cardInfo.brand : 'Unrecognized BIN range',
    },
    {
      label: 'Number Length',
      passed: lengthOk,
      detail: lengthOk
        ? `${cleaned.length} digits`
        : `Expected ${knownBrand ? cardInfo.maxLength : '13-19'} digits`,
    },
    {
      label: 'Expiry Date',
      passed: expiryOk,
      detail: expiryOk ? 'Not expired' : 'Invalid or expired',
    },
    {
      label: 'CVV Format',
      passed: cvvOk,
      detail: cvvOk ? `${cardData.cvv.length} digits` : 'Wrong length',
    },
  ]

  // Una tarjeta se considera "LIVE" (válida) si pasa Luhn, longitud,
  // expiración y CVV. La marca conocida es deseable pero no obligatoria.
  const isValid = luhnOk && lengthOk && expiryOk && cvvOk

  return { checks, cardType: cardInfo.type, isValid }
}

/**
 * Valida una tarjeta y enriquece con datos reales del BIN.
 */
export async function checkCard(cardData: CardData): Promise<CheckResult> {
  const cleaned = cardData.number.replace(/\D/g, '')
  const { checks, cardType, isValid } = runValidationChecks(cardData)

  let bin: BinInfo
  try {
    bin = await lookupBin(cleaned)
  } catch {
    bin = {
      scheme: null,
      brand: null,
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

  const detectedBrand =
    bin.brand ?? bin.scheme?.toUpperCase() ?? (cardType !== 'unknown' ? cardType.toUpperCase() : 'UNKNOWN')

  return {
    status: isValid ? 'live' : 'dead',
    cardNumber: maskNumber(cleaned),
    cardType,
    brand: detectedBrand,
    bank: bin.bankName ?? 'Unknown Issuer',
    country: bin.countryName ?? 'Unknown',
    countryEmoji: bin.countryEmoji ?? '',
    cardCategory: [bin.type, bin.category].filter(Boolean).join(' · ') || 'Unknown',
    bin: cleaned.slice(0, 6),
    checks,
    binSource: bin.source,
    timestamp: new Date(),
    message: isValid
      ? 'Card passed all format & checksum validations'
      : 'Card failed one or more validation checks',
  }
}
