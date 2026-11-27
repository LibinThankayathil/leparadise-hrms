'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  CreditCard,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  user?: {
    role?: string;
  } | null;
  onOpenMenu?: () => void;
}

export function MobileBottomNav({ user: userProp, onOpenMenu }: MobileBottomNavProps = {}) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const user = userProp ?? authUser;

  if (!user || pathname === '/login' || pathname === '/') {
    return null;
  }

  const isStaff = user?.role === 'EMPLOYEE';

  const navItems = isStaff
    ? [
        { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Attendance', href: '/attendance', icon: Clock },
        { label: 'Leaves', href: '/leaves', icon: CalendarDays },
        { label: 'Payslips', href: '/payroll', icon: CreditCard },
      ]
    : [
        { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Staff', href: '/employees', icon: Users },
        { label: 'Attendance', href: '/attendance', icon: Clock },
        { label: 'Leaves', href: '/leaves', icon: CalendarDays },
      ];

  const isRouteActive = (href: string) => {
    if (href === '/employees') {
      return pathname === '/employees' || pathname.startsWith('/employees/');
    }
    return pathname === href;
  };

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md"
    >
      <div className="flex items-center justify-around gap-1 px-2 py-1.5 rounded-full bg-white/65 backdrop-blur-xl backdrop-saturate-150 border border-white/80 ring-1 ring-slate-900/5 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-full transition-all min-h-[44px] min-w-0',
                active
                  ? 'bg-[#2D7A58] text-white shadow-[0_2px_10px_rgba(45,122,88,0.35)]'
                  : 'text-[#414651] hover:text-[#181D27] hover:bg-slate-900/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-medium mt-0.5 leading-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

