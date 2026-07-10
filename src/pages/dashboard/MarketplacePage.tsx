import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import {
  ShoppingCart, CreditCard, Package, Star, Check, X,
  DollarSign, Shield, Zap, Loader2, AlertTriangle, Bitcoin,
} from 'lucide-react'
import {
  fetchPackages, startCheckout, createOxapayInvoice, paymentsHealth,
  type CreditPackage,
} from '@/features/payments/paymentsApi'
import { useUserStore } from '@/features/checker/store/userStore'

const HIGHLIGHT = '2'

export function MarketplacePage() {
  const profile = useUserStore((s) => s.profile)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [serverUp, setServerUp] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CreditPackage | null>(null)
  const [payMethod, setPayMethod] = useState<'stripe' | 'crypto'>('stripe')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const up = await paymentsHealth()
      if (!alive) return
      setServerUp(up)
      if (up) {
        try {
          const pkgs = await fetchPackages()
          if (alive) setPackages(pkgs)
        } catch {
          if (alive) setError('Could not load packages.')
        }
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const handlePurchase = (product: CreditPackage) => {
    setSelectedProduct(product)
    setShowConfirm(true)
  }

  const confirmPurchase = async () => {
    if (!selectedProduct) return
    setBusy(selectedProduct.id)
    setError('')
    try {
      const url = payMethod === 'stripe'
        ? await startCheckout(selectedProduct.id)
        : (await createOxapayInvoice(selectedProduct.id)).url
      window.location.href = url
    } catch {
      setError('Could not start checkout. Is the payments server running?')
      setBusy(null)
      setShowConfirm(false)
      setSelectedProduct(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Marketplace</h1>
          <p className="text-sm text-cyber-text-muted mt-1">Purchase credits and unlock premium features</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-cyber-panel/70 border border-cyber-border rounded-lg">
          <DollarSign size={16} className="text-cyber-green" />
          <span className="text-sm text-cyber-text">Your Balance: <span className="font-bold text-cyber-green">{profile.credits.toLocaleString()} credits</span></span>
        </div>
      </div>

      {serverUp === false && (
        <div className="flex items-start gap-3 rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-3 text-cyber-yellow text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payments server is offline.</p>
            <p className="text-cyber-yellow/80 text-xs mt-0.5">
              Run <code className="font-mono">npm run server</code> and add your API keys to <code className="font-mono">.env</code>.
            </p>
          </div>
        </div>
      )}

      {serverUp !== false && (
        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            onClick={() => setPayMethod('stripe')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border',
              payMethod === 'stripe'
                ? 'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue'
                : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text'
            )}
          >
            <CreditCard size={15} />
            Card
          </button>
          <button
            onClick={() => setPayMethod('crypto')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border',
              payMethod === 'crypto'
                ? 'bg-cyber-purple/20 border-cyber-purple/50 text-cyber-purple'
                : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text'
            )}
          >
            <Bitcoin size={15} />
            Crypto
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-cyber-text-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map(product => (
            <div
              key={product.id}
              className={clsx(
                'relative rounded-xl border bg-cyber-panel/70 backdrop-blur-sm p-5 transition-all hover:scale-[1.02]',
                product.id === HIGHLIGHT
                  ? 'border-cyber-purple shadow-[0_0_30px_rgba(157,0,255,0.2)]'
                  : 'border-cyber-border hover:border-cyber-blue/50'
              )}
            >
              {product.id === HIGHLIGHT && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyber-purple text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  POPULAR
                </div>
              )}

              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-cyber-text">{product.name}</h3>
              </div>

              <div className="text-center mb-5">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-cyber-text">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-cyber-text-muted">/one-time</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Zap size={14} className="text-cyber-yellow" />
                  <span className="text-sm font-semibold text-cyber-yellow">{product.credits.toLocaleString()} Credits</span>
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-sm text-cyber-text-muted">
                  <Check size={14} className="text-cyber-green shrink-0" />
                  {product.credits.toLocaleString()} Credits
                </li>
                <li className="flex items-center gap-2 text-sm text-cyber-text-muted">
                  <Check size={14} className="text-cyber-green shrink-0" />
                  Use across all gates
                </li>
                <li className="flex items-center gap-2 text-sm text-cyber-text-muted">
                  <Check size={14} className="text-cyber-green shrink-0" />
                  Instant top-up
                </li>
              </ul>

              <button
                onClick={() => handlePurchase(product)}
                disabled={!serverUp || busy !== null}
                className={clsx(
                  'w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                  product.id === HIGHLIGHT
                    ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/30'
                    : 'bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30'
                )}
              >
                {busy === product.id ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                {busy === product.id ? 'Redirecting...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-cyber-red text-center mt-4">{error}</p>}

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-cyber-border">
          <h2 className="text-sm font-semibold text-cyber-text">Recent Purchases</h2>
        </div>
        <div className="p-5">
          <div className="text-center py-8 text-cyber-text-muted">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No purchases yet</p>
            <p className="text-xs mt-1">Your purchase history will appear here</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyber-text">Confirm Purchase</h3>
              <button onClick={() => { setShowConfirm(false); setSelectedProduct(null) }} className="text-cyber-text-muted hover:text-cyber-text">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-cyber-panel rounded-lg border border-cyber-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cyber-text-muted">Product</span>
                  <span className="text-sm font-medium text-cyber-text">{selectedProduct.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cyber-text-muted">Credits</span>
                  <span className="text-sm font-medium text-cyber-yellow">{selectedProduct.credits.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cyber-border">
                  <span className="text-sm font-medium text-cyber-text">Total</span>
                  <span className="text-lg font-bold text-cyber-green">${selectedProduct.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
                <Shield size={16} className="text-cyber-blue shrink-0" />
                <p className="text-xs text-cyber-text-muted">Secure payment processed by Stripe</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowConfirm(false); setSelectedProduct(null) }}
                  className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPurchase}
                  disabled={busy === selectedProduct.id}
                  className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  {busy === selectedProduct.id ? <Loader2 size={14} className="animate-spin" /> : payMethod === 'crypto' ? <Bitcoin size={14} /> : <CreditCard size={14} />}
                  {busy === selectedProduct.id ? 'Redirecting...' : payMethod === 'crypto' ? `Pay Crypto $${selectedProduct.price.toFixed(2)}` : `Pay $${selectedProduct.price.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
