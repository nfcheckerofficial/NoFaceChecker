import { useState } from 'react'
import { Sparkles, Copy, Check, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { generateValidCardNumber } from '@/features/checker/services/luhn'

const MONTHS = ['Random', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const YEARS = ['Random', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35']

const randomDigit = () => Math.floor(Math.random() * 10).toString()

function getSpec(bin: string) {
  if (/^3[47]/.test(bin)) return { length: 15, cvvLength: 4 }
  return { length: 16, cvvLength: 3 }
}
const sanitizeBin = (v: string) => v.toLowerCase().replace(/[^0-9x]/g, '').slice(0, 19)
const resolvePrefix = (p: string) => p.replace(/x/g, () => randomDigit())

export function GeneratorDashboardPage() {
  const [bin, setBin] = useState('')
  const [month, setMonth] = useState('Random')
  const [year, setYear] = useState('Random')
  const [cvv, setCvv] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [output, setOutput] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const digitsBin = bin.replace(/[^0-9]/g, '')

  const resolveMonth = () =>
    month !== 'Random' ? month : (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')
  const resolveYear = () => {
    if (year !== 'Random') return year
    return ((new Date().getFullYear() + Math.floor(Math.random() * 8)) % 100).toString().padStart(2, '0')
  }
  const resolveCvv = (len: number) => {
    const fixed = cvv.replace(/\D/g, '')
    return fixed.length ? fixed.slice(0, len) : Array.from({ length: len }, randomDigit).join('')
  }

  const generate = () => {
    setError('')
    if (digitsBin.length < 6) {
      setError('Enter a valid BIN (at least 6 digits).')
      return
    }
    const spec = getSpec(digitsBin)
    const qty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 9999)
    const lines: string[] = []
    for (let i = 0; i < qty; i++) {
      const number = generateValidCardNumber(resolvePrefix(sanitizeBin(bin)), spec.length)
      lines.push(`${number}|${resolveMonth()}|20${resolveYear()}|${resolveCvv(spec.cvvLength)}`)
    }
    setOutput(lines)
  }

  const copy = async () => {
    if (!output.length) return
    await navigator.clipboard.writeText(output.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inputBase =
    'w-full px-3.5 py-2.5 text-sm bg-cyber-dark border border-cyber-border rounded-md text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-red focus:outline-none transition-all'

  return (
    <div className="max-w-[1000px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-red/15 border border-cyber-red/40 flex items-center justify-center">
          <Sparkles size={20} className="text-cyber-red" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">NoFace Gen</h1>
          <p className="text-xs text-cyber-text-muted">Luhn-valid card generator · number|MM|YYYY|CVV</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 p-6">
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">
              Your Bin <span className="text-cyber-red">*</span>
            </label>
            <input
              value={bin}
              inputMode="numeric"
              onChange={e => setBin(sanitizeBin(e.target.value))}
              placeholder="5312608540xxxxxx"
              className={clsx(inputBase, 'font-mono')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className={inputBase}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">Year</label>
              <select value={year} onChange={e => setYear(e.target.value)} className={inputBase}>
                {YEARS.map(y => <option key={y} value={y}>{y === 'Random' ? 'Random' : `20${y}`}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">CVV</label>
              <input
                value={cvv} inputMode="numeric"
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Random"
                className={clsx(inputBase, 'font-mono')}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">Quantity</label>
              <input
                value={quantity} inputMode="numeric"
                onChange={e => setQuantity(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="10"
                className={clsx(inputBase, 'font-mono')}
              />
            </div>
          </div>

          {error && <p className="text-xs text-cyber-red mb-3">{error}</p>}

          <button
            onClick={generate}
            className="w-full py-3 rounded-md text-sm font-semibold uppercase tracking-wider bg-cyber-red text-white hover:bg-cyber-red-dark hover:shadow-[0_0_20px_rgba(255,0,64,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Generate
          </button>
        </div>

        {/* Output */}
        <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
            <span className="text-xs uppercase tracking-wider text-cyber-text-muted">
              Output ({output.length})
            </span>
            <div className="flex items-center gap-1">
              <button onClick={copy} disabled={!output.length}
                className="p-2 text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors">
                {copied ? <Check size={15} className="text-cyber-green" /> : <Copy size={15} />}
              </button>
              <button onClick={() => setOutput([])}
                className="p-2 text-cyber-text-muted hover:text-cyber-red transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <pre className="flex-1 p-4 text-[12px] font-mono text-cyber-green/85 overflow-auto max-h-[360px] whitespace-pre-wrap break-all">
            {output.length ? output.join('\n') : 'No cards generated yet...'}
          </pre>
        </div>
      </div>
    </div>
  )
}
