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
        'glass rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue motion-safe:animate-pulse" />
        <GlitchText intensity="low" className="text-[11px] text-cyber-blue font-bold tracking-wider">
          PROTOCOL DETAILS
        </GlitchText>
      </div>

      <div className="p-4 space-y-4">
        {protocolDetails.map((detail, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <span className="text-[9px] text-cyber-text-muted/50 uppercase tracking-widest">
              {detail.label}
            </span>
            <span className="text-[11px] text-cyber-text/80 leading-relaxed">
              {detail.value}
            </span>
            {index < protocolDetails.length - 1 && (
              <div className="w-full h-[1px] bg-gradient-to-r from-white/5 to-transparent mt-1.5" />
            )}
          </div>
        ))}

        <div className="pt-2">
          <div className="flex items-center gap-2">
            <Badge variant="live">ACTIVE</Badge>
            <span className="text-[9px] text-cyber-text-muted/40">Node connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
