import { Card } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { GlitchText } from '@/shared/ui/GlitchText'
import { NeonGlow } from '@/shared/ui/NeonGlow'
import { useCheckerStore } from '../store/checkerStore'
import {
  CheckCircle,
  XCircle,
  MapPin,
  Building2,
  CreditCard,
  Clock,
  Check,
  X,
  Hash,
  Wallet,
} from 'lucide-react'
import { clsx } from 'clsx'

interface CheckerResultsProps {
  className?: string
}

export function CheckerResults({ className }: CheckerResultsProps) {
  const { currentResult } = useCheckerStore()

  if (!currentResult) return null

  const isLive = currentResult.status === 'live'

  return (
    <Card
      className={clsx(
        'bg-cyber-panel/90 backdrop-blur-sm',
        'animate-scale-in',
        {
          'border-cyber-green/50 shadow-[0_0_30px_rgba(0,255,136,0.3)]': isLive,
          'border-cyber-red/50 shadow-[0_0_30px_rgba(255,0,64,0.3)]': !isLive,
        },
        className
      )}
    >
      <div
        className={clsx('p-4 border-b', {
          'border-cyber-green/30 bg-cyber-green/5': isLive,
          'border-cyber-red/30 bg-cyber-red/5': !isLive,
        })}
      >
        <div className="flex items-center justify-between">
          <GlitchText intensity="low" className="text-sm font-bold tracking-wider">
            CHECK RESULT
          </GlitchText>
          <Badge variant={isLive ? 'live' : 'dead'}>{isLive ? 'LIVE' : 'DEAD'}</Badge>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="text-center py-3">
          <NeonGlow color={isLive ? 'green' : 'red'} pulse>
            {isLive ? <CheckCircle size={56} /> : <XCircle size={56} />}
          </NeonGlow>
          <div
            className={clsx(
              'mt-3 text-lg font-bold',
              isLive ? 'text-cyber-green' : 'text-cyber-red'
            )}
          >
            {isLive ? 'CARD IS LIVE' : 'CARD IS DEAD'}
          </div>
          <div className="text-xs text-cyber-text-muted mt-1.5 px-4">
            {currentResult.message}
          </div>
        </div>

        {/* Desglose de validaciones reales */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-cyber-text-muted/60 uppercase tracking-wider mb-2">
            Validation Breakdown
          </div>
          {currentResult.checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center justify-between py-1.5 px-2 rounded-sm bg-cyber-dark/40"
            >
              <div className="flex items-center gap-2">
                {check.passed ? (
                  <Check size={13} className="text-cyber-green shrink-0" />
                ) : (
                  <X size={13} className="text-cyber-red shrink-0" />
                )}
                <span className="text-[11px] text-cyber-text">{check.label}</span>
              </div>
              <span
                className={clsx(
                  'text-[10px] font-mono',
                  check.passed ? 'text-cyber-green/70' : 'text-cyber-red/70'
                )}
              >
                {check.detail}
              </span>
            </div>
          ))}
        </div>

        {/* Datos reales del BIN */}
        <div className="space-y-3 pt-1">
          <div className="text-[10px] text-cyber-text-muted/60 uppercase tracking-wider flex items-center gap-2">
            BIN Intel
            {currentResult.binSource === 'fallback' && (
              <span className="text-[9px] text-cyber-red/60 normal-case">(offline estimate)</span>
            )}
          </div>

          <ResultRow icon={<CreditCard size={14} />} label="CARD NUMBER">
            <span className="font-mono">{currentResult.cardNumber}</span>
          </ResultRow>

          <ResultRow icon={<Hash size={14} />} label="BIN / BRAND">
            <span>
              {currentResult.bin} · {currentResult.brand}
            </span>
          </ResultRow>

          <ResultRow icon={<Wallet size={14} />} label="TYPE">
            <span className="uppercase">{currentResult.cardCategory}</span>
          </ResultRow>

          <ResultRow icon={<Building2 size={14} />} label="ISSUER">
            <span className="text-right max-w-[55%] truncate">{currentResult.bank}</span>
          </ResultRow>

          <ResultRow icon={<MapPin size={14} />} label="COUNTRY">
            <span>
              {currentResult.countryEmoji} {currentResult.country}
            </span>
          </ResultRow>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
              <Clock size={14} />
              <span>TIMESTAMP</span>
            </div>
            <span className="text-xs text-cyber-text-muted">
              {currentResult.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ResultRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cyber-border">
      <div className="flex items-center gap-2 text-xs text-cyber-text-muted shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-xs text-cyber-text">{children}</span>
    </div>
  )
}
