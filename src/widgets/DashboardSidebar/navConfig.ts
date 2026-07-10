import type { LucideIcon } from 'lucide-react'
import {
  Home, ShoppingCart, CreditCard, Shield, ShieldCheck, Package,
  Swords, Zap, Wallet, Gem, Sparkles, Fingerprint, Skull, Award,
  MessageSquare, Search, Database, ScanLine, HardDrive,
  Tag, HelpCircle, LifeBuoy, LogOut, Vault,
  Settings, Users, Network, Wrench, ChevronDown, MessageCircle, Mail, Key, Lock, Crosshair, Terminal, Bug,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  /** Color del icono (clase tailwind text-*). */
  color: string
  /** Ruta relativa bajo /dashboard. Si tiene hijos, es expandible. */
  href?: string
  children?: { label: string; href: string; color?: string }[]
  /** Solo visible para admins. */
  adminOnly?: boolean
}

export interface NavGroup {
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Overview', icon: Home, color: 'text-cyber-blue', href: '/dashboard' },
      { label: 'Your Profile', icon: ShieldCheck, color: 'text-cyber-text-muted', href: '/dashboard/profile' },
      { label: 'Marketplace', icon: ShoppingCart, color: 'text-orange-500', href: '/dashboard/marketplace' },
    ],
  },
  {
    items: [
      {
        label: 'Stripe CCN', icon: CreditCard, color: 'text-cyber-red',
        children: [
          { label: 'Money Gate', href: '/dashboard/stripe-ccn/vice', color: 'text-cyber-red' },
        ],
      },
      {
        label: 'CVV CHARGED', icon: Shield, color: 'text-cyber-blue',
        children: [
          { label: 'Auth Gate', href: '/dashboard/stripe-auth/auth', color: 'text-cyber-blue' },
          { label: 'Inferno Gate', href: '/dashboard/stripe-auth/inferno', color: 'text-cyber-red' },
          { label: 'Sova Gate', href: '/dashboard/stripe-auth/sova', color: 'text-cyber-green' },
        ],
      },
      {
        label: 'Amazon', icon: Package, color: 'text-cyber-green',
        children: [
          { label: 'GC $5', href: '/dashboard/amazon/gc-5', color: 'text-cyber-green' },
          { label: 'GC $10', href: '/dashboard/amazon/gc-10', color: 'text-cyber-blue' },
          { label: 'GC $25', href: '/dashboard/amazon/gc-25', color: 'text-cyber-purple' },
          { label: 'GC $50', href: '/dashboard/amazon/gc-50', color: 'text-cyber-yellow' },
        ],
      },
      {
        label: 'Charge Gates', icon: Swords, color: 'text-cyber-yellow',
        children: [
          { label: 'Horus Gate', href: '/dashboard/charge/horus', color: 'text-cyber-red' },
          { label: 'Payflow 3', href: '/dashboard/charge/payflow3', color: 'text-cyber-blue' },
          { label: 'Payflow 2', href: '/dashboard/charge/payflow2', color: 'text-cyber-green' },
          { label: 'Payflow', href: '/dashboard/charge/payflow', color: 'text-cyber-purple' },
          { label: 'B3 Gate 2', href: '/dashboard/charge/b3gate2', color: 'text-cyber-yellow' },
          { label: 'B3 Gate', href: '/dashboard/charge/b3gate', color: 'text-orange-500' },
          { label: 'Bird Gate', href: '/dashboard/charge/bird', color: 'text-cyber-blue' },
        ],
      },
      {
        label: 'Paypal Gates', icon: Wallet, color: 'text-cyber-blue',
        children: [
          { label: '$5', href: '/dashboard/paypal/5', color: 'text-cyber-red' },
          { label: '$1', href: '/dashboard/paypal/1', color: 'text-cyber-blue' },
          { label: '$0.01', href: '/dashboard/paypal/001', color: 'text-cyber-green' },
        ],
      },
      {
        label: 'Gates Especiales', icon: Gem, color: 'text-cyber-purple',
        children: [
          { label: 'Crypto', href: '/dashboard/special/allbirds', color: 'text-cyber-purple' },
        ],
      },
      {
        label: 'Auth Gates', icon: Fingerprint, color: 'text-cyber-green',
        children: [],
      },
      {
        label: 'BruteGates', icon: Skull, color: 'text-cyber-red',
        children: [],
      },
      { label: "Achiever's Gate", icon: Award, color: 'text-cyber-purple', href: '/dashboard/achievers' },
    ],
  },
  {
    items: [
      {
        label: 'SMS Pool', icon: MessageSquare, color: 'text-cyber-purple',
        children: [
          { label: 'SMS Pool', href: '/dashboard/verification/sms', color: 'text-cyber-purple' },
        ],
      },
      { label: 'Live Vault', icon: Vault, color: 'text-cyber-green', href: '/dashboard/live-vault' },

      { label: 'Bin Lookup', icon: Search, color: 'text-cyber-blue', href: '/dashboard/bin-lookup' },
      { label: 'Random Data', icon: Database, color: 'text-cyber-green', href: '/dashboard/random-data' },
      { label: '3D Checker', icon: Crosshair, color: 'text-cyber-red', href: '/dashboard/3d-checker' },
      { label: 'Extrap Database', icon: HardDrive, color: 'text-cyber-text-muted', href: '/dashboard/extrap' },
      { label: 'Telegram Bot', icon: MessageCircle, color: 'text-cyber-blue', href: '/dashboard/telegram-bot', adminOnly: true },
      { label: 'Instaddr', icon: Mail, color: 'text-cyber-yellow', href: '/dashboard/instaddr' },
    ],
  },
  {
    items: [
      { label: 'Pricing', icon: Tag, color: 'text-cyber-green', href: '/dashboard/pricing' },
      { label: 'FAQs', icon: HelpCircle, color: 'text-cyber-blue', href: '/dashboard/faqs' },
      { label: 'Get Support', icon: LifeBuoy, color: 'text-orange-500', href: '/dashboard/support' },
    ],
  },
  {
    items: [
      {
        label: 'Admin Panel', icon: Settings, color: 'text-cyber-red',
        children: [
          { label: 'Control Panel', href: '/dashboard/admin/control-panel' },
          { label: 'Gates Panel', href: '/dashboard/admin/gates-panel' },
          { label: 'Tools Panel', href: '/dashboard/admin/tools-panel' },
        ],
      },
    ],
  },
]
