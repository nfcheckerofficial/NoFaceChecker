import { useState } from 'react'
import { Database, RefreshCw, Copy, Check, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { generateIdentity, type RandomIdentity } from '@/features/checker/services/randomData'
import { Section, Card, Grid, Row } from '@/shared/ui/Section'

export function RandomDataPage() {
  const [identity, setIdentity] = useState<RandomIdentity>(() => generateIdentity())
  const [copied, setCopied] = useState<string | null>(null)

  const regen = () => {
    setIdentity(generateIdentity())
    setCopied(null)
  }

  const copyField = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const copyAll = async () => {
    const text = Object.entries(identity).map(([k, v]) => `${k}: ${v}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied('all')
    setTimeout(() => setCopied(null), 1500)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(identity, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'identity.json'; a.click()
    URL.revokeObjectURL(blob as any)
  }

  const fields: [string, keyof RandomIdentity, string][] = [
    ['User', 'fullName', 'text-cyber-text'],
    ['Gender', 'gender', 'text-cyber-text-muted'],
    ['Email', 'email', 'text-cyber-blue'],
    ['Phone', 'phone', 'text-cyber-green'],
    ['Street', 'street', 'text-cyber-text'],
    ['City / State', 'city', 'text-cyber-text'],
    ['ZIP', 'zip', 'text-cyber-yellow'],
    ['Country', 'country', 'text-cyber-text'],
    ['Birth Date', 'birthDate', 'text-cyber-text-muted'],
    ['SSN-like', 'ssnLike', 'text-cyber-red'],
  ]

  const cityState = `${identity.city}, ${identity.state}`

  return (
    <div className="max-w-[800px] mx-auto space-y-5">
      <Section title="Random Data" icon={<Database size={14} />} accent="green">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] transition-colors font-mono">
            {copied === 'all' ? <Check size={12} className="text-cyber-green" /> : <Copy size={12} />}
            {copied === 'all' ? 'Copied' : 'Copy All'}
          </button>
          <button onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] transition-colors font-mono">
            <Download size={12} /> JSON
          </button>
          <button onClick={regen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyber-green/20 bg-cyber-green/[0.04] text-xs text-cyber-green/70 hover:bg-cyber-green/[0.08] hover:text-cyber-green transition-colors font-mono ml-auto">
            <RefreshCw size={12} /> Generate
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(([label, key, valueClass]) => {
            const val = key === 'city' ? cityState : identity[key]
            return (
              <div key={key}
                className="group flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3 hover:bg-white/[0.03] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-cyber-text-muted/50 font-mono">{label}</p>
                  <p className={clsx('text-sm truncate font-mono mt-0.5', valueClass)}>{val || '—'}</p>
                </div>
                <button onClick={() => copyField(key, val)}
                  className="p-1.5 rounded-lg text-cyber-text-muted/20 hover:text-cyber-text hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100 shrink-0">
                  {copied === key ? <Check size={12} className="text-cyber-green" /> : <Copy size={12} />}
                </button>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
