import { useState } from 'react'
import { ScanLine, Loader2, Check, X, Trash2, Copy } from 'lucide-react'
import { clsx } from 'clsx'
import { validateLuhn } from '@/features/checker/services/luhn'
import { detectCardType, validateExpiry, validateCVV } from '@/features/checker/services/cardDetector'

type Status = 'enrolled' | 'not-enrolled' | 'invalid'

interface Row3D {
  raw: string
  number: string
  brand: string
  status: Status
  reason: string
}

const STATUS_META: Record<Status, { color: string; label: string }> = {
  enrolled: { color: 'text-cyber-green', label: '3DS Enrolled' },
  'not-enrolled': { color: 'text-cyber-yellow', label: 'Not Enrolled' },
  invalid: { color: 'text-cyber-red', label: 'Invalid Card' },
}

/** Parsea una línea number|MM|YYYY|CVV (campos opcionales salvo número). */
function parseLine(raw: string) {
  const [number = '', mm = '', yyyy = '', cvv = ''] = raw.split('|').map(s => s.trim())
  return { number: number.replace(/\s/g, ''), mm, yyyy, cvv }
}

/**
 * "3D Secure" simulado: valida estructura real (Luhn, marca, expiry, CVV)
 * y deriva un estado de enrolamiento pseudo-aleatorio estable por número.
 * NO realiza ninguna autenticación real con bancos.
 */
function check3D(raw: string): Row3D {
  const { number, mm, yyyy, cvv } = parseLine(raw)
  const info = detectCardType(number)

  if (!number || !validateLuhn(number)) {
    return { raw, number, brand: info.brand, status: 'invalid', reason: 'Luhn check failed' }
  }
  if (mm && yyyy) {
    const exp = `${mm}/${yyyy.slice(-2)}`
    if (!validateExpiry(exp)) {
      return { raw, number, brand: info.brand, status: 'invalid', reason: 'Expired / bad date' }
    }
  }
  if (cvv && !validateCVV(cvv, info.type)) {
    return { raw, number, brand: info.brand, status: 'invalid', reason: 'CVV length mismatch' }
  }

  const seed = number.split('').reduce((a, d) => a + Number(d || 0), 0)
  const enrolled = (seed * 7 + 13) % 10 < 6
  return {
    raw,
    number,
    brand: info.brand,
    status: enrolled ? 'enrolled' : 'not-enrolled',
    reason: enrolled ? 'VBV / 3DS available' : 'No 3DS (frictionless)',
  }
}

const mask = (n: string) =>
  n.length > 10 ? `${n.slice(0, 6)}******${n.slice(-4)}` : n

export function ThreeDCheckerPage() {
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<Row3D[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setRunning(true)
    setRows([])

    for (const line of lines) {
      await new Promise(r => setTimeout(r, 120))
      setRows(prev => [...prev, check3D(line)])
    }
    setRunning(false)
  }

  const enrolled = rows.filter(r => r.status === 'enrolled')

  const copyEnrolled = async () => {
    if (!enrolled.length) return
    await navigator.clipboard.writeText(enrolled.map(r => r.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const counts = {
    enrolled: rows.filter(r => r.status === 'enrolled').length,
    notEnrolled: rows.filter(r => r.status === 'not-enrolled').length,
    invalid: rows.filter(r => r.status === 'invalid').length,
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-red/15 border border-cyber-red/40 flex items-center justify-center">
          <ScanLine size={20} className="text-cyber-red" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">3D Checker</h1>
          <p className="text-xs text-cyber-text-muted">3D Secure enrollment check (simulated) · Luhn + brand + expiry</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="flex flex-col">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder={'4111111111111111|12|2030|123\nOne card per line (number|MM|YYYY|CVV)'}
            className="w-full h-[280px] resize-none rounded-lg border border-cyber-border bg-cyber-dark/70 p-4 text-[13px] font-mono text-cyber-text/90 placeholder:text-cyber-text-muted/40 focus:border-cyber-red/50 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={run}
              disabled={running}
              className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold text-white bg-cyber-red hover:bg-cyber-red-dark disabled:opacity-50 transition-all"
            >
              {running ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              {running ? 'Checking...' : 'Check 3DS'}
            </button>
            <button
              onClick={() => { setInput(''); setRows([]) }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold text-cyber-text-muted border border-cyber-border hover:text-cyber-text transition-all"
            >
              <Trash2 size={15} /> Clear
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border text-xs">
            <div className="flex gap-3">
              <span className="text-cyber-green">Enrolled {counts.enrolled}</span>
              <span className="text-cyber-yellow">No-3DS {counts.notEnrolled}</span>
              <span className="text-cyber-red">Invalid {counts.invalid}</span>
            </div>
            <button onClick={copyEnrolled} disabled={!enrolled.length}
              className="p-1.5 text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors">
              {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[300px]">
            {rows.length === 0 ? (
              <p className="text-center text-xs text-cyber-text-muted/60 py-10">No results yet.</p>
            ) : (
              rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded bg-cyber-dark/40 text-[12px] font-mono animate-fade-in">
                  <span className="flex items-center gap-2 min-w-0">
                    {r.status === 'invalid'
                      ? <X size={13} className="text-cyber-red shrink-0" />
                      : <Check size={13} className={clsx('shrink-0', STATUS_META[r.status].color)} />}
                    <span className="text-cyber-text truncate">{mask(r.number)}</span>
                  </span>
                  <span className={clsx('text-[11px] whitespace-nowrap', STATUS_META[r.status].color)}>
                    {r.reason}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
