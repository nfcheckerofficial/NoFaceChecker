import { useState } from 'react'
import { clsx } from 'clsx'
import {
  ShoppingCart, CreditCard, Package, Star, Check, X,
  DollarSign, Shield, Zap,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  credits: number
  popular?: boolean
  features: string[]
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Starter Pack',
    description: 'Perfect for beginners',
    price: 5,
    credits: 100,
    features: ['100 Credits', 'Basic Gates', 'Email Support', '24h Access'],
  },
  {
    id: '2',
    name: 'Pro Pack',
    description: 'Most popular choice',
    price: 15,
    credits: 500,
    popular: true,
    features: ['500 Credits', 'All Gates', 'Priority Support', '48h Access', 'Random Data'],
  },
  {
    id: '3',
    name: 'Elite Pack',
    description: 'For power users',
    price: 30,
    credits: 1500,
    features: ['1500 Credits', 'All Gates', 'VIP Support', '72h Access', 'Random Data', '3D Checker'],
  },
  {
    id: '4',
    name: 'Unlimited',
    description: 'Maximum value',
    price: 50,
    credits: 5000,
    features: ['5000 Credits', 'All Gates', '24/7 Support', 'Unlimited Access', 'All Tools', 'API Access'],
  },
]

export function MarketplacePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [purchased, setPurchased] = useState<string[]>([])

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product)
    setShowConfirm(true)
  }

  const confirmPurchase = () => {
    if (selectedProduct) {
      setPurchased([...purchased, selectedProduct.id])
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
          <span className="text-sm text-cyber-text">Your Balance: <span className="font-bold text-cyber-green">$25.00</span></span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PRODUCTS.map(product => (
          <div
            key={product.id}
            className={clsx(
              'relative rounded-xl border bg-cyber-panel/70 backdrop-blur-sm p-5 transition-all hover:scale-[1.02]',
              product.popular
                ? 'border-cyber-purple shadow-[0_0_30px_rgba(157,0,255,0.2)]'
                : 'border-cyber-border hover:border-cyber-blue/50'
            )}
          >
            {product.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyber-purple text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                POPULAR
              </div>
            )}

            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-cyber-text">{product.name}</h3>
              <p className="text-xs text-cyber-text-muted mt-1">{product.description}</p>
            </div>

            <div className="text-center mb-5">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-cyber-text">${product.price}</span>
                <span className="text-sm text-cyber-text-muted">/one-time</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Zap size={14} className="text-cyber-yellow" />
                <span className="text-sm font-semibold text-cyber-yellow">{product.credits} Credits</span>
              </div>
            </div>

            <ul className="space-y-2 mb-5">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-cyber-text-muted">
                  <Check size={14} className="text-cyber-green shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(product)}
              disabled={purchased.includes(product.id)}
              className={clsx(
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                purchased.includes(product.id)
                  ? 'bg-cyber-green/20 border border-cyber-green/50 text-cyber-green cursor-default'
                  : product.popular
                    ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/30'
                    : 'bg-cyber-blue/20 border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/30'
              )}
            >
              {purchased.includes(product.id) ? (
                <>
                  <Check size={14} />
                  Purchased
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Buy Now
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Purchase History */}
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
              <button onClick={() => setShowConfirm(false)} className="text-cyber-text-muted hover:text-cyber-text">
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
                  <span className="text-sm font-medium text-cyber-yellow">{selectedProduct.credits}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cyber-border">
                  <span className="text-sm font-medium text-cyber-text">Total</span>
                  <span className="text-lg font-bold text-cyber-green">${selectedProduct.price}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
                <Shield size={16} className="text-cyber-blue shrink-0" />
                <p className="text-xs text-cyber-text-muted">Secure payment processed by Stripe</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border border-cyber-border rounded-lg text-cyber-text-muted hover:text-cyber-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPurchase}
                  className="px-4 py-2 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-cyber-green hover:bg-cyber-green/30 transition-colors flex items-center gap-2"
                >
                  <CreditCard size={14} />
                  Pay ${selectedProduct.price}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
