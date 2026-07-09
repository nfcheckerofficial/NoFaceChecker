export interface GateConfig {
  id: string
  name: string
  liveCost: number
  deadCost: number
  liveRate: number
  unknownRate: number
  speedMs: number
}

export const GATE_CATALOG: Record<string, GateConfig> = {
  'money-gate': { id: 'money-gate', name: 'Money Gate', liveCost: 2, deadCost: 0, liveRate: 0.12, unknownRate: 0.08, speedMs: 900 },
}

export function isAmazonGate(_gateId: string): boolean {
  return false
}

export function getBestGate(): GateConfig {
  return GATE_CATALOG['money-gate']
}

export const DEFAULT_GATE = getBestGate()

export function getGateConfig(id?: string): GateConfig {
  if (!id) return DEFAULT_GATE
  return GATE_CATALOG[id] ?? DEFAULT_GATE
}

export function getGatesSortedByRate(): GateConfig[] {
  return [GATE_CATALOG['money-gate']]
}
