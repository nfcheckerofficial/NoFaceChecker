import { Link } from 'react-router-dom'
import { Logo } from '@/shared/ui/Logo'
import { MessageSquare, BookOpen, Folder } from 'lucide-react'
import { clsx } from 'clsx'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const footerLinks = [
    { label: 'COMMUNICATIONS', sublabel: 'secure messaging', icon: MessageSquare },
    { label: 'DOCUMENTATION', sublabel: 'wiki', icon: BookOpen },
    { label: 'RESOURCES', sublabel: 'code repos', icon: Folder },
  ]

  return (
    <footer
      className={clsx(
        'bg-cyber-black/95 backdrop-blur-md',
        'border-t border-cyber-border/50',
        'py-8 px-4 lg:px-8',
        'mt-auto',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="text-[10px] text-cyber-text-muted/50 font-mono">
              © 2024 [CHK] CLAN GLOBAL OPS
            </div>
          </div>

          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to="/"
                className="flex items-center gap-2 group"
              >
                <link.icon
                  size={14}
                  className="text-cyber-text-muted/40 group-hover:text-cyber-red transition-colors"
                />
                <div className="text-left">
                  <div className="text-[11px] text-cyber-text/70 group-hover:text-cyber-red transition-colors font-mono tracking-wider">
                    {link.label}
                  </div>
                  <div className="text-[9px] text-cyber-text-muted/40">
                    ({link.sublabel})
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-cyber-border/30 text-center">
          <p className="text-[10px] text-cyber-text-muted/40 max-w-2xl mx-auto font-mono tracking-wide">
            FOR AUTHORIZED OPERATIVES ONLY. ACCESS CONSTITUTES ACCEPTANCE OF EULA. ALL DATA IS ENCRYPTED.
          </p>
        </div>
      </div>
    </footer>
  )
}
