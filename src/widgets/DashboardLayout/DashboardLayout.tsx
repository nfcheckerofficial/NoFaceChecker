import { Outlet } from 'react-router-dom'
import { DashboardSidebar } from '@/widgets/DashboardSidebar/DashboardSidebar'
import { DashboardHeader } from '@/widgets/DashboardHeader/DashboardHeader'

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-cyber-black text-cyber-text">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
