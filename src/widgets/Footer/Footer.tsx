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
        'relative bg-cyber-black/98 backdrop-blur-md',
        'border-t border-cyber-red/20',
        'py-10 px-4 lg:px-8',
        'mt-auto',
        'shadow-[0_0_30px_rgba(255,0,64,0.1)]',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <Link to="/" className="group/logo">
              <Logo size="sm" />
              <div className="absolute -inset-3 rounded-lg opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300 bg-cyber-red/10 blur-xl" />
            </Link>
            <div className="text-[11px] text-cyber-text-muted/50 font-mono">
              © 2024 [CHK] CLAN GLOBAL OPS
            </div>
          </div>

          <div className="flex items-center gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to="/"
                className="flex items-center gap-2 group relative"
              >
                <link.icon
                  size={16}
                  className="text-cyber-text-muted/40 group-hover:text-cyber-red transition-all duration-300"
                />
                <div className="text-left">
                  <div className="text-[12px] text-cyber-text/70 group-hover:text-cyber-red transition-colors font-mono tracking-wider">
                    {link.label}
                  </div>
                  <div className="text-[10px] text-cyber-text-muted/40">
                    ({link.sublabel})
                  </div>
                </div>
                <div className="absolute -inset-2 rounded-lg bg-cyber-red/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cyber-red/20 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-red/5 to-transparent" />
          <p className="text-[10px] text-cyber-text-muted/40 max-w-2xl mx-auto font-mono tracking-wider relative z-10">
            FOR AUTHORIZED OPERATIVES ONLY. ACCESS CONSTITUTES ACCEPTANCE OF EULA. ALL DATA IS ENCRYPTED.
          </p>
        </div>
      </div>
    </footer>
  )
}
