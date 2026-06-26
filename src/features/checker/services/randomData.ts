/**
 * Generador de identidades ficticias para pruebas/QA.
 * NO corresponde a personas reales: nombres, direcciones y datos son aleatorios.
 */

export interface RandomIdentity {
  fullName: string
  gender: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  birthDate: string
  ssnLike: string
}

const FIRST_M = ['James', 'John', 'Robert', 'Michael', 'David', 'Daniel', 'Carlos', 'Luis', 'Marco', 'Andre']
const FIRST_F = ['Mary', 'Linda', 'Susan', 'Karen', 'Laura', 'Emma', 'Sofia', 'Lucia', 'Nina', 'Clara']
const LAST = ['Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis', 'Lopez', 'Wilson', 'Moore', 'Taylor']
const STREETS = ['Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Sunset', 'River']
const STREET_TYPE = ['St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Dr']
const CITIES = ['Springfield', 'Riverside', 'Franklin', 'Greenville', 'Bristol', 'Clinton', 'Salem', 'Madison']
const STATES = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']
const COUNTRIES = ['United States']
const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'icloud.com']

const rnd = (n: number) => Math.floor(Math.random() * n)
const pick = <T,>(arr: T[]): T => arr[rnd(arr.length)]
const pad = (n: number, len = 2) => n.toString().padStart(len, '0')

export function generateIdentity(): RandomIdentity {
  const isMale = Math.random() < 0.5
  const first = pick(isMale ? FIRST_M : FIRST_F)
  const last = pick(LAST)
  const num = 100 + rnd(9900)

  const year = 1960 + rnd(45)
  const month = 1 + rnd(12)
  const day = 1 + rnd(28)

  return {
    fullName: `${first} ${last}`,
    gender: isMale ? 'Male' : 'Female',
    email: `${first.toLowerCase()}.${last.toLowerCase()}${rnd(99)}@${pick(DOMAINS)}`,
    phone: `(${200 + rnd(799)}) ${pad(rnd(1000), 3)}-${pad(rnd(10000), 4)}`,
    street: `${num} ${pick(STREETS)} ${pick(STREET_TYPE)}`,
    city: pick(CITIES),
    state: pick(STATES),
    zip: pad(10000 + rnd(89999), 5),
    country: pick(COUNTRIES),
    birthDate: `${pad(month)}/${pad(day)}/${year}`,
    ssnLike: `${pad(100 + rnd(800), 3)}-${pad(rnd(100))}-${pad(1000 + rnd(9000), 4)}`,
  }
}

export function generateIdentities(count: number): RandomIdentity[] {
  return Array.from({ length: Math.min(Math.max(count, 1), 100) }, generateIdentity)
}
