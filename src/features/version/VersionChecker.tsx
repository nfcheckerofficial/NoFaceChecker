import { useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const CHECK_INTERVAL = 60_000

export function VersionChecker() {
  const versionRef = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/version`, { cache: 'no-store' })
        if (!res.ok) return
        const { version } = await res.json()
        if (!version) return

        if (versionRef.current && versionRef.current !== version) {
          window.location.reload()
          return
        }

        versionRef.current = version
      } catch {}
    }

    check()
    const id = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return null
}
