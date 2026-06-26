import { MatrixRain } from '@/shared/ui/MatrixRain'
import { Header } from '@/widgets/Header/Header'
import { SidebarIntel } from '@/widgets/SidebarIntel/SidebarIntel'
import { SidebarProtocol } from '@/widgets/SidebarProtocol/SidebarProtocol'
import { HeroSection } from '@/widgets/HeroSection/HeroSection'
import { Footer } from '@/widgets/Footer/Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MatrixRain opacity={0.08} />
      <Header />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <SidebarIntel />
              </div>
            </aside>

            <div className="lg:col-span-6">
              <HeroSection />
            </div>

            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <SidebarProtocol />
              </div>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
