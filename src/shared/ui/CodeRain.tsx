import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface CodeRainProps {
  color?: string
  fontSize?: number
  fps?: number
  opacity?: number
  className?: string
}

/**
 * Lluvia de código estilo Matrix que se ajusta al tamaño de su contenedor padre
 * (debe ser position: relative). Pensado para fondos de sección, no pantalla completa.
 */
export function CodeRain({
  color = '#00ff88',
  fontSize = 14,
  fps = 18,
  opacity = 0.35,
  className,
}: CodeRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    const actualFontSize = isMobile ? fontSize * 0.85 : fontSize

    let drops: number[] = []

    const resize = () => {
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      const columns = Math.max(1, Math.floor(canvas.width / actualFontSize))
      drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * -50))
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    // Mezcla de caracteres tipo "hack": katakana, hex y símbolos.
    const chars = 'ｱｲｳｴｵｶｷｸ0123456789ABCDEF<>/\\{}[]#$%&*+=:;'

    let animationId = 0
    let lastTime = 0
    const interval = 1000 / fps

    const draw = (currentTime: number) => {
      animationId = requestAnimationFrame(draw)

      const deltaTime = currentTime - lastTime
      if (deltaTime < interval) return
      lastTime = currentTime - (deltaTime % interval)

      // Estela: oscurece levemente el frame anterior.
      ctx.fillStyle = 'rgba(8, 8, 10, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${actualFontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * actualFontSize
        const y = drops[i] * actualFontSize

        // Cabeza de la columna más brillante (blanca), cola con color.
        ctx.fillStyle = Math.random() > 0.95 ? '#ffffff' : color
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
      ro.disconnect()
    }
  }, [color, fontSize, fps])

  return (
    <canvas
      ref={canvasRef}
      className={clsx('absolute inset-0 w-full h-full pointer-events-none', className)}
      style={{ opacity }}
    />
  )
}
