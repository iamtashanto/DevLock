import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  Settings,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export const LICENSE_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
  TRIAL: 'trial',
} as const;

export const LICENSE_TYPES = {
  PERPETUAL: 'perpetual',
  SUBSCRIPTION: 'subscription',
  TRIAL: 'trial',
  NODE_LOCKED: 'node-locked',
  FLOATING: 'floating',
} as const;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
  BILLING: 'billing',
} as const;

export const PLAN_NAMES = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    permission: 'project:read',
  },
  {
    title: 'Analytics',
    href: '/projects',
    icon: BarChart3,
    permission: 'analytics:read',
  },
];

export const ORG_NAV_ITEMS: NavItem[] = [
  {
    title: 'Organization',
    href: '/organization',
    icon: Shield,
    permission: 'org:read',
  },
  {
    title: 'Members',
    href: '/organization/members',
    icon: Users,
    permission: 'org:manage_members',
  },
  {
    title: 'Billing',
    href: '/organization/billing',
    icon: CreditCard,
    permission: 'org:manage_billing',
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const PROJECT_TABS = [
  { title: 'Overview', href: '' },
  { title: 'Licenses', href: '/licenses' },
  { title: 'Config', href: '/config' },
  { title: 'Flags', href: '/flags' },
  { title: 'Domains', href: '/domains' },
  { title: 'Analytics', href: '/analytics' },
  { title: 'Settings', href: '/settings' },
] as const;
