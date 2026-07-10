import { clsx } from 'clsx'

interface GateShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  badge?: string
}

export function GateShell({ title, subtitle, children, className, badge }: GateShellProps) {
  return (
    <div className="relative min-h-[calc(100vh_-_4rem)] -m-3 sm:-m-6">
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060c] via-[#08080f] to-[#0a0a12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(157,0,255,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyber-purple/30 to-transparent" />
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyber-blue/20 to-transparent" />

      <div className="relative px-4 sm:px-8 lg:px-10 py-6 lg:py-10">
        <div className={clsx('w-full max-w-[1200px] mx-auto', className)}>

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-cyber-purple/20 to-transparent" />
              {badge && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple motion-safe:animate-pulse" />
                  <span className="text-[9px] text-cyber-text-muted/50 uppercase tracking-[0.15em] font-mono">{badge}</span>
                </div>
              )}
              <div className="h-px flex-1 bg-gradient-to-l from-cyber-purple/20 to-transparent" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(157,0,255,0.25)]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-cyber-text-muted/60 mt-1.5 font-mono max-w-xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
