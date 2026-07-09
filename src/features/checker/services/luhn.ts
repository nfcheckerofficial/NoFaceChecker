/**
 * Algoritmo Luhn - Validación real de números de tarjeta de crédito
 * https://en.wikipedia.org/wiki/Luhn_algorithm
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')

  if (digits.length < 13 || digits.length > 19) {
    return false
  }

  let sum = 0
  let isSecond = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

    if (isNaN(digit)) {
      return false
    }

    if (isSecond) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isSecond = !isSecond
  }

  return sum % 10 === 0
}

/**
 * Genera un número de tarjeta válido usando Luhn.
 *
 * @param prefix Prefijo/BIN de la red (ej. '4', '51', '6011').
 * @param length Longitud total deseada del número (incluye dígito verificador).
 *               Visa/Mastercard/Discover/JCB = 16, Amex = 15.
 */
export function generateValidCardNumber(prefix: string = '4', length: number = 16): string {
  const sanitizedPrefix = prefix.replace(/\D/g, '')
  const targetLength = Math.max(sanitizedPrefix.length + 1, length)

  let cardNumber = sanitizedPrefix

  // Rellena dígitos aleatorios hasta dejar espacio para el dígito verificador.
  for (let i = cardNumber.length; i < targetLength - 1; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString()
  }

  const checkDigit = calculateLuhnCheckDigit(cardNumber)
  cardNumber += checkDigit

  return cardNumber
}

/**
 * Calcula el dígito de verificación Luhn
 */
function calculateLuhnCheckDigit(partialNumber: string): string {
  let sum = 0
  let isSecond = true

  for (let i = partialNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(partialNumber[i], 10)

    if (isSecond) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isSecond = !isSecond
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

/**
 * Validar varias numeraciones usando Luhn.
 *
 * @param numbers Lista de numeraciones a validar.
 * @returns Lista booleana con los resultados de Luhn.
 */
export function validateMultipleLuhn(numbers: string[]): boolean[] {
  return numbers.map((number) => validateLuhn(number))
}

/**
 * Calcular suma Luhn para un número dado.
 *
 * @param cardNumber El número de tarjeta.
 * @returns La suma Luhn calculada.
 */
export function calculateLuhnSum(cardNumber: string): number {
  const digits = cardNumber.replace(/\D/g, '')

  if (digits.length < 13 || digits.length > 19) {
    return -1
  }

  let sum = 0
  let isSecond = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

    if (isNaN(digit)) {
      return -1
    }

    if (isSecond) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isSecond = !isSecond
  }

  return sum
}