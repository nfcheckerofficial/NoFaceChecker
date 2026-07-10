import { useState, useCallback, useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/widgets/DashboardSidebar/DashboardSidebar'
import { DashboardHeader } from '@/widgets/DashboardHeader/DashboardHeader'

function Particles() {
  const dots = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 6,
      opacity: Math.random() * 0.4 + 0.1,
      color: ['rgba(157,0,255,', 'rgba(0,212,255,', 'rgba(0,255,136,', 'rgba(255,0,64,'][Math.floor(Math.random() * 4)],
    })), [])
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {dots.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full motion-safe:animate-breathe"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background: `${d.color}${d.opacity})`,
            boxShadow: `0 0 ${d.size * 3}px ${d.color}${d.opacity * 0.5})`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

function AmbientBackground() {
  const location = useLocation()
  const isGate = location.pathname.includes('/dashboard/stripe') ||
    location.pathname.includes('/dashboard/charge') ||
    location.pathname.includes('/dashboard/paypal') ||
    location.pathname.includes('/dashboard/amazon') ||
    location.pathname.includes('/dashboard/special') ||
    location.pathname.includes('/dashboard/brute') ||
    location.pathname.includes('/dashboard/auth-gates') ||
    location.pathname.includes('/dashboard/achievers')

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060c] via-[#08080f] to-[#0a0a12]" />

      {/* Large aurora blobs */}
      <div className={clsx(
        'absolute -top-60 -right-60 w-[800px] h-[800px] rounded-full motion-safe:animate-aurora',
        isGate ? 'opacity-25' : 'opacity-20'
      )}
        style={{
          background: 'radial-gradient(circle at 30% 50%, rgba(157,0,255,0.25) 0%, rgba(0,212,255,0.08) 30%, transparent 65%)',
        }}
      />
      <div className={clsx(
        'absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full motion-safe:animate-aurora',
        isGate ? 'opacity-20' : 'opacity-15'
      )}
        style={{
          animationDelay: '-7s',
          background: 'radial-gradient(circle at 70% 50%, rgba(0,255,136,0.18) 0%, rgba(0,212,255,0.06) 30%, transparent 65%)',
        }}
      />
      <div className={clsx(
        'absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full motion-safe:animate-aurora',
        isGate ? 'opacity-15' : 'opacity-10'
      )}
        style={{
          animationDelay: '-14s',
          background: 'radial-gradient(circle at center, rgba(255,0,64,0.12) 0%, rgba(157,0,255,0.06) 25%, transparent 60%)',
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  )
}

function ContentFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyber-red/30 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  )
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const close = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen flex bg-cyber-black text-cyber-text">
      <AmbientBackground />
      <Particles />

      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
      />

      <DashboardSidebar open={sidebarOpen} onClose={close} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader onMenuClick={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-0 sm:p-1">
          <ContentFrame>
            <Outlet />
          </ContentFrame>
        </main>

        {/* Footer line */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyber-purple/20 to-transparent mx-4" />
      </div>

      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={clsx(
          'fixed bottom-4 right-4 z-50 lg:hidden',
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-cyber-red to-cyber-red-dark text-white',
          'shadow-[0_0_25px_rgba(255,0,64,0.4)] hover:shadow-[0_0_35px_rgba(255,0,64,0.6)]',
          'hover:scale-105 active:scale-95 transition-all duration-200',
          sidebarOpen && 'rotate-90 scale-90'
        )}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  )
}
