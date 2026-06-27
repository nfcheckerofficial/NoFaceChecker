import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/widgets/DashboardSidebar/DashboardSidebar'
import { DashboardHeader } from '@/widgets/DashboardHeader/DashboardHeader'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const close = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen flex bg-cyber-black text-cyber-text">
      {/* Overlay for mobile with fade transition */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
      />

      <DashboardSidebar open={sidebarOpen} onClose={close} />

      <div className="flex-1 flex flex-col min-w-0">
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
