'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  CreditCard, 
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Permissions } from '@/lib/permissions';

interface SidebarProps {
  user?: {
    email: string;
    role: string;
    employee?: {
      firstName: string;
      lastName: string;
      designation: string;
    } | null;
  } | null;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email?.split('@')[0] || 'Manager';

  const userRole = user?.role || 'MANAGER';
  const roleLabel = Permissions.getRoleLabel(userRole);
  const roleBadge = Permissions.getRoleBadgeColor(userRole);
  const isStaff = userRole === 'EMPLOYEE';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] flex flex-col h-full text-[#414651] select-none text-[13px] shadow-sm md:shadow-none">
      {/* 1. Logo & App Bar */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#EAECF0]">
        <div className="flex items-center">
          <img
            src="/le-Logo.svg"
            alt="Le Paradise"
            className="h-9 w-auto"
          />
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button 
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Hotel Property Badge */}
      <div className="p-3.5">
        <div className="bg-[#FAFBFB] border border-[#EAECF0] p-2.5 rounded-xl flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#EAF6ED] text-[#2D7A58] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D1EBD9]">
            LP
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-[#181D27] truncate leading-tight">
              Le Paradise Resort
            </div>
            <div className="text-[11px] text-[#717680] font-normal leading-tight">
              Human Resources Portal
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-1 space-y-4">
        {/* DAILY OPERATIONS */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold tracking-widest text-[#8F94A0] uppercase">
            Daily Operations
          </div>

          <div className="mt-1 space-y-0.5">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] transition-colors',
                pathname === '/dashboard'
                  ? 'bg-[#F4F6F5] text-[#181D27] font-semibold'
                  : 'text-[#535862] hover:bg-[#FAFBFB] hover:text-[#181D27]'
              )}
            >
              <LayoutDashboard className="w-4 h-4 text-[#717680]" />
              <span>Dashboard</span>
            </Link>

            {/* Attendance Logs */}
            <Link
              href="/attendance"
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] transition-colors',
                pathname === '/attendance'
                  ? 'bg-[#F4F6F5] text-[#181D27] font-semibold'
                  : 'text-[#535862] hover:bg-[#FAFBFB] hover:text-[#181D27]'
              )}
            >
              <Clock className="w-4 h-4 text-[#717680]" />
              <span>Attendance Logs</span>
            </Link>

            {/* Leave Inquiries */}
            <Link
              href="/leaves"
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] transition-colors',
                pathname === '/leaves'
                  ? 'bg-[#F4F6F5] text-[#181D27] font-semibold'
                  : 'text-[#535862] hover:bg-[#FAFBFB] hover:text-[#181D27]'
              )}
            >
              <CalendarDays className="w-4 h-4 text-[#717680]" />
              <span>Leave Inquiries</span>
            </Link>
          </div>
        </div>

        {/* MANAGE STAFF (Hidden for regular employees) */}
        {!isStaff && (
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-widest text-[#8F94A0] uppercase">
              Staff Management
            </div>

            <div className="mt-1 space-y-0.5">
              <Link
                href="/employees"
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] transition-colors',
                  pathname.startsWith('/employees')
                    ? 'bg-[#F4F6F5] text-[#181D27] font-semibold'
                    : 'text-[#535862] hover:bg-[#FAFBFB] hover:text-[#181D27]'
                )}
              >
                <Users className="w-4 h-4 text-[#717680]" />
                <span>Staff Directory</span>
              </Link>
            </div>
          </div>
        )}

        {/* ACCOUNTING */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold tracking-widest text-[#8F94A0] uppercase">
            Finance & Compensation
          </div>

          <div className="mt-1 space-y-0.5">
            <Link
              href="/payroll"
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-[13px] transition-colors',
                pathname === '/payroll'
                  ? 'bg-[#F4F6F5] text-[#181D27] font-semibold'
                  : 'text-[#535862] hover:bg-[#FAFBFB] hover:text-[#181D27]'
              )}
            >
              <CreditCard className="w-4 h-4 text-[#717680]" />
              <span>{isStaff ? 'My Payslips' : 'Payroll & Wages'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom User Profile Card */}
      <div className="p-3.5 border-t border-[#EAECF0] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[#181D27] truncate leading-tight">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.2 rounded border', roleBadge.bg, roleBadge.text, roleBadge.border)}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
