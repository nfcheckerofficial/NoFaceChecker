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
        'relative min-h-[85vh] flex flex-col items-center justify-center',
        'px-4 py-20',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-dark to-cyber-black z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-red/10 via-transparent to-transparent z-0" />
      
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className="mb-10">
          <NeonGlow color="red" pulse>
            <GlitchText
              intensity="high"
              className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-black tracking-wider"
            >
              [CHK] NO FACE CLAN
            </GlitchText>
          </NeonGlow>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-12">
          <div className="text-sm md:text-base text-cyber-text-muted/80 uppercase tracking-wider font-light">
            DECENTRALIZED ENCRYPTION
          </div>
          <div className="hidden md:block w-px h-5 bg-cyber-red/30" />
          <div className="text-sm md:text-base text-cyber-text-muted/80 uppercase tracking-wider font-light">
            GLOBAL OPERATIONS EST. 2024
          </div>
        </div>

        <div className="relative w-full max-w-3xl mx-auto mb-16 group">
          <div className="relative overflow-hidden rounded-sm border border-cyber-red/30 shadow-[0_0_30px_rgba(255,0,64,0.2)]">
            <img
              src="/hooded-figure.webp"
              alt="Operative"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover opacity-90 transform transition-transform duration-700 group-hover:scale-[1.02]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-red/20 via-transparent to-cyber-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="absolute -inset-1 bg-cyber-red/20 rounded-sm blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/checker" className="group/button relative">
            <Button size="lg" glow className="relative overflow-hidden">
              <span className="relative z-10 flex items-center">
                INITIATE CHECK
                <ArrowRight className="ml-2 group-hover/button:translate-x-1 transition-transform" size={16} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-red/50 via-transparent to-cyber-red/50 -translate-x-full group-hover/button:translate-x-0 transition-transform duration-700" />
            </Button>
          </Link>
          <Link to="/" className="group">
            <Button variant="secondary" size="lg" className="relative overflow-hidden">
              <span className="relative z-10">ACCESS PROTOCOL</span>
              <div className="absolute inset-0 bg-cyber-blue/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div className="text-center group/stat">
            <div className="text-3xl font-bold text-cyber-red mb-2 group-hover/stat:scale-110 transition-transform duration-300">1,247</div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider">Nodes Active</div>
            <div className="w-8 h-0.5 bg-cyber-red/30 mx-auto mt-2 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="text-center group/stat">
            <div className="text-3xl font-bold text-cyber-green mb-2 group-hover/stat:scale-110 transition-transform duration-300">99.7%</div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider">Uptime</div>
            <div className="w-8 h-0.5 bg-cyber-green/30 mx-auto mt-2 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="text-center group/stat">
            <div className="text-3xl font-bold text-cyber-blue mb-2 group-hover/stat:scale-110 transition-transform duration-300">256-bit</div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider">Encryption</div>
            <div className="w-8 h-0.5 bg-cyber-blue/30 mx-auto mt-2 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </div>
    </section>
  )
}
