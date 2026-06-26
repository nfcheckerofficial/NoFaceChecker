import { useState, useMemo } from 'react'
import { Button } from '@/shared/ui/Button'
import { GlitchText } from '@/shared/ui/GlitchText'
import {
  validateBulk,
  exportLive,
  BulkResult,
  BulkEntry,
} from '../services/bulkValidator'
import {
  Layers,
  Play,
  Copy,
  Check,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'

interface BulkCheckerProps {
  className?: string
}

type Filter = 'all' | 'live' | 'dead' | 'error'

const SAMPLE = `4242 4242 4242 4242|12/26|123
5555 5555 5555 4444|01/27|456
3782 822463 10005|11/26|1234
4000 0000 0000 0002,09/2028,321
1234 5678 9012 3456|13/20|99`

export function BulkChecker({ className }: BulkCheckerProps) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<BulkResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [withBin, setWithBin] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)

  const lineCount = input.split(/\r?\n/).filter((l) => l.trim()).length

  const run = async () => {
    if (!input.trim() || isRunning) return
    setIsRunning(true)
    setProgress(0)
    setResult(null)

    const res = await validateBulk(input, {
      withBinLookup: withBin,
      dedupe: true,
      onProgress: (done, total) => {
        setProgress(total > 0 ? Math.round((done / total) * 100) : 0)
      },
    })

    setResult(res)
    setProgress(100)
    setIsRunning(false)
    setFilter('all')
  }

  const filtered = useMemo<BulkEntry[]>(() => {
    if (!result) return []
    if (filter === 'all') return result.entries
    return result.entries.filter((e) => e.status === filter)
  }, [result, filter])

  const copyLive = async () => {
    if (!result) return
    const out = exportLive(result)
    if (!out) return
    await navigator.clipboard.writeText(out)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadLive = () => {
    if (!result) return
    const out = exportLive(result)
    if (!out) return
    const blob = new Blob([out], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `live_cards_${result.summary.live}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setInput('')
    setResult(null)
    setProgress(0)
    setFilter('all')
  }

  return (
    <div className={clsx('w-full grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {/* Panel de entrada */}
      <div className="bg-cyber-panel/95 backdrop-blur-sm border border-cyber-border rounded-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-cyber-border bg-cyber-dark/50 flex items-center justify-between">
          <GlitchText
            intensity="low"
            className="text-sm text-cyber-blue font-bold tracking-wider"
          >
            BULK INPUT
          </GlitchText>
          <Layers size={14} className="text-cyber-blue/60" />
        </div>

        <div className="p-5 space-y-4 flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-cyber-text-muted/60 uppercase tracking-wider">
              ONE CARD PER LINE — {lineCount} line{lineCount === 1 ? '' : 's'}
            </label>
            <button
              onClick={() => setInput(SAMPLE)}
              className="text-[10px] font-mono text-cyber-blue/70 hover:text-cyber-blue transition-colors"
            >
              load sample
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRunning}
            spellCheck={false}
            placeholder={`number|MM/YY|CVV\n4242424242424242|12/26|123`}
            className="w-full h-64 px-3 py-3 text-[11px] font-mono leading-relaxed bg-cyber-dark/50 border border-cyber-border/50 rounded-sm text-cyber-green/80 placeholder:text-cyber-text-muted/30 focus:border-cyber-blue focus:outline-none resize-none break-all"
          />

          <div className="flex items-center justify-between">
            <label className="text-[10px] text-cyber-text-muted/60 uppercase tracking-wider">
              FETCH BIN INTEL (slower)
            </label>
            <button
              onClick={() => setWithBin(!withBin)}
              disabled={isRunning}
              className={clsx(
                'relative w-10 h-5 rounded-full transition-colors duration-200',
                withBin ? 'bg-cyber-blue' : 'bg-cyber-dark'
              )}
            >
              <div
                className={clsx(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                  withBin ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {isRunning && (
            <div className="space-y-1">
              <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-green transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[10px] text-cyber-text-muted text-right">{progress}%</div>
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <Button
              onClick={run}
              size="md"
              glow
              disabled={isRunning || !input.trim()}
              className="flex-1"
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={14} />
                {isRunning ? 'VALIDATING...' : 'VALIDATE ALL'}
              </span>
            </Button>
            <Button onClick={reset} variant="secondary" size="md" disabled={isRunning}>
              <span className="flex items-center justify-center gap-2">
                <Trash2 size={14} />
                CLEAR
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Panel de resultados */}
      <div className="bg-cyber-panel/95 backdrop-blur-sm border border-cyber-border rounded-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-cyber-border bg-cyber-dark/50 flex items-center justify-between">
          <span className="text-sm text-cyber-red font-bold tracking-wider">RESULTS</span>
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyLive}
                disabled={result.summary.live === 0}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-sm border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
                  copied
                    ? 'bg-cyber-green/20 border-cyber-green text-cyber-green'
                    : 'bg-cyber-dark/50 border-cyber-border/50 text-cyber-text-muted hover:border-cyber-green/50 hover:text-cyber-green'
                )}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'COPIED' : 'COPY LIVE'}
              </button>
              <button
                onClick={downloadLive}
                disabled={result.summary.live === 0}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-sm border bg-cyber-dark/50 border-cyber-border/50 text-cyber-text-muted hover:border-cyber-blue/50 hover:text-cyber-blue transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={10} />
                SAVE
              </button>
            </div>
          )}
        </div>

        {!result ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <p className="text-xs text-cyber-text-muted/60">
              Results will appear here after validation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-px bg-cyber-border/50 border-b border-cyber-border">
              <SummaryCell label="TOTAL" value={result.summary.total} color="text-cyber-blue" />
              <SummaryCell label="LIVE" value={result.summary.live} color="text-cyber-green" />
              <SummaryCell label="DEAD" value={result.summary.dead} color="text-cyber-red" />
              <SummaryCell
                label="ERROR"
                value={result.summary.errors}
                color="text-cyber-yellow"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border">
              {(['all', 'live', 'dead', 'error'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm border transition-all duration-200',
                    filter === f
                      ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue'
                      : 'bg-cyber-dark/50 border-cyber-border/50 text-cyber-text-muted hover:border-cyber-blue/50'
                  )}
                >
                  {f}
                </button>
              ))}
              {result.summary.duplicates > 0 && (
                <span className="ml-auto text-[10px] text-cyber-text-muted/60">
                  {result.summary.duplicates} dup skipped
                </span>
              )}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-cyber-border/40">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-cyber-text-muted/60">
                  No entries for this filter.
                </div>
              ) : (
                filtered.map((entry) => <BulkRow key={entry.lineNumber} entry={entry} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-cyber-panel/95 px-3 py-3 text-center">
      <div className={clsx('text-xl font-bold', color)}>{value}</div>
      <div className="text-[9px] text-cyber-text-muted uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  )
}

function maskBulk(num: string): string {
  if (!num) return '—'
  if (num.length <= 4) return num
  return num.slice(0, 6) + '*'.repeat(Math.max(0, num.length - 10)) + num.slice(-4)
}

function BulkRow({ entry }: { entry: BulkEntry }) {
  const icon =
    entry.status === 'live' ? (
      <CheckCircle size={14} className="text-cyber-green shrink-0" />
    ) : entry.status === 'dead' ? (
      <XCircle size={14} className="text-cyber-red shrink-0" />
    ) : (
      <AlertTriangle size={14} className="text-cyber-yellow shrink-0" />
    )

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyber-dark/30 transition-colors">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono text-cyber-text truncate">
          {maskBulk(entry.number)}
          {entry.expiry && (
            <span className="text-cyber-text-muted/70"> · {entry.expiry}</span>
          )}
        </div>
        <div className="text-[10px] text-cyber-text-muted/60 truncate">
          {entry.reason}
          {entry.bank ? ` · ${entry.bank}` : ''}
          {entry.country ? ` · ${entry.country}` : ''}
        </div>
      </div>
      <span
        className={clsx(
          'text-[10px] font-bold uppercase shrink-0',
          entry.status === 'live'
            ? 'text-cyber-green'
            : entry.status === 'dead'
              ? 'text-cyber-red'
              : 'text-cyber-yellow'
        )}
      >
        {entry.brand}
      </span>
    </div>
  )
}
