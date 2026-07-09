import { GlitchText } from '@/shared/ui/GlitchText'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react'
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
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        {/* Decorative ring */}
        <div className="relative inline-flex mb-12">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-cyber-red/20 motion-safe:animate-pulse-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-cyber-blue/10 motion-safe:animate-pulse-ring" style={{ animationDelay: '-1.5s' }} />
          </div>
          <div className="relative text-4xl md:text-6xl lg:text-7xl font-orbitron font-black tracking-wider leading-tight">
            <span className="text-gradient-red">[CHK]</span>
            <br />
            <span className="text-cyber-text">NO FACE CLAN</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="px-3 py-1 rounded-full bg-cyber-red/10 border border-cyber-red/30 text-[10px] text-cyber-red uppercase tracking-widest font-semibold">
            Decentralized
          </span>
          <span className="px-3 py-1 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-[10px] text-cyber-blue uppercase tracking-widest font-semibold">
            Encrypted
          </span>
          <span className="px-3 py-1 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-[10px] text-cyber-green uppercase tracking-widest font-semibold">
            Global Ops
          </span>
        </div>

        {/* Image with frame */}
        <div className="relative w-full max-w-2xl mx-auto mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue rounded-sm blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="relative overflow-hidden rounded-sm bg-cyber-dark">
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-red/20 via-transparent to-cyber-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img
              src="/hooded-figure.webp"
              alt="Operative"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover opacity-85 transform transition-all duration-700 group-hover:scale-[1.03]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link to="/checker">
            <Button size="lg" glow className="group relative overflow-hidden px-10">
              <span className="relative z-10 flex items-center gap-2">
                INITIATE CHECK
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" size="lg" className="group relative overflow-hidden">
              <span className="relative z-10">ACCESS PROTOCOL</span>
              <div className="absolute inset-0 bg-cyber-blue/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
            </Button>
          </Link>
        </div>

        {/* Stats row - redesigned */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div className="glass rounded-xl p-4 group hover:border-cyber-red/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe size={14} className="text-cyber-red" />
              <div className="text-xl md:text-2xl font-bold text-gradient-red">1,247</div>
            </div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider text-center">Nodes Active</div>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-red/30 to-transparent mt-2" />
          </div>
          <div className="glass rounded-xl p-4 group hover:border-cyber-green/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield size={14} className="text-cyber-green" />
              <div className="text-xl md:text-2xl font-bold text-gradient-green">99.7%</div>
            </div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider text-center">Uptime</div>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-green/30 to-transparent mt-2" />
          </div>
          <div className="glass rounded-xl p-4 group hover:border-cyber-blue/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={14} className="text-cyber-blue" />
              <div className="text-xl md:text-2xl font-bold text-gradient-blue">256-bit</div>
            </div>
            <div className="text-[9px] text-cyber-text-muted/60 uppercase tracking-wider text-center">Encryption</div>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/30 to-transparent mt-2" />
          </div>
        </div>
      </div>
    </section>
  )
}
