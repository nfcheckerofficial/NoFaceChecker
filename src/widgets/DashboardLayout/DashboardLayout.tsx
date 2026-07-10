import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/widgets/DashboardSidebar/DashboardSidebar'
import { DashboardHeader } from '@/widgets/DashboardHeader/DashboardHeader'

function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Large gradient orb - top right */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 motion-safe:animate-aurora"
        style={{
          background: 'radial-gradient(circle at center, rgba(157,0,255,0.3) 0%, rgba(0,212,255,0.1) 30%, transparent 70%)',
        }}
      />
      {/* Medium gradient orb - bottom left */}
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-15 motion-safe:animate-aurora"
        style={{
          animationDelay: '-6s',
          background: 'radial-gradient(circle at center, rgba(0,255,136,0.2) 0%, rgba(0,212,255,0.08) 30%, transparent 70%)',
        }}
      />
      {/* Small gradient orb - center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 motion-safe:animate-aurora"
        style={{
          animationDelay: '-12s',
          background: 'radial-gradient(circle at center, rgba(255,0,64,0.15) 0%, rgba(157,0,255,0.08) 30%, transparent 70%)',
        }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
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
      {/* Ambient background orbs */}
      <AmbientOrbs />

      {/* Overlay for mobile with fade transition */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
      />

      <DashboardSidebar open={sidebarOpen} onClose={close} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader onMenuClick={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-2 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu button - fixed in viewport */}
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
