import { useState, useEffect } from 'react'
import { GlitchText } from '@/shared/ui/GlitchText'
import { clsx } from 'clsx'

interface NewsItem {
  id: number
  text: string
  time: string
}

interface SidebarIntelProps {
  className?: string
}

export function SidebarIntel({ className }: SidebarIntelProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  const newsItems: NewsItem[] = [
    { id: 1, text: 'New Server Nodes Online (Global Mesh)', time: '2 min ago' },
    { id: 2, text: 'Encryption Standard Update: V12.1 deployed', time: '15 min ago' },
    { id: 3, text: 'Alert: New Threat Intelligence received', time: '1 hour ago' },
    { id: 4, text: 'Node [Tokyo-7] connected successfully', time: '2 hours ago' },
    { id: 5, text: 'Protocol handshake completed', time: '3 hours ago' },
  ]

  useEffect(() => {
    setNews(newsItems)
  }, [])

  return (
    <div
      className={clsx(
        'glass rounded-xl overflow-hidden',
        className
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-red motion-safe:animate-pulse" />
          <GlitchText intensity="low" className="text-[11px] text-cyber-red font-bold tracking-wider">
            OPERATIONAL INTEL
          </GlitchText>
        </div>
        <span className="text-cyber-text-muted text-xs font-mono">
          {isExpanded ? '[-]' : '[+]'}
        </span>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="text-[9px] text-cyber-text-muted/50 mb-3 uppercase tracking-widest">
            LIVE NEWSFEED
          </div>
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="group relative pl-3 border-l border-white/5 hover:border-cyber-red/40 transition-colors">
                <span className="absolute left-[-2.5px] top-1.5 w-1 h-1 rounded-full bg-cyber-red/30 group-hover:bg-cyber-red transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-cyber-text/70 group-hover:text-cyber-text transition-colors leading-relaxed">
                    {item.text}
                  </p>
                  <span className="text-[9px] text-cyber-text-muted/40 mt-1 block">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
