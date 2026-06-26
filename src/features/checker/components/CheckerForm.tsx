import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { GlitchText } from '@/shared/ui/GlitchText'
import { useCheckerStore } from '../store/checkerStore'
import { formatCardNumber, formatExpiry, detectCardType } from '../services/cardDetector'
import { CreditCard, Lock, Calendar, Shield } from 'lucide-react'
import { clsx } from 'clsx'

interface CheckerFormProps {
  onCardNumberChange?: (value: string) => void
  initialData?: { number: string; expiry: string; cvv: string } | null
  className?: string
}

export function CheckerForm({ onCardNumberChange, initialData, className }: CheckerFormProps) {
  const { check, isChecking } = useCheckerStore()
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setCardNumber(initialData.number)
      setExpiry(initialData.expiry)
      setCvv(initialData.cvv)
      onCardNumberChange?.(initialData.number)
    }
  }, [initialData, onCardNumberChange])

  const cardInfo = detectCardType(cardNumber)

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\D/g, '').length <= 19) {
      setCardNumber(formatted)
      onCardNumberChange?.(formatted)
      setError('')
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value)
    if (formatted.replace(/\D/g, '').length <= 4) {
      setExpiry(formatted)
      setError('')
    }
  }

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const maxLength = cardInfo.cvvLength
    if (value.length <= maxLength) {
      setCvv(value)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanedNumber = cardNumber.replace(/\D/g, '')
    if (cleanedNumber.length < 13) {
      setError('Invalid card number')
      return
    }

    if (expiry.length < 5) {
      setError('Invalid expiry date')
      return
    }

    if (cvv.length < 3) {
      setError('Invalid CVV')
      return
    }

    await check({
      number: cleanedNumber,
      expiry,
      cvv,
    })
  }

  return (
    <div
      className={clsx(
        'w-full bg-cyber-panel/95 backdrop-blur-sm',
        'border border-cyber-border rounded-sm',
        'overflow-hidden',
        className
      )}
    >
      <div className="px-6 py-4 border-b border-cyber-border bg-cyber-dark/50">
        <GlitchText intensity="low" className="text-sm text-cyber-red font-bold tracking-wider">
          CARD VERIFICATION TERMINAL
        </GlitchText>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
        <Input
          label="CARD NUMBER"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={handleCardNumberChange}
          icon={<CreditCard size={16} />}
          error={error && error.includes('card') ? error : undefined}
          disabled={isChecking}
        />

        <div className="grid grid-cols-2 gap-5">
          <Input
            label="EXPIRY"
            placeholder="MM/YY"
            value={expiry}
            onChange={handleExpiryChange}
            icon={<Calendar size={16} />}
            error={error && error.includes('expiry') ? error : undefined}
            disabled={isChecking}
          />
          <Input
            label="CVV"
            placeholder={cardInfo.type === 'amex' ? '••••' : '•••'}
            value={cvv}
            onChange={handleCVVChange}
            icon={<Lock size={16} />}
            type="password"
            error={error && error.includes('CVV') ? error : undefined}
            disabled={isChecking}
          />
        </div>

        {error && (
          <div className="text-xs text-red-500 text-center py-2 bg-red-500/10 rounded-sm border border-red-500/20">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          glow
          disabled={isChecking}
          className="w-full mt-1"
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-2">
              <Shield size={16} className="animate-spin" />
              INITIATING CHECK...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Shield size={16} />
              INITIATE CHECK
            </span>
          )}
        </Button>

        <div className="text-center text-[10px] text-cyber-text-muted/60 pt-2">
          All data is encrypted end-to-end
        </div>
      </form>
    </div>
  )
}
