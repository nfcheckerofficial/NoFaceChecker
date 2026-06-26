import { clsx } from 'clsx'
import { CodeRain } from '@/shared/ui/CodeRain'

interface GateShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

/**
 * Contenedor estándar para cualquier "gate".
 * Incluye el fondo del hacker, overlays neón, encabezado y espaciado amplio.
 */
export function GateShell({ title, subtitle, children, className }: GateShellProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] -m-5 sm:-m-6">
      {/* Fondo del hacker (fijo dentro del área de contenido) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/noface-hero.png)' }}
      />
      {/* Oscurecido + tinte neón para legibilidad */}
      <div className="absolute inset-0 bg-cyber-black/80" />
      {/* Lluvia de código tipo hack cayendo detrás del gate */}
      <CodeRain color="#00ff88" opacity={0.4} fontSize={15} />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black/45 via-cyber-black/65 to-cyber-black/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(157,0,255,0.12),transparent_60%)] pointer-events-none" />

      {/* Contenido */}
      <div className="relative px-6 sm:px-10 lg:px-14 py-8 lg:py-12">
        <div className={clsx('w-full max-w-[1200px] mx-auto', className)}>
          {/* Encabezado del gate */}
          <div className="text-center mb-8 lg:mb-10">
            <h1 className="text-4xl lg:text-5xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(157,0,255,0.45)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-cyber-text-muted mt-2.5 tracking-wide">
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
