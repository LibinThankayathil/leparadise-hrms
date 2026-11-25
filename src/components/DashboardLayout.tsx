'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { LoadingScreen } from './LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only show the animated emblem loader on initial cold boot if user is not yet known
  if (loading && !user) {
    return <LoadingScreen message="Loading Le Paradise HRMS..." />;
  }

  return (
    <div className="min-h-screen w-full bg-white flex font-sans antialiased overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Sidebar (Responsive Drawer on mobile, Fixed column on desktop) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar user={user} onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area - Fullscreen 100% width and height without breadcrumb header */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-white">
        {/* Mobile-only toggle bar (Header is completely removed on desktop) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#EAECF0] bg-white sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/le-Logo.svg" alt="Le Paradise" className="h-6 w-auto" />
          <div className="w-8" />
        </div>

        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 md:pb-8 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating Bottom Navigation Pill (Mobile only) */}
      <MobileBottomNav user={user} onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}
