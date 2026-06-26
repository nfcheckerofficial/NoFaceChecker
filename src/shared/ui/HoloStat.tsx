import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface HoloStatProps {
  label: string
  value: string
  sublabel?: string
  accent?: string
  className?: string
}

export function HoloStat({ label, value, sublabel, accent = '#22c55e', className }: HoloStatProps) {
  const [glitch, setGlitch] = useState(false)
  const [scan, setScan] = useState(0)

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 80)
    }, 3000 + Math.random() * 4000)
    const scanInterval = setInterval(() => setScan(p => (p + 1) % 100), 50)
    return () => { clearInterval(glitchInterval); clearInterval(scanInterval) }
  }, [])

  return (
    <div className={clsx('relative rounded-lg border overflow-hidden', className)}
      style={{
        borderColor: `${accent}33`,
        background: `linear-gradient(135deg, ${accent}08, transparent)`,
      }}
    >
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[1px] opacity-30 transition-all duration-[30ms]"
          style={{ background: accent, transform: `translateY(${scan}%)`, boxShadow: `0 0 6px ${accent}` }} />
      </div>

      {/* Glitch overlay */}
      {glitch && (
        <div className="absolute inset-0 pointer-events-none bg-black/40 z-10"
          style={{ clipPath: `inset(${Math.random() * 40}% 0 ${Math.random() * 40}% 0)` }} />
      )}

      <div className="relative z-0 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: accent }}>
          {label}
        </p>
        <p className="text-lg font-bold font-mono tracking-wider" style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>
          {value}
        </p>
        {sublabel && <p className="text-[10px] text-cyber-text-muted mt-0.5">{sublabel}</p>}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: accent }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: accent }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: accent }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: accent }} />
    </div>
  )
}
