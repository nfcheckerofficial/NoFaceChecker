import { useState } from 'react'
import { Database, RefreshCw, Copy, Check, Mail, Phone, MapPin, User, Calendar, Hash } from 'lucide-react'
import { generateIdentity, type RandomIdentity } from '@/features/checker/services/randomData'

export function RandomDataPage() {
  const [identity, setIdentity] = useState<RandomIdentity>(() => generateIdentity())
  const [copied, setCopied] = useState(false)

  const regen = () => {
    setIdentity(generateIdentity())
    setCopied(false)
  }

  const copy = async () => {
    const text = Object.entries(identity)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-green/15 border border-cyber-green/40 flex items-center justify-center">
          <Database size={20} className="text-cyber-green" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">Random Data</h1>
          <p className="text-xs text-cyber-text-muted">Fictional identity generator for testing/QA</p>
        </div>
      </header>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border">
          <span className="text-sm font-semibold text-cyber-text">Generated Identity</span>
          <div className="flex items-center gap-2">
            <button onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-cyber-text-muted hover:text-cyber-text border border-cyber-border transition-colors">
              {copied ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={regen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-white bg-cyber-green-dark hover:bg-cyber-green hover:text-cyber-black transition-colors">
              <RefreshCw size={13} /> New
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row icon={<User size={15} />} label="Full Name" value={identity.fullName} />
          <Row icon={<User size={15} />} label="Gender" value={identity.gender} />
          <Row icon={<Mail size={15} />} label="Email" value={identity.email} />
          <Row icon={<Phone size={15} />} label="Phone" value={identity.phone} />
          <Row icon={<MapPin size={15} />} label="Street" value={identity.street} />
          <Row icon={<MapPin size={15} />} label="City / State" value={`${identity.city}, ${identity.state}`} />
          <Row icon={<MapPin size={15} />} label="ZIP" value={identity.zip} />
          <Row icon={<MapPin size={15} />} label="Country" value={identity.country} />
          <Row icon={<Calendar size={15} />} label="Birth Date" value={identity.birthDate} />
          <Row icon={<Hash size={15} />} label="SSN-like" value={identity.ssnLike} />
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-cyber-text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted">{label}</p>
        <p className="text-sm text-cyber-text font-mono truncate">{value}</p>
      </div>
    </div>
  )
}
