'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu } from 'lucide-react';

interface HeaderProps {
  onActionClick?: () => void;
  actionLabel?: string;
  onToggleMobileSidebar?: () => void;
}

export function Header({ onActionClick, actionLabel = '+ Add New Staff', onToggleMobileSidebar }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname.startsWith('/employees/') && pathname !== '/employees') {
      return { section: 'Manage Staff', current: 'Staff Profile' };
    }

    switch (pathname) {
      case '/dashboard':
        return { section: 'Daily Operation', current: 'Dashboard' };
      case '/employees':
        return { section: 'Manage Staff', current: 'Staff Directory' };
      case '/attendance':
        return { section: 'Daily Operation', current: 'Attendance Logs' };
      case '/leaves':
        return { section: 'Daily Operation', current: 'Leave Inquiries' };
      case '/payroll':
        return { section: 'Accounting', current: 'Payroll & Wages' };
      case '/analytics':
        return { section: 'Intelligence', current: 'HR Analytics' };
      default:
        return { section: 'Manage Staff', current: 'Overview' };
    }
  };

  const { section, current } = getBreadcrumbs();

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-[#EAECF0] bg-white sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[13px] text-[#535862]">
          <Link href="/dashboard" className="text-slate-400 hover:text-[#2D7A58] transition-colors">
            <Home className="w-3.5 h-3.5" />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium hidden sm:inline">{section}</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-[#181D27] font-semibold">{current}</span>
        </nav>
      </div>

      {/* Top Right Action Button (Cleaned: removed unwanted three-dots button) */}
      {onActionClick && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </header>
  );
}
