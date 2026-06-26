export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'unknown'

export interface CardInfo {
  type: CardType
  brand: string
  icon: string
  cvvLength: number
  maxLength: number
}

const CARD_PATTERNS: Record<CardType, { pattern: RegExp; info: CardInfo }> = {
  visa: {
    pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
    info: {
      type: 'visa',
      brand: 'Visa',
      icon: '💳',
      cvvLength: 3,
      maxLength: 16,
    },
  },
  mastercard: {
    pattern: /^5[1-5][0-9]{14}$/,
    info: {
      type: 'mastercard',
      brand: 'Mastercard',
      icon: '💳',
      cvvLength: 3,
      maxLength: 16,
    },
  },
  amex: {
    pattern: /^3[47][0-9]{13}$/,
    info: {
      type: 'amex',
      brand: 'American Express',
      icon: '💳',
      cvvLength: 4,
      maxLength: 15,
    },
  },
  discover: {
    pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    info: {
      type: 'discover',
      brand: 'Discover',
      icon: '💳',
      cvvLength: 3,
      maxLength: 16,
    },
  },
  jcb: {
    pattern: /^(?:2131|1800|35\d{3})\d{11}$/,
    info: {
      type: 'jcb',
      brand: 'JCB',
      icon: '💳',
      cvvLength: 3,
      maxLength: 16,
    },
  },
  unknown: {
    pattern: /^/,
    info: {
      type: 'unknown',
      brand: 'Unknown',
      icon: '💳',
      cvvLength: 3,
      maxLength: 19,
    },
  },
}

export function detectCardType(cardNumber: string): CardInfo {
  const cleaned = cardNumber.replace(/\D/g, '')

  for (const [type, { pattern, info }] of Object.entries(CARD_PATTERNS)) {
    if (type === 'unknown') continue
    if (pattern.test(cleaned)) {
      return info
    }
  }

  return CARD_PATTERNS.unknown.info
}

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const cardInfo = detectCardType(cleaned)

  if (cardInfo.type === 'amex') {
    const parts = cleaned.match(/(\d{1,4})(\d{1,6})?(\d{1,5})?/)
    if (parts) {
      return [parts[1], parts[2], parts[3]].filter(Boolean).join(' ')
    }
  }

  const parts = cleaned.match(/.{1,4}/g)
  return parts ? parts.join(' ') : cleaned
}

export function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '')

  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
  }

  return cleaned
}

export function validateExpiry(expiry: string): boolean {
  const [month, year] = expiry.split('/').map(Number)

  if (!month || !year) return false
  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1

  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false

  return true
}

export function validateCVV(cvv: string, cardType: CardType): boolean {
  const expectedLength = CARD_PATTERNS[cardType]?.info.cvvLength || 3
  return cvv.length === expectedLength && /^\d+$/.test(cvv)
}
