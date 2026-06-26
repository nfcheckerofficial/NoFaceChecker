import { detectCardType } from '../services/cardDetector'
import { clsx } from 'clsx'

interface CardPreviewProps {
  cardNumber: string
  className?: string
}

export function CardPreview({ cardNumber, className }: CardPreviewProps) {
  const cardInfo = detectCardType(cardNumber)
  const cleanedNumber = cardNumber.replace(/\D/g, '')

  const displayNumber = cleanedNumber.length > 0
    ? cleanedNumber.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••'

  return (
    <div
      className={clsx(
        'relative w-full mx-auto',
        'aspect-[1.586/1]',
        'rounded-xl overflow-hidden',
        'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
        'border border-cyber-border/50',
        'shadow-2xl shadow-cyber-red/10',
        'p-6 sm:p-8',
        className
      )}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyber-red/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyber-blue/5 to-transparent rounded-tr-full" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-[10px] sm:text-xs text-cyber-text-muted uppercase tracking-wider font-mono">
            {cardInfo.type !== 'unknown' ? cardInfo.brand : 'CARD'}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyber-yellow/80 shadow-lg" />
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyber-yellow/50 -ml-3 sm:-ml-4" />
          </div>
        </div>

        <div className="font-mono text-base sm:text-xl md:text-2xl tracking-[0.15em] text-cyber-text/90">
          {displayNumber}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] text-cyber-text-muted/60 uppercase mb-1 tracking-wider">
              Card Holder
            </div>
            <div className="text-[11px] sm:text-xs text-cyber-text/80 font-mono tracking-wider">
              OPERATIVE-2401
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] sm:text-[10px] text-cyber-text-muted/60 uppercase mb-1 tracking-wider">
              Expires
            </div>
            <div className="text-[11px] sm:text-xs text-cyber-text/80 font-mono">
              XX/XX
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue" />
    </div>
  )
}
