'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  ChevronRight,
  Timer,
  UserCheck,
  Sun,
  Sunset,
  Moon
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

  // Live elapsed shift duration calculation
  let elapsedFormatted = '00:00:00';
  let elapsedShiftText = '';
  if (isClockedIn && todayRecord?.clockIn) {
    const startTime = new Date(todayRecord.clockIn).getTime();
    const endTime = isClockedOut && todayRecord?.clockOut ? new Date(todayRecord.clockOut).getTime() : currentTime.getTime();
    const diffMs = Math.max(0, endTime - startTime);
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    elapsedFormatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    elapsedShiftText = `${hrs}h ${mins}m`;
  }

  // Greeting logic
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const GreetingIcon = hour < 12 ? Sun : hour < 17 ? Sunset : Moon;
  const firstName = user?.employee?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <DashboardLayout actionLabel="Daily Operations">
      <div className="space-y-6">
        {/* Hero Greeting Header */}
        <div className="relative overflow-hidden rounded-2xl border border-[#EAECF0] bg-gradient-to-br from-[#EAF6ED]/75 via-white to-[#FAFBFB] p-5 sm:p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2D7A58] text-white flex items-center justify-center shadow-sm shrink-0">
                <GreetingIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D7A58] bg-[#EAF6ED] border border-[#D1EBD9] px-2 py-0.5 rounded-full">
                    {isStaff ? 'Staff Portal' : 'Manager Overview'}
                  </span>
                  {user?.employee?.designation && (
                    <span className="text-[11px] font-medium text-[#717680] hidden sm:inline">
                      &bull; {user.employee.designation}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight leading-snug">
                  {greeting}, {firstName}
                </h1>
                <p className="text-xs text-[#717680] mt-0.5">
                  {isStaff
                    ? 'Your shift status, attendance timeline, and pending requests'
                    : 'Real-time workspace statistics and attendance activity'}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-[#EAECF0] shadow-subtle text-xs font-medium text-[#535862] w-fit shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#2D7A58] animate-pulse shrink-0" />
              <span>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-mono font-semibold text-[#181D27] tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid - Responsive */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaff ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {isStaff ? (
            <>
              {/* Staff Card 1: My Shift Today */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">My Shift Today</p>
                  <h3 className="text-xl font-bold text-[#181D27] mt-1">
                    {isClockedOut ? 'Shift Completed' : isClockedIn ? 'On Duty' : 'Not Logged'}
                  </h3>
                  <p className="text-[11px] text-[#2D7A58] font-medium mt-1 truncate max-w-[170px]">
                    {isClockedOut 
                      ? 'Shift Completed' 
                      : isClockedIn 
                      ? `In at ${new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Self-Check In Required'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Staff Card 2: Live Shift Duration */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Live Shift Duration</p>
                    {isClockedIn && !isClockedOut && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#181D27] font-mono tracking-tight mt-1">
                    {isClockedIn ? elapsedFormatted : '00:00:00'}
                  </h3>
                  <p className="text-[11px] text-[#2D7A58] font-medium mt-1 truncate max-w-[170px]">
                    {isClockedOut 
                      ? `Total logged: ${elapsedShiftText}` 
                      : isClockedIn 
                      ? 'Active shift timer' 
                      : 'Clock in to start timer'}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                  isClockedIn && !isClockedOut
                    ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]'
                    : 'bg-[#FAFBFB] text-slate-400 border-[#EAECF0]'
                }`}>
                  <Timer className={`w-5 h-5 ${isClockedIn && !isClockedOut ? 'animate-pulse' : ''}`} />
                </div>
              </div>

              {/* Staff Card 3: Monthly Punctuality Health */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Monthly Punctuality</p>
                  <h3 className="text-xl font-bold text-[#181D27] mt-1">
                    {stats?.monthStats?.onTimeRate ?? 100}% On-Time
                  </h3>
                  <p className="text-[11px] text-[#535862] font-medium mt-1 truncate max-w-[170px]">
                    {stats?.monthStats?.totalLogged ?? 0} days recorded ({stats?.monthStats?.lateCount ?? 0} late)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Staff Card 4: My Pending Requests */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">My Pending Requests</p>
                  <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.pendingLeavesCount ?? '0'}</h3>
                  <p className="text-[11px] text-[#B93815] font-medium mt-1">Awaiting Decision</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#FEF6EE] text-[#B93815] flex items-center justify-center border border-[#F9DBAF] shrink-0">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manager Card 1 */}
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

              {/* Manager Card 2 */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Present Today</p>
                  <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.todayAttendanceCount ?? '8'}</h3>
                  <p className="text-[11px] text-[#2D7A58] font-medium mt-1">Logged Check-ins</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Manager Card 3 */}
              <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Pending Leaves</p>
                  <h3 className="text-2xl font-bold text-[#181D27] mt-1">{stats?.pendingLeavesCount ?? '0'}</h3>
                  <p className="text-[11px] text-[#B93815] font-medium mt-1">Awaiting Decision</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#FEF6EE] text-[#B93815] flex items-center justify-center border border-[#F9DBAF]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
            </>
          )}
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
                {isStaff && isClockedIn && (
                  <div className="flex justify-between items-center pt-2 border-t border-[#EAECF0]">
                    <span className="text-[#717680] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isClockedOut ? 'bg-slate-300' : 'bg-[#2D7A58] animate-pulse'}`} />
                      Shift Duration:
                    </span>
                    <span className="font-mono font-bold text-[#2D7A58]">
                      {elapsedFormatted}
                    </span>
                  </div>
                )}
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
