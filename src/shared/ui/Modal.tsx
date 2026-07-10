import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-xl p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyber-text">{title}</h3>
          <button onClick={onClose} className="text-cyber-text-muted hover:text-cyber-text"><X size={18} /></button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>
}

interface ModalBtnProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'ghost'
  disabled?: boolean
}

export function ModalBtn({ label, onClick, variant = 'primary', disabled }: ModalBtnProps) {
  const variants = {
    primary: 'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30',
    danger: 'bg-cyber-red/20 border-cyber-red/50 text-cyber-red hover:bg-cyber-red/30',
    warning: 'bg-cyber-yellow/20 border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30',
    success: 'bg-cyber-green/20 border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30',
    ghost: 'border-cyber-border text-cyber-text-muted hover:text-cyber-text',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={clsx('px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed', variants[variant])}>
      {label}
    </button>
  )
}
