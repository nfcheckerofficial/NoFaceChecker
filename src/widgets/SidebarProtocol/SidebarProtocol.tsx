import { Badge } from '@/shared/ui/Badge'
import { GlitchText } from '@/shared/ui/GlitchText'
import { clsx } from 'clsx'

interface SidebarProtocolProps {
  className?: string
}

export function SidebarProtocol({ className }: SidebarProtocolProps) {
  const protocolDetails = [
    { label: 'PROTOCOL', value: 'NO-FACE PROTOCOL v1.0' },
    { label: 'OBJECTIVE', value: 'Establish Decentralized Node Network' },
    { label: 'TARGET DATE', value: '2024-10-26 (The Crypt)' },
    { label: 'STATUS', value: 'In Deployment' },
  ]

  return (
    <div
      className={clsx(
        'bg-cyber-panel/90 backdrop-blur-sm',
        'border border-cyber-border rounded-sm',
        'overflow-hidden',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-cyber-border bg-cyber-dark/50">
        <GlitchText intensity="low" className="text-xs text-cyber-red font-bold tracking-wider">
          PROTOCOL DETAILS
        </GlitchText>
      </div>

      <div className="p-4 space-y-4">
        {protocolDetails.map((detail, index) => (
          <div key={index} className="flex flex-col gap-1">
            <span className="text-[10px] text-cyber-text-muted/60 uppercase tracking-wider">
              {detail.label}
            </span>
            <span className="text-xs text-cyber-text/90 leading-relaxed">
              {detail.value}
            </span>
          </div>
        ))}

        <div className="pt-3 border-t border-cyber-border/50">
          <Badge variant="live">ACTIVE</Badge>
        </div>
      </div>
    </div>
  )
}
