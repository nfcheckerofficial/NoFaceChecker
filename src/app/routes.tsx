import { Route, Routes, useParams } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CheckerPage } from '@/pages/CheckerPage'
import { BulkCheckerPage } from '@/pages/BulkCheckerPage'
import { GeneratorPage } from '@/pages/GeneratorPage'
import { DashboardLayout } from '@/widgets/DashboardLayout/DashboardLayout'
import { OverviewPage } from '@/pages/dashboard/OverviewPage'
import { GeneratorDashboardPage } from '@/pages/dashboard/GeneratorDashboardPage'
import { BinLookupPage } from '@/pages/dashboard/BinLookupPage'
import { RandomDataPage } from '@/pages/dashboard/RandomDataPage'
import { ThreeDCheckerPage } from '@/pages/dashboard/ThreeDCheckerPage'

import { PricingPage } from '@/pages/dashboard/PricingPage'
import { PaySuccessPage } from '@/pages/dashboard/PaySuccessPage'
import { PayCancelPage } from '@/pages/dashboard/PayCancelPage'
import { ProfilePage } from '@/pages/dashboard/ProfilePage'
import { FaqsPage } from '@/pages/dashboard/FaqsPage'
import { SupportPage } from '@/pages/dashboard/SupportPage'
import { CardVaultPage } from '@/pages/dashboard/CardVaultPage'
import { MarketplacePage } from '@/pages/dashboard/MarketplacePage'
import { TelegramSettingsPage } from '@/pages/dashboard/TelegramSettingsPage'
import { GateDashboard } from '@/features/checker/components/GateDashboard'
import { PlaceholderPage } from '@/pages/dashboard/PlaceholderPage'

// Admin Pages
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AdminRoute } from '@/features/auth/components/AdminRoute'
import { ControlPanelPage } from '@/pages/dashboard/admin/ControlPanelPage'
import { GatesPanelPage } from '@/pages/dashboard/admin/GatesPanelPage'
import { ToolsPanelPage } from '@/pages/dashboard/admin/ToolsPanelPage'

/** Resuelve un gate parametrizado: usa `prefix-<param>` como gateId. */
function ParamGate({ prefix, param }: { prefix: string; param: string }) {
  const params = useParams()
  const value = params[param]
  return <GateDashboard gateId={value ? `${prefix}-${value}` : prefix} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard con sidebar (requiere login) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<OverviewPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />

        {/* Gates conectados al motor real */}
        <Route path="stripe-ccn/:id" element={<ParamGate prefix="stripe-ccn" param="id" />} />
        <Route path="stripe-auth/:id" element={<ParamGate prefix="stripe-auth" param="id" />} />
        <Route path="amazon/:mode" element={<ParamGate prefix="amazon" param="mode" />} />
        <Route path="charge/:id" element={<ParamGate prefix="charge" param="id" />} />
        <Route path="paypal/:id" element={<ParamGate prefix="paypal" param="id" />} />
        <Route path="special/:id" element={<ParamGate prefix="special" param="id" />} />
        <Route path="auth-gates/:id" element={<GateDashboard gateId="auth-gates-pool" />} />
        <Route path="brute/:id" element={<ParamGate prefix="brute" param="id" />} />
        <Route path="achievers" element={<GateDashboard gateId="achievers" />} />

        <Route path="verification/:id" element={<PlaceholderPage title="Temporary Verification" description="SMS / number pool" />} />
        <Route path="bin-lookup" element={<BinLookupPage />} />
        <Route path="card-vault" element={<CardVaultPage />} />
        <Route path="random-data" element={<RandomDataPage />} />
        <Route path="3d-checker" element={<ThreeDCheckerPage />} />
        <Route path="extrap" element={<PlaceholderPage title="Extrap Database" description="Extrapolation database" />} />
        <Route path="telegram-bot" element={<TelegramSettingsPage />} />
        <Route path="generator" element={<GeneratorDashboardPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="pay/success" element={<PaySuccessPage />} />
        <Route path="pay/cancel" element={<PayCancelPage />} />
        <Route path="faqs" element={<FaqsPage />} />
        <Route path="support" element={<SupportPage />} />

        {/* Admin Routes */}
        <Route path="admin/control-panel" element={<AdminRoute><ControlPanelPage /></AdminRoute>} />
        <Route path="admin/gates-panel" element={<AdminRoute><GatesPanelPage /></AdminRoute>} />
        <Route path="admin/tools-panel" element={<AdminRoute><ToolsPanelPage /></AdminRoute>} />
      </Route>

      {/* Rutas legacy */}
      <Route path="/checker" element={<CheckerPage />} />
      <Route path="/checker/bulk" element={<BulkCheckerPage />} />
      <Route path="/generator" element={<GeneratorPage />} />
    </Routes>
  )
}
