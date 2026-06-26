import { useState } from 'react'
import { Header } from '@/widgets/Header/Header'
import { Footer } from '@/widgets/Footer/Footer'
import { CardGenerator } from '@/features/checker/components/CardGenerator'
import { GlitchText } from '@/shared/ui/GlitchText'
import { Button } from '@/shared/ui/Button'

export function GeneratorPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-2" />

            <div className="lg:col-span-8 flex flex-col items-center">

              <div className="text-center mb-10">
                <GlitchText intensity="low">
                  <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-cyber-blue mb-3 tracking-wider">
                    CARD GENERATOR
                  </h1>
                </GlitchText>
                <p className="text-xs text-cyber-text-muted tracking-wide">
                  Generate valid test card numbers for development and testing
                </p>
              </div>

              <Button size="lg" glow onClick={() => setOpen(true)}>
                NoFace Gen
              </Button>

            </div>

            <div className="lg:col-span-2" />
          </div>
        </div>
      </main>

      <Footer />

      <CardGenerator open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
