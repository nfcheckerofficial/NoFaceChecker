import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { generateValidCardNumber } from '../services/luhn'
import { Ghost, X, Check, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

interface CardGeneratorProps {
  /** Controla la visibilidad del modal. */
  open?: boolean
  /** Se llama al cerrar el modal (X, overlay o Escape). */
  onClose?: () => void
  /**
   * Recibe las líneas generadas (number|MM|YYYY|CVV) para inyectarlas
   * en la cola del checker. Si se provee, se muestra "Generate & Paste".
   */
  onGenerate?: (lines: string[]) => void
  className?: string
}

interface GeneratedCard {
  number: string
  month: string
  year: string
  cvv: string
}

const randomDigit = () => Math.floor(Math.random() * 10).toString()

const MONTHS = [
  'Random', '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
]

const YEARS = [
  'Random', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35',
]

/** Amex (34/37) -> 15 dígitos, CVV 4. Resto -> 16 dígitos, CVV 3. */
function getNetworkSpec(bin: string): { length: number; cvvLength: number } {
  if (/^3[47]/.test(bin)) return { length: 15, cvvLength: 4 }
  return { length: 16, cvvLength: 3 }
}

/** Deja dígitos y la letra 'x' (placeholder de dígito random). */
function sanitizeBin(value: string): string {
  return value.toLowerCase().replace(/[^0-9x]/g, '').slice(0, 19)
}

/** Sustituye cada 'x' por un dígito aleatorio. */
function resolveBinPrefix(pattern: string): string {
  return pattern.replace(/x/g, () => randomDigit())
}

export function CardGenerator({ open = true, onClose, onGenerate, className }: CardGeneratorProps) {
  const [bin, setBin] = useState('')
  const [month, setMonth] = useState('Random')
  const [year, setYear] = useState('Random')
  const [cvv, setCvv] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const digitsOnlyBin = bin.replace(/[^0-9]/g, '')
  const binIsValid = digitsOnlyBin.length >= 6

  const resolveMonth = (): string =>
    month !== 'Random'
      ? month
      : (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')

  const resolveYear = (): string => {
    if (year !== 'Random') return year
    const base = new Date().getFullYear()
    return ((base + Math.floor(Math.random() * 8)) % 100).toString().padStart(2, '0')
  }

  const resolveCvv = (length: number): string => {
    const fixed = cvv.replace(/\D/g, '')
    if (fixed.length > 0) return fixed.slice(0, length)
    return Array.from({ length }, randomDigit).join('')
  }

  const buildLines = (): string[] => {
    const spec = getNetworkSpec(digitsOnlyBin)
    const qty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 9999)
    const cards: GeneratedCard[] = []
    for (let i = 0; i < qty; i++) {
      const prefix = resolveBinPrefix(sanitizeBin(bin))
      cards.push({
        number: generateValidCardNumber(prefix, spec.length),
        month: resolveMonth(),
        year: resolveYear(),
        cvv: resolveCvv(spec.cvvLength),
      })
    }
    return cards.map(c => `${c.number}|${c.month}|20${c.year}|${c.cvv}`)
  }

  const handleGenerate = async () => {
    setError('')
    if (!binIsValid) {
      setError('Enter a valid BIN (at least 6 digits).')
      return
    }

    const lines = buildLines()

    if (onGenerate) {
      onGenerate(lines)
    } else {
      try {
        await navigator.clipboard.writeText(lines.join('\n'))
      } catch {
        setError('Could not copy to clipboard.')
        return
      }
    }

    setDone(true)
    setTimeout(() => {
      setDone(false)
      if (onGenerate) onClose?.()
    }, 1200)
  }

  if (!open) return null

  const inputBase =
    'w-full px-4 py-3 text-sm bg-black/50 border border-cyber-purple/30 rounded-lg text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-blue focus:ring-2 focus:ring-cyber-blue/40 focus:shadow-[0_0_15px_rgba(0,212,255,0.25)] focus:outline-none transition-all'

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={clsx(
          'relative w-full max-w-[540px] rounded-2xl shadow-2xl',
          'border border-cyber-purple/40 overflow-hidden animate-scale-in',
          'shadow-[0_0_40px_rgba(157,0,255,0.25)]',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Imagen de fondo del hacker */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-cyber-purple/10 via-cyber-blue/5 to-cyber-green/5 opacity-[0.18]"
        />
        {/* Overlays de color para profundidad neón */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-panel/80 via-cyber-black/90 to-cyber-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(157,0,255,0.18),transparent_55%)]" />

        {/* Acento superior multicolor */}
        <div className="relative h-1.5 w-full bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue" />

        <div className="relative px-8 pt-7 pb-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-cyber-text-muted hover:text-cyber-red transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* Encabezado */}
          <div className="flex flex-col items-center mb-7">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-cyber-red/40 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-cyber-black/80 border-2 border-cyber-red/60 shadow-[0_0_20px_rgba(255,0,64,0.5)]">
                <Ghost size={30} className="text-cyber-red" strokeWidth={1.75} />
              </div>
            </div>
            <h2 className="text-3xl font-orbitron font-bold tracking-wider bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(157,0,255,0.4)]">
              NoFace Gen
            </h2>
            <p className="text-xs text-cyber-blue/70 mt-1.5 tracking-widest uppercase">
              Luhn-valid card generator
            </p>
          </div>

          {/* Your Bin */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-1.5">
              Your Bin <span className="text-cyber-red">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={bin}
              onChange={e => setBin(sanitizeBin(e.target.value))}
              placeholder="5312608540xxxxxx"
              className={clsx(inputBase, 'font-mono')}
            />
          </div>

          {/* Month / Year */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-purple mb-1.5">Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className={inputBase}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-purple mb-1.5">Year</label>
              <select value={year} onChange={e => setYear(e.target.value)} className={inputBase}>
                {YEARS.map(y => <option key={y} value={y}>{y === 'Random' ? 'Random' : `20${y}`}</option>)}
              </select>
            </div>
          </div>

          {/* CVV / Quantity */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-green mb-1.5">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Random"
                className={clsx(inputBase, 'font-mono')}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-green mb-1.5">Quantity</label>
              <input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={e => setQuantity(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="10"
                className={clsx(inputBase, 'font-mono')}
              />
            </div>
          </div>

          {error && <p className="text-xs text-cyber-red mb-3 text-center">{error}</p>}

          {/* Acción */}
          <button
            onClick={handleGenerate}
            className={clsx(
              'w-full py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              done
                ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green shadow-[0_0_20px_rgba(0,255,136,0.4)]'
                : 'bg-gradient-to-r from-cyber-red via-cyber-red-dark to-cyber-purple text-white hover:shadow-[0_0_25px_rgba(157,0,255,0.5)] hover:brightness-110'
            )}
          >
            {done ? (
              <>
                <Check size={16} />
                {onGenerate ? 'Pasted to queue' : 'Copied to clipboard'}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {onGenerate ? 'Generate & Paste' : 'Generate & Copy'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
