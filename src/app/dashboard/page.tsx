'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Building2, 
  Clock, 
  CalendarCheck, 
  Clock4,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'EMPLOYEE';

  const [stats, setStats] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, attRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/attendance'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClock = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setClockLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update attendance');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClockLoading(false);
    }
  };

  const todayRecord = attendance?.todayRecord;
  const isClockedIn = !!todayRecord?.clockIn;
  const isClockedOut = !!todayRecord?.clockOut;

  return (
    <DashboardLayout actionLabel="Daily Operations">
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                Real-time workspace statistics, attendance activity, and department status
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#FAFBFB] px-3.5 py-1.5 rounded-lg border border-[#EAECF0] shadow-subtle text-xs font-medium text-[#535862] w-fit">
            <Clock4 className="w-3.5 h-3.5 text-[#2D7A58] animate-pulse" />
            <span>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Metric Cards Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Total Staff</p>
              <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.totalEmployees ?? '12'}</h3>
              <p className="text-[11px] text-[#2D7A58] font-medium mt-1">Active Staff Contracts</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">
                {isStaff ? 'My Shift Today' : 'Present Today'}
              </p>
              <h3 className="text-2xl font-bold text-[#181D27] mt-1">
                {isStaff 
                  ? (isClockedIn ? 'Clocked In' : 'Not Logged') 
                  : (stats?.todayAttendanceCount ?? '8')}
              </h3>
              <p className="text-[11px] text-[#2D7A58] font-medium mt-1">
                {isStaff ? (isClockedOut ? 'Shift Completed' : 'Self-Check In') : 'Logged Check-ins'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">
                {isStaff ? 'My Pending Requests' : 'Pending Leaves'}
              </p>
              <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.pendingLeavesCount ?? '0'}</h3>
              <p className="text-[11px] text-[#B93815] font-medium mt-1">Awaiting Decision</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEF6EE] text-[#B93815] flex items-center justify-center border border-[#F9DBAF]">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Departments</p>
              <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.totalDepartments ?? '5'}</h3>
              <p className="text-[11px] text-[#2D7A58] font-medium mt-1">Hotel Divisions</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Daily Attendance Clock Widget */}
          <div className="bg-[#FAFBFB] p-6 rounded-xl border border-[#EAECF0] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D7A58]">Self Service</span>
                <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-[#EAECF0] text-[#535862] font-medium">
                  Daily Clock
                </span>
              </div>
              <h3 className="text-base font-bold text-[#181D27] mt-2">Attendance Check-In</h3>
              <p className="text-xs text-[#717680] mt-1">
                Log your shift attendance and work duration timestamp.
              </p>

              <div className="mt-5 bg-white p-3.5 rounded-lg border border-[#EAECF0] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#717680]">Clock In:</span>
                  <span className="font-semibold text-[#181D27]">
                    {todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString() : 'Not clocked in'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#717680]">Clock Out:</span>
                  <span className="font-semibold text-[#181D27]">
                    {todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString() : 'Not clocked out'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                disabled={clockLoading || isClockedIn}
                onClick={() => handleClock('CLOCK_IN')}
                className="flex-1 py-2 px-3 rounded-lg bg-[#2D7A58] hover:bg-[#256549] text-white font-semibold text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle cursor-pointer"
              >
                {isClockedIn ? 'Clocked In' : 'Clock In Now'}
              </button>
              <button
                type="button"
                disabled={clockLoading || !isClockedIn || isClockedOut}
                onClick={() => handleClock('CLOCK_OUT')}
                className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-[#344054] border border-[#EAECF0] font-semibold text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle cursor-pointer"
              >
                {isClockedOut ? 'Clocked Out' : 'Clock Out'}
              </button>
            </div>
          </div>

          {/* Recent Inquiries List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
                <div>
                  <h3 className="font-bold text-[#181D27] text-sm">
                    {isStaff ? 'My Recent Leave Inquiries' : 'Recent Staff Inquiries'}
                  </h3>
                  <p className="text-xs text-[#717680]">
                    {isStaff ? 'Status of your submitted time-off requests' : 'Latest staff leave and shift notifications'}
                  </p>
                </div>
                <Link
                  href="/leaves"
                  className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-[#EAECF0]">
                {stats?.recentLeaves && stats.recentLeaves.length > 0 ? (
                  stats.recentLeaves.map((leave: any) => (
                    <div key={leave.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#181D27]">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </p>
                          <p className="text-[11px] text-[#717680]">
                            {leave.leaveType?.name} &bull; {Number(leave.daysCount)} day(s)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            leave.status === 'APPROVED'
                              ? 'bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]'
                              : leave.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]'
                          }`}
                        >
                          {leave.status}
                        </span>
                        <p className="text-[11px] text-[#717680] mt-0.5">{formatDate(leave.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No active staff leave inquiries at the moment.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAECF0] grid grid-cols-1 sm:grid-cols-3 gap-2">
              {isStaff ? (
                <>
                  <Link
                    href="/leaves"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    Request Leave &rarr;
                  </Link>
                  <Link
                    href="/attendance"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    Attendance Logs &rarr;
                  </Link>
                  <Link
                    href="/payroll"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    My Payslips &rarr;
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/employees"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    Staff Directory &rarr;
                  </Link>
                  <Link
                    href="/attendance"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    Attendance Logs &rarr;
                  </Link>
                  <Link
                    href="/payroll"
                    className="p-2 rounded-lg bg-[#FAFBFB] hover:bg-slate-100 text-[#344054] text-xs font-semibold text-center border border-[#EAECF0] transition-all"
                  >
                    Payroll & Wages &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
