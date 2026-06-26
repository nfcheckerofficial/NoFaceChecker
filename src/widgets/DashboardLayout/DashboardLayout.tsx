import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/widgets/DashboardSidebar/DashboardSidebar'
import { DashboardHeader } from '@/widgets/DashboardHeader/DashboardHeader'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const close = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="min-h-screen flex bg-cyber-black text-cyber-text">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      <DashboardSidebar open={sidebarOpen} onClose={close} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={clsx(
          'fixed bottom-4 right-4 z-50 lg:hidden',
          'w-12 h-12 rounded-full flex items-center justify-center',
          'bg-cyber-red text-white shadow-lg shadow-cyber-red/30',
          'hover:bg-cyber-red/90 transition-colors'
        )}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  )
}
