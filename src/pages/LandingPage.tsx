import { MatrixRain } from '@/shared/ui/MatrixRain'
import { Header } from '@/widgets/Header/Header'
import { SidebarIntel } from '@/widgets/SidebarIntel/SidebarIntel'
import { SidebarProtocol } from '@/widgets/SidebarProtocol/SidebarProtocol'
import { HeroSection } from '@/widgets/HeroSection/HeroSection'
import { Footer } from '@/widgets/Footer/Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated orbs background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyber-red/30 via-cyber-purple/20 to-transparent blur-[120px] motion-safe:animate-orb" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-cyber-blue/25 via-cyber-green/15 to-transparent blur-[100px] motion-safe:animate-orb" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-l from-cyber-purple/20 via-cyber-red/10 to-transparent blur-[80px] motion-safe:animate-orb" style={{ animationDelay: '-8s' }} />
      </div>

      <MatrixRain opacity={0.06} />
      <Header />

      <main className="flex-1 pt-20 pb-12 relative z-10">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            <aside className="hidden lg:block lg:col-span-3 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="motion-safe:animate-fade-in">
                  <SidebarIntel />
                </div>
                <div className="motion-safe:animate-fade-in motion-safe:animate-delay-150">
                  <SidebarProtocol />
                </div>
              </div>
            </aside>

            <div className="lg:col-span-6">
              <HeroSection />
            </div>

            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] text-cyber-text-muted/60 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-cyber-green motion-safe:animate-pulse" />
                    System Status
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyber-text-muted">Network</span>
                      <span className="text-cyber-green">Operational</span>
                    </div>
                    <div className="w-full h-1 bg-cyber-panel rounded-full overflow-hidden">
                      <div className="h-full w-[87%] bg-gradient-to-r from-cyber-green to-cyber-blue rounded-full motion-safe:animate-shimmer" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyber-text-muted">Latency</span>
                      <span className="text-cyber-blue">24ms</span>
                    </div>
                    <div className="w-full h-1 bg-cyber-panel rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full" style={{ animation: 'none' }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[10px] text-cyber-text-muted/40 text-center">
                      Encrypted Channel • AES-256
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
