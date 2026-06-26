import { Link } from 'react-router-dom'
import { Header } from '@/widgets/Header/Header'
import { Footer } from '@/widgets/Footer/Footer'
import { BulkChecker } from '@/features/checker/components/BulkChecker'
import { GlitchText } from '@/shared/ui/GlitchText'
import { CreditCard } from 'lucide-react'

export function BulkCheckerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10 space-y-3">
            <GlitchText intensity="low">
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-cyber-red tracking-wider">
                BULK CARD VALIDATOR
              </h1>
            </GlitchText>
            <p className="text-xs text-cyber-text-muted tracking-wide max-w-xl mx-auto">
              Validate thousands of cards at once. Each line is checked with the Luhn
              algorithm, brand detection, length, expiry and CVV format.
            </p>
            <Link
              to="/checker"
              className="inline-flex items-center gap-2 text-[11px] font-mono text-cyber-blue/80 hover:text-cyber-blue transition-colors"
            >
              <CreditCard size={12} />
              Switch to single verification
            </Link>
          </div>

          <BulkChecker />
        </div>
      </main>

      <Footer />
    </div>
  )
}
