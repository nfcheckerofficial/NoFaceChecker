import { Header } from '@/widgets/Header/Header'
import { Footer } from '@/widgets/Footer/Footer'
import { GateDashboard } from '@/features/checker/components/GateDashboard'

export function CheckerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <GateDashboard />
        </div>
      </main>

      <Footer />
    </div>
  )
}
