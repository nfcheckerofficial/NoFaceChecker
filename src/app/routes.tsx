import { lazy, Suspense, useEffect, useRef } from 'react'
import { Route, Routes, useParams, useLocation } from 'react-router-dom'
import NProgress from 'nprogress'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardLayout } from '@/widgets/DashboardLayout/DashboardLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { GateDashboard } from '@/features/checker/components/GateDashboard'
import { VersionChecker } from '@/features/version/VersionChecker'

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const CheckerPage = lazy(() => import('@/pages/CheckerPage').then(m => ({ default: m.CheckerPage })))
const BulkCheckerPage = lazy(() => import('@/pages/BulkCheckerPage').then(m => ({ default: m.BulkCheckerPage })))
const GeneratorPage = lazy(() => import('@/pages/GeneratorPage').then(m => ({ default: m.GeneratorPage })))

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
const LiveVaultPage = lazy(() => import('@/pages/dashboard/LiveVaultPage').then(m => ({ default: m.LiveVaultPage })))
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
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-cyber-text-muted text-sm py-20">Loading...</div>}>
      {children}
    </Suspense>
  )
}

function RouteChangeTracker() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      NProgress.start()
      NProgress.done()
      prevPath.current = location.pathname
    }
  }, [location.pathname])
  return null
}

export function AppRoutes() {
  return (
    <>
      <VersionChecker />
      <RouteChangeTracker />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
      <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />

      {/* Rutas legacy (sin sidebar) */}
      <Route path="/checker" element={<SuspenseWrapper><CheckerPage /></SuspenseWrapper>} />
      <Route path="/checker/bulk" element={<SuspenseWrapper><BulkCheckerPage /></SuspenseWrapper>} />
      <Route path="/generator" element={<SuspenseWrapper><GeneratorPage /></SuspenseWrapper>} />

      {/* Dashboard (requiere login) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<SuspenseWrapper><OverviewPage /></SuspenseWrapper>} />
        <Route path="profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
        <Route path="marketplace" element={<SuspenseWrapper><MarketplacePage /></SuspenseWrapper>} />

        <Route path="gate/money" element={<GateDashboard gateId="money-gate" />} />

        <Route path="verification/:id" element={<SuspenseWrapper><PlaceholderPage title="Temporary Verification" description="SMS / number pool" /></SuspenseWrapper>} />
        <Route path="bin-lookup" element={<SuspenseWrapper><BinLookupPage /></SuspenseWrapper>} />
        <Route path="card-vault" element={<SuspenseWrapper><CardVaultPage /></SuspenseWrapper>} />
        <Route path="live-vault" element={<SuspenseWrapper><LiveVaultPage /></SuspenseWrapper>} />
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
    </>
  )
}
