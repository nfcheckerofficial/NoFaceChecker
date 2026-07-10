import { useEffect, useRef } from 'react'

interface ParticlesProps {
  colors?: string[]
  count?: number
  mobileCount?: number
  speed?: number
  mobileSpeed?: number
  maxSize?: number
  maxAlpha?: number
}

export function Particles({
  colors = ['#ff0040', '#00d4ff', '#9d00ff', '#00ff88', '#ffcc00'],
  count = 50,
  mobileCount = 12,
  speed = 0.5,
  mobileSpeed = 0.3,
  maxSize = 2,
  maxAlpha = 0.5,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const isMobile = window.innerWidth < 640
    const particleCount = isMobile ? mobileCount : count
    const particleSpeed = isMobile ? mobileSpeed : speed

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * particleSpeed,
      vy: (Math.random() - 0.5) * particleSpeed,
      size: Math.random() * maxSize + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * maxAlpha + 0.05,
    }))

    let animId: number
    let lastTime = performance.now()
    const interval = isMobile ? 50 : 16

    const animate = (time: number) => {
      if (time - lastTime < interval) { animId = requestAnimationFrame(animate); return }
      lastTime = time
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      }
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [colors, count, mobileCount, speed, mobileSpeed, maxSize, maxAlpha])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}
