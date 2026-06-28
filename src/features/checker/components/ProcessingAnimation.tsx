import { useState, useEffect } from 'react'
import { Card } from '@/shared/ui/Card'
import { TypingText } from '@/shared/ui/TypingText'
import { clsx } from 'clsx'

interface ProcessingStep {
  text: string
  duration: number
}

interface ProcessingAnimationProps {
  isProcessing: boolean
  className?: string
}

const PROCESSING_STEPS: ProcessingStep[] = [
  { text: 'PARSING CARD DATA...', duration: 600 },
  { text: 'RUNNING LUHN ALGORITHM...', duration: 700 },
  { text: 'DETECTING CARD BRAND...', duration: 600 },
  { text: 'VALIDATING EXPIRY & CVV...', duration: 700 },
  { text: 'RESOLVING BIN INTEL...', duration: 900 },
  { text: 'COMPILING REPORT...', duration: 500 },
]

export function ProcessingAnimation({ isProcessing, className }: ProcessingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    let stepTimeout: ReturnType<typeof setTimeout>
    let progressInterval: ReturnType<typeof setInterval>

    const runStep = () => {
      if (currentStep < PROCESSING_STEPS.length) {
        const step = PROCESSING_STEPS[currentStep]
        const stepProgress = ((currentStep + 1) / PROCESSING_STEPS.length) * 100

        progressInterval = setInterval(() => {
          setProgress((prev) => {
            const targetProgress = ((currentStep) / PROCESSING_STEPS.length) * 100
            if (prev >= targetProgress) {
              clearInterval(progressInterval)
              return targetProgress
            }
            return prev + 2
          })
        }, 50)

        stepTimeout = setTimeout(() => {
          clearInterval(progressInterval)
          setProgress(((currentStep + 1) / PROCESSING_STEPS.length) * 100)
          setCurrentStep((prev) => prev + 1)
        }, step.duration)
      }
    }

    runStep()

    return () => {
      clearTimeout(stepTimeout)
      clearInterval(progressInterval)
    }
  }, [isProcessing, currentStep])

  if (!isProcessing) return null

  return (
    <Card className={clsx('bg-cyber-panel/90 backdrop-blur-sm border-cyber-red/50', className)}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyber-red animate-pulse" />
          <span className="text-xs text-cyber-red font-bold tracking-wider">
            PROCESSING
          </span>
        </div>

        <div className="space-y-2">
          {PROCESSING_STEPS.slice(0, currentStep).map((step, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="text-cyber-green">✓</span>
              <span className="text-cyber-text-muted">{step.text}</span>
            </div>
          ))}

          {currentStep < PROCESSING_STEPS.length && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-cyber-yellow animate-pulse">●</span>
              <TypingText
                text={PROCESSING_STEPS[currentStep].text}
                speed={30}
                className="text-cyber-yellow"
              />
            </div>
          )}
        </div>

        <div className="relative h-2 bg-cyber-dark rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyber-red to-cyber-yellow transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-safe:animate-pulse" />
        </div>

        <div className="flex justify-between text-[10px] text-cyber-text-muted">
          <span>Step {currentStep + 1}/{PROCESSING_STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </Card>
  )
}
