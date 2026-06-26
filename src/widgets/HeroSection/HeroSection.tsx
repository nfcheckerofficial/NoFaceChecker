import { GlitchText } from '@/shared/ui/GlitchText'
import { NeonGlow } from '@/shared/ui/NeonGlow'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={clsx(
        'relative min-h-[80vh] flex flex-col items-center justify-center',
        'px-4 py-16',
        className
      )}
    >
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <NeonGlow color="red" pulse>
            <GlitchText
              intensity="high"
              className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-black tracking-wider"
            >
              [CHK] NO FACE CLAN
            </GlitchText>
          </NeonGlow>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
          <div className="text-xs md:text-sm text-cyber-text-muted uppercase tracking-widest">
            DECENTRALIZED ENCRYPTION
          </div>
          <div className="hidden md:block w-px h-4 bg-cyber-border" />
          <div className="text-xs md:text-sm text-cyber-text-muted uppercase tracking-widest">
            GLOBAL OPERATIONS EST. 2024
          </div>
        </div>

        <div className="relative w-full max-w-2xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-sm border border-cyber-border">
            <img
              src="/hooded-figure.webp"
              alt="Operative"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover opacity-80"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/checker">
            <Button size="lg" glow>
              INITIATE CHECK
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </Link>
          <Button variant="secondary" size="lg">
            ACCESS PROTOCOL
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-red">1,247</div>
            <div className="text-[10px] text-cyber-text-muted uppercase">Nodes Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-green">99.7%</div>
            <div className="text-[10px] text-cyber-text-muted uppercase">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-blue">256-bit</div>
            <div className="text-[10px] text-cyber-text-muted uppercase">Encryption</div>
          </div>
        </div>
      </div>
    </section>
  )
}
