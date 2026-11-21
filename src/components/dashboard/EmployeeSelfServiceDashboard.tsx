'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  ArrowUpRight, 
  ChevronRight, 
  Printer, 
  X, 
  Loader2, 
  UserCheck, 
  Timer,
  CalendarCheck,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { InlineLoader } from '@/components/LoadingScreen';
import { formatCurrency, formatDate } from '@/lib/utils';

export function EmployeeSelfServiceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Payslip Modal State
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/employee/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.leaveTypes && d.leaveTypes.length > 0 && !leaveForm.leaveTypeId) {
          setLeaveForm((prev) => ({ ...prev, leaveTypeId: d.leaveTypes[0].id }));
        }
      }
    } catch (e) {
      console.error('Failed to load employee self-service data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleClock = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setClockLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();
      if (!res.ok) {
        setToastMessage(result.error || 'Attendance action failed');
      } else {
        setToastMessage(
          action === 'CLOCK_IN' 
            ? 'Successfully clocked in for today!' 
            : 'Successfully clocked out. Have a great day!'
        );
        await loadDashboard();
      }
    } catch (e) {
      console.error(e);
      setToastMessage('An error occurred updating attendance.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSubmitting(true);

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });

      const d = await res.json();
      if (!res.ok) {
        setLeaveError(d.error || 'Failed to submit leave application');
        setLeaveSubmitting(false);
        return;
      }

      setShowLeaveModal(false);
      setToastMessage('Leave application submitted successfully for manager review');
      setLeaveForm({
        leaveTypeId: data?.leaveTypes?.[0]?.id || '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      loadDashboard();
    } catch (err) {
      console.error(err);
      setLeaveError('An unexpected error occurred while submitting.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <InlineLoader message="Loading your Self-Service workspace..." />
      </div>
    );
  }

  const profile = data?.profile;
  const todayRecord = data?.todayAttendance;
  const isClockedIn = !!todayRecord?.clockIn;
  const isClockedOut = !!todayRecord?.clockOut;
  const monthStats = data?.monthAttendanceStats || { totalLogged: 0, presentCount: 0, lateCount: 0 };
  const leaveBalances: any[] = data?.leaveBalances || [];
  const recentLeaves: any[] = data?.recentLeaves || [];
  const latestPayslip = data?.latestPayslip;

  // Calculate total leave remaining across all balances
  const totalLeaveAvailable = leaveBalances.reduce(
    (acc, b) => acc + Math.max(0, b.totalDays - b.usedDays),
    0
  );

  // Time of day greeting
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Calculate live elapsed shift duration if clocked in and not clocked out
  let elapsedShiftText = '';
  if (isClockedIn && !isClockedOut && todayRecord?.clockIn) {
    const diffMs = currentTime.getTime() - new Date(todayRecord.clockIn).getTime();
    if (diffMs > 0) {
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      elapsedShiftText = `${hrs}h ${mins}m elapsed`;
    }
  }

  // Calculate estimated days in selected leave form
  let formDaysCount = 0;
  if (leaveForm.startDate && leaveForm.endDate) {
    const s = new Date(leaveForm.startDate);
    const e = new Date(leaveForm.endDate);
    if (e >= s) {
      formDaysCount = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const selectedBalance = leaveBalances.find((b) => b.leaveTypeId === leaveForm.leaveTypeId);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-[#EAF6ED] border border-[#D1EBD9] text-[#2D7A58] rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D7A58]" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#2D7A58] hover:opacity-75 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Profile Welcome Banner */}
      <div className="bg-gradient-to-r from-[#181D27] to-[#252B37] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/15 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.firstName}_${profile?.lastName}`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                Self-Service Portal
              </span>
              <span className="text-xs text-slate-400">
                Staff ID #{profile?.employeeCode?.replace(/\D/g, '') || profile?.employeeCode}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {greeting}, {profile?.firstName}!
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{profile?.designation || 'Staff Associate'}</span>
              <span>&bull;</span>
              <span className="text-slate-300">{profile?.department?.name || 'General Operations'}</span>
              {profile?.manager && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-400">
                    Supervisor: {profile.manager.firstName} {profile.manager.lastName}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Status Badge */}
        <div className="flex flex-col sm:items-end justify-center relative z-10 shrink-0">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-inner backdrop-blur-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-300">Employment Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {profile?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top 4 Metric Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Shift */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Today&apos;s Shift</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1">
              {isClockedOut ? 'Shift Completed' : isClockedIn ? 'On Duty' : 'Not Clocked In'}
            </h3>
            <p className="text-[11px] text-[#2D7A58] font-medium mt-1 truncate max-w-[170px]">
              {isClockedOut 
                ? `Out at ${new Date(todayRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : isClockedIn 
                ? (elapsedShiftText || `Since ${new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                : 'Self-Punch Required'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Leave Balance */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Leave Quota</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1">
              {totalLeaveAvailable} Days
            </h3>
            <p className="text-[11px] text-[#2D7A58] font-medium mt-1">
              Available this year
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Monthly Attendance */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Monthly Attendance</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1">
              {monthStats.presentCount + monthStats.lateCount} Days
            </h3>
            <p className="text-[11px] text-[#535862] font-medium mt-1">
              {monthStats.lateCount > 0 ? `${monthStats.lateCount} late arrival(s)` : '100% on-time record'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F4F6F5] text-[#181D27] flex items-center justify-center border border-[#EAECF0] shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Latest Net Pay */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Latest Net Salary</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1">
              {latestPayslip ? formatCurrency(latestPayslip.netSalary) : formatCurrency(profile?.baseSalary ? Number(profile.baseSalary) / 12 : 1400)}
            </h3>
            <p className="text-[11px] text-[#2D7A58] font-medium mt-1">
              {latestPayslip ? `Month ${latestPayslip.month}/${latestPayslip.year} • ${latestPayslip.status}` : 'Current Monthly Base'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Center Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Daily Shift Punch & Leave Progress */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Attendance Clock Station */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181D27]">Shift Attendance Station</h3>
                  <p className="text-[11px] text-[#717680]">Record shift punch in/out timestamps</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isClockedOut 
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : isClockedIn 
                  ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]' 
                  : 'bg-[#FEF6EE] text-[#B93815] border-[#F9DBAF]'
              }`}>
                {isClockedOut ? 'Shift Ended' : isClockedIn ? 'Clocked In' : 'Pending Check-In'}
              </span>
            </div>

            {/* Time Stamp Card */}
            <div className="mt-4 p-4 rounded-xl bg-[#FAFBFB] border border-[#EAECF0] text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#717680]">Live Server Time</span>
              <div className="text-3xl font-extrabold text-[#181D27] font-mono tracking-tight my-1">
                {currentTime.toLocaleTimeString()}
              </div>
              <p className="text-xs text-[#535862]">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Punch Details Breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-[#EAECF0] bg-white">
                <span className="text-[#717680] block text-[11px]">Clock-In Time:</span>
                <span className="font-semibold text-[#181D27] mt-0.5 block text-[13px]">
                  {todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
                {todayRecord?.status === 'LATE' && (
                  <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Recorded as Late</span>
                )}
              </div>
              <div className="p-3 rounded-lg border border-[#EAECF0] bg-white">
                <span className="text-[#717680] block text-[11px]">Clock-Out Time:</span>
                <span className="font-semibold text-[#181D27] mt-0.5 block text-[13px]">
                  {todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
                {elapsedShiftText && (
                  <span className="text-[10px] text-[#2D7A58] font-semibold mt-0.5 block">{elapsedShiftText}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                disabled={clockLoading || isClockedIn}
                onClick={() => handleClock('CLOCK_IN')}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#2D7A58] hover:bg-[#256549] text-white font-semibold text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {clockLoading && !isClockedIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isClockedIn ? 'Clocked In' : 'Clock In Now'}</span>
              </button>
              <button
                type="button"
                disabled={clockLoading || !isClockedIn || isClockedOut}
                onClick={() => handleClock('CLOCK_OUT')}
                className="flex-1 py-2.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-[#344054] border border-[#EAECF0] font-semibold text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle cursor-pointer flex items-center justify-center gap-1.5"
              >
                {clockLoading && isClockedIn && !isClockedOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isClockedOut ? 'Clocked Out' : 'Clock Out'}</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-[#EAECF0] flex items-center justify-between text-xs">
              <span className="text-[#717680] text-[11px]">View full check-in history</span>
              <Link
                href="/attendance"
                className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] inline-flex items-center gap-1"
              >
                Full Logs <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Leave Quota Progress Gauges */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div>
                <h3 className="text-sm font-bold text-[#181D27]">Leave Quotas ({currentTime.getFullYear()})</h3>
                <p className="text-[11px] text-[#717680]">Allocated days and utilized quotas</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] inline-flex items-center gap-1 cursor-pointer"
              >
                + Request <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {leaveBalances.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No leave balance records found.</p>
              ) : (
                leaveBalances.map((b) => {
                  const used = b.usedDays || 0;
                  const total = b.totalDays || 1;
                  const remaining = Math.max(0, total - used);
                  const pct = Math.min(100, Math.round((used / total) * 100));

                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#181D27]">{b.leaveType?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#717680]">
                            {used} of {total} used
                          </span>
                          <span className="font-semibold text-[#2D7A58] bg-[#EAF6ED] border border-[#D1EBD9] px-1.5 py-0.2 rounded text-[11px]">
                            {remaining} left
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#EAECF0] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2D7A58] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Leave Status & Compensation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Leave Inquiries */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div>
                <h3 className="text-sm font-bold text-[#181D27]">My Time-Off Requests</h3>
                <p className="text-[11px] text-[#717680]">Track approval status from management</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>+ Apply Leave</span>
                </button>
              </div>
            </div>

            <div className="mt-3 divide-y divide-[#EAECF0]">
              {recentLeaves.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <CalendarDays className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                  <p>No leave requests submitted yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(true)}
                    className="text-[#2D7A58] font-semibold text-xs mt-1 inline-block hover:underline cursor-pointer"
                  >
                    Submit your first request
                  </button>
                </div>
              ) : (
                recentLeaves.map((leave) => {
                  const isApproved = leave.status === 'APPROVED';
                  const isRejected = leave.status === 'REJECTED';
                  const isPending = leave.status === 'PENDING';

                  return (
                    <div key={leave.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isApproved ? 'bg-[#EAF6ED] text-[#2D7A58]' : isRejected ? 'bg-rose-50 text-rose-700' : 'bg-[#FEF6EE] text-[#B93815]'
                        }`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#181D27]">
                            {leave.leaveType?.name || 'Leave'}{' '}
                            <span className="text-[#717680] font-normal">&bull; {Number(leave.daysCount)} day(s)</span>
                          </p>
                          <p className="text-[11px] text-[#535862] mt-0.5">
                            {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                          </p>
                          {leave.reason && (
                            <p className="text-[11px] text-[#717680] italic mt-0.5 truncate max-w-sm">
                              &ldquo;{leave.reason}&rdquo;
                            </p>
                          )}
                          {leave.reviewComment && (
                            <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                              <span className="font-semibold">Manager note:</span> {leave.reviewComment}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isApproved
                            ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-[#FEF6EE] text-[#B93815] border-[#F9DBAF]'
                        }`}>
                          {leave.status}
                        </span>
                        <p className="text-[10px] text-[#717680] mt-1">Submitted {formatDate(leave.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between text-xs">
              <span className="text-[#717680] text-[11px]">View full leave balance and requests</span>
              <Link
                href="/leaves"
                className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] inline-flex items-center gap-1"
              >
                All Inquiries <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Latest Compensation & Payslip Snapshot */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div>
                <h3 className="text-sm font-bold text-[#181D27]">Compensation & Latest Payslip</h3>
                <p className="text-[11px] text-[#717680]">Verified monthly payroll slip and net earnings</p>
              </div>
              <Link
                href="/payroll"
                className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] inline-flex items-center gap-1"
              >
                All Payslips <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {latestPayslip ? (
              <div className="mt-4 p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAECF0]">
                  <div>
                    <span className="text-[11px] text-[#717680] uppercase tracking-wider font-semibold">Pay Period</span>
                    <h4 className="text-base font-bold text-[#181D27] mt-0.5">
                      {new Date(latestPayslip.year, latestPayslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      latestPayslip.status === 'PAID'
                        ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {latestPayslip.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPayslipModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#EAECF0] hover:border-slate-300 rounded-lg text-xs font-semibold text-[#344054] shadow-subtle transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Breakdown</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#717680] text-[11px] block">Basic Pay</span>
                    <span className="font-semibold text-[#181D27] text-[13px]">{formatCurrency(latestPayslip.basicSalary)}</span>
                  </div>
                  <div>
                    <span className="text-[#717680] text-[11px] block">Allowances</span>
                    <span className="font-semibold text-emerald-700 text-[13px]">+{formatCurrency(latestPayslip.allowances)}</span>
                  </div>
                  <div>
                    <span className="text-[#717680] text-[11px] block">Deductions</span>
                    <span className="font-semibold text-rose-700 text-[13px]">-{formatCurrency(latestPayslip.deductions)}</span>
                  </div>
                  <div>
                    <span className="text-[#717680] text-[11px] block">Net Take-Home</span>
                    <span className="font-bold text-[#2D7A58] text-[14px]">{formatCurrency(latestPayslip.netSalary)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB] text-center text-xs text-[#717680]">
                <CreditCard className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>No generated payslips yet for this period.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Your monthly base wage is {formatCurrency(profile?.baseSalary ? Number(profile.baseSalary) / 12 : 1400)}.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Request Leave In-Dashboard Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#EAECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#181D27]">Request Time Off</h3>
                  <p className="text-[11px] text-[#717680]">Submit a leave inquiry for manager review</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {leaveError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {leaveError}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Leave Category *</label>
                <select
                  required
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                >
                  {data?.leaveTypes?.map((lt: any) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.defaultDays} default days/yr)
                    </option>
                  ))}
                </select>
                {selectedBalance && (
                  <p className="text-[11px] text-[#2D7A58] mt-1 font-medium">
                    You have {Math.max(0, selectedBalance.totalDays - selectedBalance.usedDays)} of {selectedBalance.totalDays} days available for this category.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  />
                </div>
              </div>

              {formDaysCount > 0 && (
                <div className="p-2.5 rounded-lg bg-[#FAFBFB] border border-[#EAECF0] text-xs flex items-center justify-between text-[#535862]">
                  <span>Calculated Time-Off Duration:</span>
                  <span className="font-bold text-[#181D27]">{formDaysCount} day{formDaysCount > 1 ? 's' : ''}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Reason / Purpose *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the reason for this time-off request..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-[#EAECF0] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {leaveSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Leave Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Payslip Detail Modal */}
      {showPayslipModal && latestPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EAECF0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#181D27]">Salary Payslip Statement</h3>
                  <p className="text-[11px] text-[#717680]">
                    {new Date(latestPayslip.year, latestPayslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#717680]">Employee Name:</span>
                <span className="font-semibold text-[#181D27]">{profile?.firstName} {profile?.lastName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#717680]">Staff Code:</span>
                <span className="font-mono text-[#181D27]">#{profile?.employeeCode}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#717680]">Designation & Dept:</span>
                <span className="text-[#181D27]">{profile?.designation} ({profile?.department?.name})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#717680]">Status:</span>
                <span className="font-semibold text-[#2D7A58] bg-[#EAF6ED] border border-[#D1EBD9] px-2 py-0.5 rounded text-[11px]">
                  {latestPayslip.status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs divide-y divide-[#EAECF0]">
              <div className="flex justify-between py-1.5">
                <span className="text-[#535862]">Basic Monthly Salary</span>
                <span className="font-semibold text-[#181D27]">{formatCurrency(latestPayslip.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#535862]">Allowances & Bonuses</span>
                <span className="font-semibold text-emerald-700">+{formatCurrency(latestPayslip.allowances)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#535862]">Statutory Deductions & Taxes</span>
                <span className="font-semibold text-rose-700">-{formatCurrency(latestPayslip.deductions)}</span>
              </div>
              <div className="flex justify-between py-2.5 font-bold text-sm bg-[#FAFBFB] px-3 rounded-lg border border-[#EAECF0] mt-2">
                <span className="text-[#181D27]">Net Disbursed Take-Home</span>
                <span className="text-[#2D7A58] font-mono text-base">{formatCurrency(latestPayslip.netSalary)}</span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#EAECF0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPayslipModal(false)}
                className="px-4 py-2 border border-[#EAECF0] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#181D27] hover:bg-black text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

