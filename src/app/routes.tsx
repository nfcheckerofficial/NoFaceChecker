import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useParams, useNavigation } from 'react-router-dom'
import NProgress from 'nprogress'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CheckerPage } from '@/pages/CheckerPage'
import { BulkCheckerPage } from '@/pages/BulkCheckerPage'
import { GeneratorPage } from '@/pages/GeneratorPage'
import { DashboardLayout } from '@/widgets/DashboardLayout/DashboardLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { GateDashboard } from '@/features/checker/components/GateDashboard'

const OverviewPage = lazy(() => import('@/pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage })))
const GeneratorDashboardPage = lazy(() => import('@/pages/dashboard/GeneratorDashboardPage').then(m => ({ default: m.GeneratorDashboardPage })))
const BinLookupPage = lazy(() => import('@/pages/dashboard/BinLookupPage').then(m => ({ default: m.BinLookupPage })))
const RandomDataPage = lazy(() => import('@/pages/dashboard/RandomDataPage').then(m => ({ default: m.RandomDataPage })))
const ThreeDCheckerPage = lazy(() => import('@/pages/dashboard/ThreeDCheckerPage').then(m => ({ default: m.ThreeDCheckerPage })))
const ExtrapPage = lazy(() => import('@/pages/dashboard/ExtrapPage').then(m => ({ default: m.ExtrapPage })))
const PricingPage = lazy(() => import('@/pages/dashboard/PricingPage').then(m => ({ default: m.PricingPage })))
const PaySuccessPage = lazy(() => import('@/pages/dashboard/PaySuccessPage').then(m => ({ default: m.PaySuccessPage })))
const PayCancelPage = lazy(() => import('@/pages/dashboard/PayCancelPage').then(m => ({ default: m.PayCancelPage })))
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage').then(m => ({ default: m.ProfilePage })))
const FaqsPage = lazy(() => import('@/pages/dashboard/FaqsPage').then(m => ({ default: m.FaqsPage })))
const SupportPage = lazy(() => import('@/pages/dashboard/SupportPage').then(m => ({ default: m.SupportPage })))
const CardVaultPage = lazy(() => import('@/pages/dashboard/CardVaultPage').then(m => ({ default: m.CardVaultPage })))
const MarketplacePage = lazy(() => import('@/pages/dashboard/MarketplacePage').then(m => ({ default: m.MarketplacePage })))
const TelegramSettingsPage = lazy(() => import('@/pages/dashboard/TelegramSettingsPage').then(m => ({ default: m.TelegramSettingsPage })))
const InstaddrPage = lazy(() => import('@/pages/dashboard/InstaddrPage').then(m => ({ default: m.InstaddrPage })))
const PlaceholderPage = lazy(() => import('@/pages/dashboard/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })))
const ControlPanelPage = lazy(() => import('@/pages/dashboard/admin/ControlPanelPage').then(m => ({ default: m.ControlPanelPage })))
const GatesPanelPage = lazy(() => import('@/pages/dashboard/admin/GatesPanelPage').then(m => ({ default: m.GatesPanelPage })))
const ToolsPanelPage = lazy(() => import('@/pages/dashboard/admin/ToolsPanelPage').then(m => ({ default: m.ToolsPanelPage })))

function ParamGate({ prefix, param }: { prefix: string; param: string }) {
  const params = useParams()
  const value = params[param]
  return <GateDashboard gateId={value ? `${prefix}-${value}` : prefix} />
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    NProgress.start()
    return () => { NProgress.done() }
  }, [])
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-cyber-text-muted text-sm py-20">Loading...</div>}>
      {children}
    </Suspense>
  )
}

function RouteChangeTracker() {
  const navigation = useNavigation()
  useEffect(() => {
    if (navigation.state === 'loading') NProgress.start()
    if (navigation.state === 'idle') { NProgress.done() }
  }, [navigation.state])
  return null
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas legacy (sin sidebar) */}
      <Route path="/checker" element={<CheckerPage />} />
      <Route path="/checker/bulk" element={<BulkCheckerPage />} />
      <Route path="/generator" element={<GeneratorPage />} />

      {/* Dashboard (requiere login) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<SuspenseWrapper><OverviewPage /></SuspenseWrapper>} />
        <Route path="profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
        <Route path="marketplace" element={<SuspenseWrapper><MarketplacePage /></SuspenseWrapper>} />

        <Route path="stripe-ccn/:id" element={<><RouteChangeTracker /><ParamGate prefix="stripe-ccn" param="id" /></>} />
        <Route path="stripe-auth/:id" element={<><RouteChangeTracker /><ParamGate prefix="stripe-auth" param="id" /></>} />
        <Route path="amazon/:mode" element={<><RouteChangeTracker /><ParamGate prefix="amazon" param="mode" /></>} />
        <Route path="charge/:id" element={<><RouteChangeTracker /><ParamGate prefix="charge" param="id" /></>} />
        <Route path="paypal/:id" element={<><RouteChangeTracker /><ParamGate prefix="paypal" param="id" /></>} />
        <Route path="special/:id" element={<><RouteChangeTracker /><ParamGate prefix="special" param="id" /></>} />
        <Route path="auth-gates/:id" element={<><RouteChangeTracker /><GateDashboard gateId="auth-gates-pool" /></>} />
        <Route path="brute/:id" element={<><RouteChangeTracker /><ParamGate prefix="brute" param="id" /></>} />
        <Route path="achievers" element={<><RouteChangeTracker /><GateDashboard gateId="achievers" /></>} />

        <Route path="verification/:id" element={<SuspenseWrapper><PlaceholderPage title="Temporary Verification" description="SMS / number pool" /></SuspenseWrapper>} />
        <Route path="bin-lookup" element={<SuspenseWrapper><BinLookupPage /></SuspenseWrapper>} />
        <Route path="card-vault" element={<SuspenseWrapper><CardVaultPage /></SuspenseWrapper>} />
        <Route path="random-data" element={<SuspenseWrapper><RandomDataPage /></SuspenseWrapper>} />
        <Route path="3d-checker" element={<SuspenseWrapper><ThreeDCheckerPage /></SuspenseWrapper>} />
        <Route path="extrap" element={<SuspenseWrapper><ExtrapPage /></SuspenseWrapper>} />
        <Route path="telegram-bot" element={<SuspenseWrapper><TelegramSettingsPage /></SuspenseWrapper>} />
        <Route path="instaddr" element={<SuspenseWrapper><InstaddrPage /></SuspenseWrapper>} />
        <Route path="generator" element={<SuspenseWrapper><GeneratorDashboardPage /></SuspenseWrapper>} />
        <Route path="pricing" element={<SuspenseWrapper><PricingPage /></SuspenseWrapper>} />
        <Route path="pay/success" element={<SuspenseWrapper><PaySuccessPage /></SuspenseWrapper>} />
        <Route path="pay/cancel" element={<SuspenseWrapper><PayCancelPage /></SuspenseWrapper>} />
        <Route path="faqs" element={<SuspenseWrapper><FaqsPage /></SuspenseWrapper>} />
        <Route path="support" element={<SuspenseWrapper><SupportPage /></SuspenseWrapper>} />

        <Route path="admin/control-panel" element={<AdminRoute><SuspenseWrapper><ControlPanelPage /></SuspenseWrapper></AdminRoute>} />
        <Route path="admin/gates-panel" element={<AdminRoute><SuspenseWrapper><GatesPanelPage /></SuspenseWrapper></AdminRoute>} />
        <Route path="admin/tools-panel" element={<AdminRoute><SuspenseWrapper><ToolsPanelPage /></SuspenseWrapper></AdminRoute>} />
      </Route>
    </Routes>
  )
}
