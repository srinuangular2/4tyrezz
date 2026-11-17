import {
  Bell,
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  GitCompare,
  Heart,
  Landmark,
  LifeBuoy,
  Package,
  Search,
  Shield,
  ShoppingCart,
  User,
} from 'lucide-react';
import { SHOW_TEST_DRIVE } from './featureFlags';

export const ICON_TONES = {
  blue: 'from-[#6cb2ff] to-[#1853ff]',
  orange: 'from-[#ffb067] to-[#f97316]',
  emerald: 'from-[#5ee08a] to-[#0e9f55]',
  violet: 'from-[#c4a1ff] to-[#7c3aed]',
  rose: 'from-[#ff9bb5] to-[#e11d48]',
  cyan: 'from-[#7eebff] to-[#0891b2]',
  amber: 'from-[#ffe08a] to-[#f59e0b]',
  indigo: 'from-[#b7c2ff] to-[#4f46e5]',
};

const TEST_DRIVE = {
  to: '/profile/test-drives',
  label: 'My Test Drives',
  description: 'Home and dealership drives you booked',
  icon: ClipboardCheck,
  emoji: '🚘',
  tone: 'blue',
  tile: 'from-[#d9ecff] to-[#f3f9ff]',
  titles: ['my test drives'],
};

const GROUPS = [
  {
    label: 'Account',
    items: [
      {
        to: '/profile/settings',
        label: 'My Profile',
        description: 'Name, contact details and preferences',
        icon: User,
        emoji: '👤',
        tone: 'blue',
        tile: 'from-[#dbeafe] to-[#f4f9ff]',
        titles: ['my profile'],
      },
      {
        to: '/profile/notifications',
        label: 'Notifications',
        description: 'Price drops, matches and account alerts',
        icon: Bell,
        emoji: '🔔',
        tone: 'indigo',
        tile: 'from-[#e0e7ff] to-[#f5f7ff]',
        titles: ['notifications'],
      },
      {
        to: '/profile/support-tickets',
        label: 'Support',
        description: 'Questions and tickets with the 4tyrezz desk',
        icon: LifeBuoy,
        emoji: '💬',
        tone: 'cyan',
        tile: 'from-[#ccfbf1] to-[#f0fdfa]',
        titles: ['support tickets', 'support'],
      },
    ],
  },
  {
    label: 'Buying',
    items: [
      {
        to: '/profile/orders',
        label: 'My Orders',
        description: 'Token bookings and car purchases',
        icon: Package,
        emoji: '🧾',
        tone: 'orange',
        tile: 'from-[#ffe8d6] to-[#fff6ee]',
        titles: ['my orders'],
      },
      {
        to: '/profile/cart',
        label: 'My Cart',
        description: 'Cars you added and are ready to buy',
        icon: ShoppingCart,
        emoji: '🛒',
        tone: 'blue',
        tile: 'from-[#dbeafe] to-[#eef6ff]',
        titles: ['my cart'],
      },
      {
        to: '/profile/wishlist',
        label: 'Wishlist',
        description: 'Cars you shortlisted to revisit',
        icon: Heart,
        emoji: '❤️',
        tone: 'rose',
        tile: 'from-[#ffe0ea] to-[#fff7f9]',
        titles: ['wishlist', 'shortlisted vehicles'],
      },
      {
        to: '/profile/enquiries',
        label: 'Enquiries',
        description: 'Questions you sent about cars for sale',
        icon: ClipboardList,
        emoji: '📋',
        tone: 'orange',
        tile: 'from-[#ffe8d6] to-[#fff6ee]',
        titles: ['my enquiries', 'enquiries'],
      },
      {
        to: '/profile/saved-searches',
        label: 'Saved Searches',
        description: 'Saved filters and new-match alerts',
        icon: Search,
        emoji: '🔍',
        tone: 'emerald',
        tile: 'from-[#d8f6ea] to-[#f3fff8]',
        titles: ['saved searches', 'my saved searches'],
      },
      {
        to: '/profile/comparisons',
        label: 'Comparisons',
        description: 'Cars you saved side by side',
        icon: GitCompare,
        emoji: '⚖️',
        tone: 'violet',
        tile: 'from-[#efe4ff] to-[#faf7ff]',
        titles: ['comparisons', 'my comparisons'],
      },
      ...(SHOW_TEST_DRIVE ? [TEST_DRIVE] : []),
    ],
  },
  {
    label: 'Services',
    items: [
      {
        to: '/profile/my-vehicles',
        label: 'My Vehicles',
        description: 'Cars you are selling, photos and edits',
        icon: BadgeCheck,
        emoji: '🚗',
        tone: 'emerald',
        tile: 'from-[#d8f6ea] to-[#f3fff8]',
        titles: ['my vehicles'],
      },
      {
        to: '/profile/pdi',
        label: 'Car Inspection',
        description: 'Visit status and inspection reports',
        icon: ClipboardCheck,
        emoji: '✅',
        tone: 'cyan',
        tile: 'from-[#ccfbf1] to-[#f0fdfa]',
        titles: ['car inspection'],
      },
      {
        to: '/profile/finance-applications',
        label: 'Finance',
        description: 'Loan requests and their progress',
        icon: Landmark,
        emoji: '💰',
        tone: 'amber',
        tile: 'from-[#fef3c7] to-[#fffbeb]',
        titles: ['finance', 'finance applications'],
      },
      {
        to: '/profile/insurance-enquiries',
        label: 'Insurance',
        description: 'Quotes, add-ons and cover requests',
        icon: Shield,
        emoji: '🛡️',
        tone: 'rose',
        tile: 'from-[#fce7f3] to-[#fff7fb]',
        titles: ['insurance', 'insurance enquiries'],
      },
    ],
  },
];

export function accountGroups() {
  return GROUPS;
}

export function accountLinks() {
  return GROUPS.flatMap((group) => group.items);
}

export function findAccountLink(pathname) {
  return accountLinks().find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) || null;
}

export function AccountIcon({ icon: Icon, tone = 'blue', size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-9 w-9 rounded-xl';
  const glyph = size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-[0_8px_16px_rgba(24,83,255,0.16)] ${box} ${ICON_TONES[tone] || ICON_TONES.blue}`}>
      <Icon className={glyph} strokeWidth={2.1} />
    </span>
  );
}
