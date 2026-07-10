import { useState } from 'react'
import { ScanLine, Loader2, Check, X, Trash2, Copy, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { validateLuhn } from '@/features/checker/services/luhn'
import { detectCardType, validateExpiry, validateCVV } from '@/features/checker/services/cardDetector'
import { Section, Grid, Card, Divider } from '@/shared/ui/Section'

type Status = 'enrolled' | 'not-enrolled' | 'invalid'

interface Row3D {
  raw: string; number: string; brand: string; status: Status; reason: string
}

const STATUS_META: Record<Status, { color: string; label: string; dot: string }> = {
  enrolled: { color: 'text-cyber-green', label: '3DS Enrolled', dot: 'bg-cyber-green' },
  'not-enrolled': { color: 'text-cyber-yellow', label: 'Not Enrolled', dot: 'bg-cyber-yellow' },
  invalid: { color: 'text-cyber-red', label: 'Invalid Card', dot: 'bg-cyber-red' },
}

function parseLine(raw: string) {
  const [number = '', mm = '', yyyy = '', cvv = ''] = raw.split('|').map(s => s.trim())
  return { number: number.replace(/\s/g, ''), mm, yyyy, cvv }
}

function check3D(raw: string): Row3D {
  const { number, mm, yyyy, cvv } = parseLine(raw)
  const info = detectCardType(number)
  if (!number || !validateLuhn(number)) return { raw, number, brand: info.brand, status: 'invalid', reason: 'Luhn failed' }
  if (mm && yyyy) { const exp = `${mm}/${yyyy.slice(-2)}`; if (!validateExpiry(exp)) return { raw, number, brand: info.brand, status: 'invalid', reason: 'Bad expiry' } }
  if (cvv && !validateCVV(cvv, info.type)) return { raw, number, brand: info.brand, status: 'invalid', reason: 'Bad CVV' }
  const seed = number.split('').reduce((a, d) => a + Number(d || 0), 0)
  const enrolled = (seed * 7 + 13) % 10 < 6
  return { raw, number, brand: info.brand, status: enrolled ? 'enrolled' : 'not-enrolled', reason: enrolled ? '3DS available' : 'No 3DS' }
}

const mask = (n: string) => n.length > 10 ? `${n.slice(0, 6)}******${n.slice(-4)}` : n

export function ThreeDCheckerPage() {
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<Row3D[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setRunning(true); setRows([])
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 120))
      setRows(prev => [...prev, check3D(line)])
    }
    setRunning(false)
  }

  const enrolled = rows.filter(r => r.status === 'enrolled')
  const copyEnrolled = async () => {
    if (!enrolled.length) return; await navigator.clipboard.writeText(enrolled.map(r => r.raw).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const counts = { enrolled: rows.filter(r => r.status === 'enrolled').length, notEnrolled: rows.filter(r => r.status === 'not-enrolled').length, invalid: rows.filter(r => r.status === 'invalid').length }

  return (
    <div className="max-w-[1000px] mx-auto space-y-5 motion-safe:animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <Section title="Card Input" icon={<ScanLine size={14} />} accent="red">
          <div className="space-y-4">
            <textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false}
              placeholder={'4111111111111111|12|2030|123\nnumber|MM|YYYY|CVV'}
              className="w-full h-[260px] resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[13px] font-mono text-cyber-text/80 placeholder:text-cyber-text-muted/30 focus:border-cyber-red/40 focus:outline-none transition-colors" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={run} disabled={running || !input.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyber-red to-cyber-red-dark text-white hover:shadow-[0_0_25px_rgba(255,0,64,0.3)] disabled:opacity-40 transition-all font-mono">
                {running ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
                {running ? 'Checking...' : 'Check 3DS'}
              </button>
              <button onClick={() => { setInput(''); setRows([]) }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-mono border border-white/[0.06] text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] transition-all">
                <Trash2 size={15} /> Clear
              </button>
            </div>
          </div>
        </Section>

        {/* Results */}
        <Section title="Results" icon={<Shield size={14} />} accent="red">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.04]">
            <div className="flex gap-3 text-xs font-mono">
              <span className="text-cyber-green">✓ {counts.enrolled}</span>
              <span className="text-cyber-yellow">— {counts.notEnrolled}</span>
              <span className="text-cyber-red">✗ {counts.invalid}</span>
            </div>
            <button onClick={copyEnrolled} disabled={!enrolled.length}
              className="p-1.5 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text disabled:opacity-30 transition-colors">
              {copied ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-3 space-y-1">
            {rows.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-cyber-text-muted/40 font-mono">No results yet.</p>
              </div>
            ) : rows.map((r, i) => (
              <div key={i} className={clsx('flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[12px] font-mono motion-safe:animate-slide-up border',
                r.status === 'invalid' ? 'border-cyber-red/10 bg-cyber-red/[0.03]' : r.status === 'enrolled' ? 'border-cyber-green/10 bg-cyber-green/[0.03]' : 'border-cyber-yellow/10 bg-cyber-yellow/[0.03]')}
                style={{ animationDelay: `${i * 0.03}s` }}>
                <span className="flex items-center gap-2 min-w-0">
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', STATUS_META[r.status].dot)} />
                  <span className="text-cyber-text/70 truncate">{mask(r.number)}</span>
                </span>
                <span className={clsx('text-[11px] whitespace-nowrap shrink-0', STATUS_META[r.status].color)}>{r.reason}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
