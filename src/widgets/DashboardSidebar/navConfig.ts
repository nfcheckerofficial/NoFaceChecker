import type { LucideIcon } from 'lucide-react'
import {
  Home, ShoppingCart, CreditCard, ShieldCheck, Package,
  Zap, Wallet, Star, Sparkles, Hammer, Award,
  MessageSquare, Search, Database, ScanLine, HardDrive,
  Tag, HelpCircle, LifeBuoy, LogOut, Vault,
  Settings, Users, Network, Wrench, ChevronDown, MessageCircle,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  /** Color del icono (clase tailwind text-*). */
  color: string
  /** Ruta relativa bajo /dashboard. Si tiene hijos, es expandible. */
  href?: string
  children?: { label: string; href: string }[]
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
        label: 'Stripe CCN', icon: CreditCard, color: 'text-orange-500',
        children: [
          { label: 'Vice Gate', href: '/dashboard/stripe-ccn/vice' },
          { label: 'Ocean Gate', href: '/dashboard/stripe-ccn/ocean' },
          { label: 'Chinesse Gate', href: '/dashboard/stripe-ccn/chinesse' },
          { label: 'Emotion Gate', href: '/dashboard/stripe-ccn/emotion' },
          { label: 'Sky Gate', href: '/dashboard/stripe-ccn/sky' },
          { label: 'Sunder Gate', href: '/dashboard/stripe-ccn/sunder' },
          { label: 'ThorGate', href: '/dashboard/stripe-ccn/thor' },
          { label: 'Sugar Gate', href: '/dashboard/stripe-ccn/sugar' },
        ],
      },
      {
        label: 'Stripe Auth', icon: ShieldCheck, color: 'text-orange-500',
        children: [
          { label: 'Auth Gate', href: '/dashboard/stripe-auth/auth' },
          { label: 'Inferno Gate', href: '/dashboard/stripe-auth/inferno' },
          { label: 'Sova Gate', href: '/dashboard/stripe-auth/sova' },
        ],
      },
      {
        label: 'Amazon', icon: Package, color: 'text-orange-500',
        children: [],
      },
      {
        label: 'Charge Gates', icon: Zap, color: 'text-orange-500',
        children: [
          { label: 'Horus Gate (Paypal)', href: '/dashboard/charge/horus' },
          { label: 'Payflow 3', href: '/dashboard/charge/payflow3' },
          { label: 'Payflow 2', href: '/dashboard/charge/payflow2' },
          { label: 'Payflow', href: '/dashboard/charge/payflow' },
          { label: 'B3 Gate 2', href: '/dashboard/charge/b3gate2' },
          { label: 'B3 Gate', href: '/dashboard/charge/b3gate' },
          { label: 'Bird Gate (Authorize)', href: '/dashboard/charge/bird' },
        ],
      },
      {
        label: 'Paypal Charge', icon: Wallet, color: 'text-cyber-blue',
        children: [
          { label: '5 Paypal', href: '/dashboard/paypal/5' },
          { label: 'Paypal 1', href: '/dashboard/paypal/1' },
          { label: '0.01 Paypal', href: '/dashboard/paypal/001' },
        ],
      },
      {
        label: 'Gates Especiales', icon: Star, color: 'text-orange-500',
        children: [
          { label: 'AllBirds', href: '/dashboard/special/allbirds' },
          { label: 'MisShopifyCVV', href: '/dashboard/special/misshopifycvv' },
          { label: 'MejorShopify[JOYAS]', href: '/dashboard/special/mejorshopify' },
          { label: 'FashionNovaShopify', href: '/dashboard/special/fashionnova' },
          { label: 'RedBull', href: '/dashboard/special/redbull' },
          { label: 'Shopify[GOLD]', href: '/dashboard/special/shopifygold' },
          { label: 'Adobe', href: '/dashboard/special/adobe' },
        ],
      },
      {
        label: 'Auth Gates', icon: Sparkles, color: 'text-cyber-green',
        children: [],
      },
      {
        label: 'BruteGates', icon: Hammer, color: 'text-cyber-red',
        children: [],
      },
      { label: "Achiever's Gate", icon: Award, color: 'text-cyber-purple', href: '/dashboard/achievers' },
    ],
  },
  {
    items: [
      {
        label: 'Temporary Verification', icon: MessageSquare, color: 'text-cyber-purple',
        children: [
          { label: 'SMS Pool', href: '/dashboard/verification/sms' },
        ],
      },
      { label: 'Bin Lookup', icon: Search, color: 'text-cyber-blue', href: '/dashboard/bin-lookup' },
      { label: 'Random Data', icon: Database, color: 'text-cyber-green', href: '/dashboard/random-data' },
      { label: '3D Checker', icon: ScanLine, color: 'text-cyber-red', href: '/dashboard/3d-checker' },
      { label: 'Extrap Database', icon: HardDrive, color: 'text-cyber-text-muted', href: '/dashboard/extrap' },
  { label: 'Telegram Bot', icon: MessageCircle, color: 'text-cyber-blue', href: '/dashboard/telegram-bot' },
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
