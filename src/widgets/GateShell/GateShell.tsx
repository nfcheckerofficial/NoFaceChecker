import { clsx } from 'clsx'
import { CodeRain } from '@/shared/ui/CodeRain'

interface GateShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function GateShell({ title, subtitle, children, className }: GateShellProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] -m-3 sm:-m-6">
      {/* Background layers */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyber-green/5 via-cyber-blue/5 to-cyber-purple/10"
      />
      <div className="absolute inset-0 bg-cyber-black/85" />
      <CodeRain color="#00ff88" opacity={0.35} fontSize={14} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black/30 via-cyber-black/60 to-cyber-black/95 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(157,0,255,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,255,136,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,212,255,0.06),transparent_50%)] pointer-events-none" />

      {/* Animated accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-red/50 to-transparent motion-safe:animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-purple/50 to-transparent motion-safe:animate-pulse" />

      {/* Content */}
      <div className="relative px-4 sm:px-10 lg:px-14 py-6 lg:py-12">
        <div className={clsx('w-full max-w-[1200px] mx-auto', className)}>
          {/* Gate header */}
          <div className="text-center mb-6 lg:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-red/10 border border-cyber-red/20 text-[10px] text-cyber-red/80 uppercase tracking-widest mb-3 sm:mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-red motion-safe:animate-pulse" />
              GATE ACTIVE
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(157,0,255,0.45)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-cyber-text-muted/80 mt-2 tracking-wide">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
