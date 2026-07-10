import { useState } from 'react'
import { Sparkles, Copy, Check, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { generateValidCardNumber } from '@/features/checker/services/luhn'
import { Section, Grid, Card, Divider } from '@/shared/ui/Section'

const MONTHS = ['Random', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const YEARS = ['Random', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35']

const randomDigit = () => Math.floor(Math.random() * 10).toString()

function getSpec(bin: string) {
  return /^3[47]/.test(bin) ? { length: 15, cvvLength: 4 } : { length: 16, cvvLength: 3 }
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

  const resolveMonth = () => month !== 'Random' ? month : (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')
  const resolveYear = () => year !== 'Random' ? year : ((new Date().getFullYear() + Math.floor(Math.random() * 8)) % 100).toString().padStart(2, '0')
  const resolveCvv = (len: number) => { const f = cvv.replace(/\D/g, ''); return f.length ? f.slice(0, len) : Array.from({ length: len }, randomDigit).join('') }

  const generate = () => {
    setError('')
    if (digitsBin.length < 6) { setError('Enter a valid BIN (at least 6 digits).'); return }
    const spec = getSpec(digitsBin)
    const qty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 9999)
    const lines: string[] = []
    for (let i = 0; i < qty; i++) lines.push(`${generateValidCardNumber(resolvePrefix(sanitizeBin(bin)), spec.length)}|${resolveMonth()}|20${resolveYear()}|${resolveCvv(spec.cvvLength)}`)
    setOutput(lines)
  }

  const copy = async () => {
    if (!output.length) return; await navigator.clipboard.writeText(output.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const inputBase = 'w-full px-3.5 py-2.5 text-sm font-mono bg-white/[0.03] border border-white/[0.06] rounded-xl text-cyber-text placeholder:text-cyber-text-muted/30 focus:border-cyber-red/50 focus:outline-none transition-all'

  return (
    <div className="max-w-[1000px] mx-auto space-y-5 motion-safe:animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Card Generator" icon={<Sparkles size={14} />} accent="red">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-1.5">Your BIN <span className="text-cyber-red">*</span></label>
              <input value={bin} inputMode="numeric" onChange={e => setBin(sanitizeBin(e.target.value))} placeholder="5312608540xxxxxx" className={clsx(inputBase, 'font-mono')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-1.5">Month</label>
                <select value={month} onChange={e => setMonth(e.target.value)} className={inputBase}>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-1.5">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} className={inputBase}>
                  {YEARS.map(y => <option key={y} value={y}>{y === 'Random' ? 'Random' : `20${y}`}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-1.5">CVV</label>
                <input value={cvv} inputMode="numeric" onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Random" className={inputBase} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted/60 font-mono mb-1.5">Quantity</label>
                <input value={quantity} inputMode="numeric" onChange={e => setQuantity(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="10" className={inputBase} />
              </div>
            </div>
            {error && <p className="text-xs text-cyber-red/80 font-mono">{error}</p>}
            <button onClick={generate}
              className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyber-red to-cyber-red-dark text-white hover:shadow-[0_0_25px_rgba(255,0,64,0.3)] transition-all flex items-center justify-center gap-2 font-mono">
              <Sparkles size={15} /> Generate
            </button>
          </div>
        </Section>

        <Section title={`Output (${output.length})`} icon={<Sparkles size={14} />} accent="red"
          className="flex flex-col">
          <div className="flex items-center justify-end gap-1 px-5 py-2 border-b border-white/[0.04]">
            <button onClick={copy} disabled={!output.length}
              className="p-2 rounded-lg text-cyber-text-muted/50 hover:text-cyber-text disabled:opacity-30 transition-colors">
              {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />}
            </button>
            <button onClick={() => setOutput([])} className="p-2 rounded-lg text-cyber-text-muted/50 hover:text-cyber-red transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
          <pre className="flex-1 p-4 text-[12px] font-mono text-cyber-green/80 overflow-auto max-h-[360px] whitespace-pre-wrap break-all">
            {output.length ? output.join('\n') : 'No cards generated yet...'}
          </pre>
        </Section>
      </div>
    </div>
  )
}
