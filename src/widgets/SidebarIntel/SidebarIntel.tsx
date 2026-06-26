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
        'bg-cyber-panel/90 backdrop-blur-sm',
        'border border-cyber-border rounded-sm',
        'overflow-hidden',
        className
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3 border-b border-cyber-border bg-cyber-dark/50 hover:bg-cyber-dark/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GlitchText intensity="low" className="text-xs text-cyber-red font-bold tracking-wider">
          OPERATIONAL INTEL
        </GlitchText>
        <span className="text-cyber-text-muted text-xs font-mono">
          {isExpanded ? '[-]' : '[+]'}
        </span>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="text-[10px] text-cyber-text-muted/60 mb-3 uppercase tracking-wider">
            NEWSFEED
          </div>
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="group">
                <div className="flex items-start gap-2">
                  <span className="text-cyber-red mt-0.5 text-xs">*</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cyber-text group-hover:text-cyber-red transition-colors leading-relaxed">
                      {item.text}
                    </p>
                    <span className="text-[10px] text-cyber-text-muted/50 mt-0.5 block">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
