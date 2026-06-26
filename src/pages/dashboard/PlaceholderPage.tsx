import { Construction } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <GateShell title={title} subtitle={description}>
      <div className="rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-6 py-20 flex flex-col items-center justify-center text-center">
        <span className="w-16 h-16 rounded-full bg-cyber-dark border border-cyber-border flex items-center justify-center mb-4">
          <Construction size={28} className="text-cyber-yellow" />
        </span>
        <h2 className="text-base font-semibold text-cyber-text mb-1">Coming soon</h2>
        <p className="text-sm text-cyber-text-muted max-w-sm">
          The <span className="text-cyber-text">{title}</span> module is under construction.
          The interface is wired up and ready for its logic.
        </p>
      </div>
    </GateShell>
  )
}
