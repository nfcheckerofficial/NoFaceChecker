import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface TypingTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function TypingText({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsTyping(true)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!isTyping) return

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, isTyping, onComplete])

  return (
    <span className={clsx('font-mono', className)}>
      {displayText}
      {isTyping && currentIndex < text.length && (
        <span className="animate-pulse">_</span>
      )}
    </span>
  )
}
