import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface MatrixRainProps {
  color?: string
  fontSize?: number
  fps?: number
  opacity?: number
  className?: string
}

export function MatrixRain({
  color = '#ff0040',
  fontSize = 14,
  fps = 20,
  opacity = 0.1,
  className
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    const actualFontSize = isMobile ? fontSize * 0.8 : fontSize

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const columns = Math.floor(canvas.width / actualFontSize)
    const drops: number[] = Array(columns).fill(1)

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?'

    let animationId: number
    let lastTime = 0
    const interval = 1000 / fps

    const draw = (currentTime: number) => {
      animationId = requestAnimationFrame(draw)

      const deltaTime = currentTime - lastTime
      if (deltaTime < interval) return
      lastTime = currentTime - (deltaTime % interval)

      ctx.fillStyle = `rgba(10, 10, 10, 0.05)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = color
      ctx.font = `${actualFontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * actualFontSize
        const y = drops[i] * actualFontSize

        ctx.fillText(text, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [color, fontSize, fps])

  return (
    <canvas
      ref={canvasRef}
      className={clsx(
        'fixed inset-0 pointer-events-none z-0',
        className
      )}
      style={{ opacity }}
    />
  )
}
