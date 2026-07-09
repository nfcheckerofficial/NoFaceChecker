import type { LucideIcon } from 'lucide-react'
import {
  Home, ShoppingCart, CreditCard, ShieldCheck,
  Gem, Fingerprint, Skull, Award,
  MessageSquare, Search, Database, ScanLine, HardDrive,
  Tag, HelpCircle, LifeBuoy, LogOut, Vault,
  Settings, Users, Network, Wrench,
  MessageCircle, Mail, Key, Lock, Crosshair, Terminal, Bug,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  color: string
  href?: string
  children?: { label: string; href: string }[]
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
        label: 'Gate', icon: CreditCard, color: 'text-cyber-green',
        children: [
          { label: 'Money Gate', href: '/dashboard/gate/money' },
        ],
      },
      { label: 'Live Vault', icon: Vault, color: 'text-cyber-green', href: '/dashboard/live-vault' },
      { label: 'Card Vault', icon: CreditCard, color: 'text-cyber-blue', href: '/dashboard/card-vault' },
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
