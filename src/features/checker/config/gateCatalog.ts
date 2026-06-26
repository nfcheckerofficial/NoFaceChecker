/**
 * Catálogo de "gates" disponibles. Cada uno define su nombre, costos
 * y las tasas de aprobación del gateway SIMULADO (no son operaciones reales).
 */

export interface GateConfig {
  id: string
  name: string
  liveCost: number
  deadCost: number
  /** Probabilidad de salir "live" (0–1). */
  liveRate: number
  /** Probabilidad de salir "unknown" (0–1). El resto es "dead". */
  unknownRate: number
  /** Velocidad de procesamiento por tarjeta (ms). */
  speedMs: number
}

export const GATE_CATALOG: Record<string, GateConfig> = {
  // Stripe CCN
  'stripe-ccn-vice': { id: 'stripe-ccn-vice', name: 'Vice Gate', liveCost: 2, deadCost: 0, liveRate: 0.12, unknownRate: 0.08, speedMs: 900 },
  'stripe-ccn-ocean': { id: 'stripe-ccn-ocean', name: 'Ocean Gate', liveCost: 2, deadCost: 0, liveRate: 0.14, unknownRate: 0.07, speedMs: 920 },
  'stripe-ccn-chinesse': { id: 'stripe-ccn-chinesse', name: 'Chinesse Gate', liveCost: 2, deadCost: 0, liveRate: 0.11, unknownRate: 0.09, speedMs: 880 },
  'stripe-ccn-emotion': { id: 'stripe-ccn-emotion', name: 'Emotion Gate', liveCost: 2, deadCost: 0, liveRate: 0.13, unknownRate: 0.06, speedMs: 910 },
  'stripe-ccn-sky': { id: 'stripe-ccn-sky', name: 'Sky Gate', liveCost: 2, deadCost: 0, liveRate: 0.15, unknownRate: 0.05, speedMs: 870 },
  'stripe-ccn-sunder': { id: 'stripe-ccn-sunder', name: 'Sunder Gate', liveCost: 2, deadCost: 0, liveRate: 0.10, unknownRate: 0.08, speedMs: 930 },
  'stripe-ccn-thor': { id: 'stripe-ccn-thor', name: 'ThorGate', liveCost: 2, deadCost: 0, liveRate: 0.16, unknownRate: 0.06, speedMs: 850 },
  'stripe-ccn-sugar': { id: 'stripe-ccn-sugar', name: 'Sugar Gate', liveCost: 2, deadCost: 0, liveRate: 0.12, unknownRate: 0.07, speedMs: 900 },

  // Stripe Auth
  'stripe-auth-auth': { id: 'stripe-auth-auth', name: 'Auth Gate', liveCost: 3, deadCost: 0, liveRate: 0.18, unknownRate: 0.07, speedMs: 950 },
  'stripe-auth-inferno': { id: 'stripe-auth-inferno', name: 'Inferno Gate', liveCost: 3, deadCost: 0, liveRate: 0.20, unknownRate: 0.06, speedMs: 1000 },
  'stripe-auth-sova': { id: 'stripe-auth-sova', name: 'Sova Gate', liveCost: 3, deadCost: 0, liveRate: 0.17, unknownRate: 0.08, speedMs: 970 },

  // Charge Gates
  'charge-horus': { id: 'charge-horus', name: 'Horus Gate (Paypal)', liveCost: 4, deadCost: 0, liveRate: 0.15, unknownRate: 0.10, speedMs: 1200 },
  'charge-payflow3': { id: 'charge-payflow3', name: 'Payflow 3', liveCost: 3, deadCost: 0, liveRate: 0.14, unknownRate: 0.08, speedMs: 1100 },
  'charge-payflow2': { id: 'charge-payflow2', name: 'Payflow 2', liveCost: 3, deadCost: 0, liveRate: 0.13, unknownRate: 0.09, speedMs: 1050 },
  'charge-payflow': { id: 'charge-payflow', name: 'Payflow', liveCost: 3, deadCost: 0, liveRate: 0.12, unknownRate: 0.10, speedMs: 1000 },
  'charge-b3gate2': { id: 'charge-b3gate2', name: 'B3 Gate 2', liveCost: 4, deadCost: 0, liveRate: 0.16, unknownRate: 0.07, speedMs: 1150 },
  'charge-b3gate': { id: 'charge-b3gate', name: 'B3 Gate', liveCost: 4, deadCost: 0, liveRate: 0.14, unknownRate: 0.08, speedMs: 1100 },
  'charge-bird': { id: 'charge-bird', name: 'Bird Gate (Authorize)', liveCost: 5, deadCost: 0, liveRate: 0.18, unknownRate: 0.06, speedMs: 1300 },

  // Paypal Charge
  'paypal-5': { id: 'paypal-5', name: '5 Paypal', liveCost: 5, deadCost: 0, liveRate: 0.18, unknownRate: 0.10, speedMs: 1400 },
  'paypal-1': { id: 'paypal-1', name: 'Paypal 1', liveCost: 4, deadCost: 0, liveRate: 0.13, unknownRate: 0.12, speedMs: 1300 },
  'paypal-001': { id: 'paypal-001', name: '0.01 Paypal', liveCost: 1, deadCost: 0, liveRate: 0.10, unknownRate: 0.15, speedMs: 800 },

  // Gates Especiales
  'special-allbirds': { id: 'special-allbirds', name: 'AllBirds', liveCost: 6, deadCost: 1, liveRate: 0.22, unknownRate: 0.05, speedMs: 1100 },
  'special-misshopifycvv': { id: 'special-misshopifycvv', name: 'MisShopifyCVV', liveCost: 6, deadCost: 1, liveRate: 0.20, unknownRate: 0.06, speedMs: 1050 },
  'special-mejorshopify': { id: 'special-mejorshopify', name: 'MejorShopify[JOYAS]', liveCost: 7, deadCost: 1, liveRate: 0.25, unknownRate: 0.04, speedMs: 1200 },
  'special-fashionnova': { id: 'special-fashionnova', name: 'FashionNovaShopify', liveCost: 6, deadCost: 1, liveRate: 0.21, unknownRate: 0.05, speedMs: 1100 },
  'special-redbull': { id: 'special-redbull', name: 'RedBull', liveCost: 5, deadCost: 1, liveRate: 0.19, unknownRate: 0.07, speedMs: 1000 },
  'special-shopifygold': { id: 'special-shopifygold', name: 'Shopify[GOLD]', liveCost: 8, deadCost: 1, liveRate: 0.28, unknownRate: 0.03, speedMs: 1300 },
  'special-adobe': { id: 'special-adobe', name: 'Adobe', liveCost: 5, deadCost: 0, liveRate: 0.16, unknownRate: 0.08, speedMs: 1050 },

  // Auth Gates
  'auth-gates-pool': { id: 'auth-gates-pool', name: 'Auth Gates Pool', liveCost: 3, deadCost: 0, liveRate: 0.19, unknownRate: 0.06, speedMs: 900 },

  // Brute Gates
  'brute-1': { id: 'brute-1', name: 'Brute Gate #1', liveCost: 1, deadCost: 0, liveRate: 0.08, unknownRate: 0.04, speedMs: 600 },

  // Achiever's Gate
  achievers: { id: 'achievers', name: "Achiever's Gate", liveCost: 0, deadCost: 0, liveRate: 0.3, unknownRate: 0.05, speedMs: 1000 },
}

export const DEFAULT_GATE = GATE_CATALOG['stripe-ccn-vice']

export function getGateConfig(id?: string): GateConfig {
  if (!id) return DEFAULT_GATE
  return GATE_CATALOG[id] ?? DEFAULT_GATE
}
