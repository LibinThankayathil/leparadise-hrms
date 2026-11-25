'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  ChevronRight, 
  X, 
  Loader2, 
  UserCheck, 
  Timer,
  CalendarCheck,
  Calendar,
  Sparkles,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  User,
  CalendarRange
} from 'lucide-react';
import { InlineLoader } from '@/components/LoadingScreen';
import { formatDate } from '@/lib/utils';

export function EmployeeSelfServiceDashboard() {
  const [requestVersion, setRequestVersion] = useState(0);
  const [result, setResult] = useState<
    | { version: number; data: any; expiresAt: number }
    | { version: number; error: true }
    | null
  >(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const refreshDashboard = () => setRequestVersion((version) => version + 1);
  const currentResult = result?.version === requestVersion ? result : null;
  const loaded = currentResult && 'data' in currentResult ? currentResult : null;
  const expired = !!loaded && currentTime.getTime() >= loaded.expiresAt;

  useEffect(() => {
    if (expired) setRequestVersion((version) => version + 1);
  }, [expired]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const res = await fetch('/api/employee/dashboard', { signal: controller.signal });
        if (!res.ok) throw new Error(`Dashboard request failed: ${res.status}`);
        const data = await res.json();
        const expiresAt = Date.parse(data.nextAttendanceDayAt);
        if (!data.profile || !('todayAttendance' in data) || !Number.isFinite(expiresAt)) {
          throw new Error('Incomplete dashboard response');
        }
        if (!controller.signal.aborted) setResult({ version: requestVersion, data, expiresAt });
      } catch {
        if (!controller.signal.aborted) setResult({ version: requestVersion, error: true });
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [requestVersion]);

  const handleClock = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!loaded || expired || clockLoading) return;
    if (Date.now() >= loaded.expiresAt) {
      refreshDashboard();
      return;
    }
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
        refreshDashboard();
      }
    } catch (e) {
      console.error(e);
      setToastMessage('An error occurred updating attendance.');
    } finally {
      setClockLoading(false);
    }
  };

  if (currentResult && 'error' in currentResult) {
    return (
      <div className="py-24 text-center">
        <p role="alert">Could not load your Self-Service workspace.</p>
        <button type="button" onClick={refreshDashboard} className="mt-3 underline">Retry</button>
      </div>
    );
  }

  if (!loaded || expired) {
    return (
      <div className="py-24">
        <InlineLoader message="Loading your Self-Service workspace..." />
      </div>
    );
  }

  const { data } = loaded;
  const profile = data.profile;
  const initials = [profile.firstName, profile.lastName]
    .map((name) => (name?.trim() || '').slice(0, 1))
    .join('').toUpperCase();
  const todayRecord = data?.todayAttendance;
  const isClockedIn = !!todayRecord?.clockIn;
  const isClockedOut = !!todayRecord?.clockOut;
  const monthStats = data?.monthAttendanceStats || { totalLogged: 0, presentCount: 0, lateCount: 0 };
  const thisWeekAttendance: any[] = data?.thisWeekAttendance || [];

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

  // Generate last 7 days list for the weekly attendance activity strip
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

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
          <div aria-hidden="true" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/15 shrink-0 shadow-inner flex items-center justify-center text-lg font-bold">
            {initials}
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

      {/* 2. Top Metric Cards (Focusing strictly on Dashboard & Profile details) */}
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

        {/* Card 2: Monthly Attendance Record */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Attendance This Month</p>
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

        {/* Card 3: Assigned Work Shift Schedule */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Assigned Shift</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1">
              09:00 AM - 06:00 PM
            </h3>
            <p className="text-[11px] text-[#2D7A58] font-medium mt-1">
              Standard Operations • On-Site
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Reporting Supervisor */}
        <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">Reporting Supervisor</p>
            <h3 className="text-xl font-bold text-[#181D27] mt-1 truncate max-w-[170px]">
              {profile?.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'Management'}
            </h3>
            <p className="text-[11px] text-[#535862] font-medium mt-1 truncate max-w-[170px]">
              {profile?.manager?.designation || profile?.department?.name || 'Department Supervisor'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAFBFB] text-[#535862] flex items-center justify-center border border-[#EAECF0] shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Center Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Daily Shift Punch & Weekly Activity */}
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

          {/* Recent 7-Day Attendance Activity Strip */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F4F6F5] text-[#181D27] flex items-center justify-center border border-[#EAECF0]">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181D27]">Recent 7-Day Activity</h3>
                  <p className="text-[11px] text-[#717680]">Weekly check-in log summary</p>
                </div>
              </div>
              <Link
                href="/attendance"
                className="text-xs font-semibold text-[#2D7A58] hover:text-[#256549] inline-flex items-center gap-0.5"
              >
                Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-[#EAECF0]">
              {last7Days.map((dayDate, idx) => {
                const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                const isToday = dayDate.toDateString() === new Date().toDateString();
                const dayOfWeek = dayDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Match in thisWeekAttendance
                const record = thisWeekAttendance.find((r) => {
                  const rDate = new Date(r.date).toISOString().slice(0, 10);
                  return rDate === dateKey;
                });

                return (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold border ${
                        isToday 
                          ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]' 
                          : 'bg-[#FAFBFB] text-[#535862] border-[#EAECF0]'
                      }`}>
                        <span>{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="font-bold leading-none">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#181D27] flex items-center gap-1.5">
                          <span>{dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {isToday && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#717680]">
                          {record?.clockIn 
                            ? `In: ${new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${record.clockOut ? ` • Out: ${new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (In progress)'}`
                            : isWeekend 
                            ? 'Weekend Off' 
                            : isToday 
                            ? 'Check-in pending' 
                            : 'Off / Not recorded'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {record?.status === 'PRESENT' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                          Present
                        </span>
                      ) : record?.status === 'LATE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]">
                          Late
                        </span>
                      ) : record?.status === 'HALF_DAY' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Half Day
                        </span>
                      ) : isWeekend ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Rest Day
                        </span>
                      ) : isToday && !isClockedIn ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                          Pending
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                          Off
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Official Employment Profile & Quick Services */}
        <div className="lg:col-span-7 space-y-6">
          {/* Official Staff Profile & Corporate Details */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181D27]">Official Employment Details</h3>
                  <p className="text-[11px] text-[#717680]">Verified corporate profile and organization record</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                Verified Record
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Full Legal Name</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27]">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-[11px] text-[#717680] mt-0.5 font-mono">
                  Staff ID #{profile?.employeeCode}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Designation & Title</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27]">
                  {profile?.designation || 'Staff Member'}
                </p>
                <p className="text-[11px] text-[#2D7A58] mt-0.5 font-medium">
                  {profile?.department?.name || 'General Operations'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Direct Reporting Officer</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27]">
                  {profile?.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'General Management'}
                </p>
                <p className="text-[11px] text-[#717680] mt-0.5">
                  {profile?.manager?.designation || 'Supervisor'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Corporate Email Address</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27] truncate">
                  {profile?.user?.email || 'N/A'}
                </p>
                <p className="text-[11px] text-[#717680] mt-0.5">
                  Role: {profile?.user?.role || 'EMPLOYEE'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Contact Mobile</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27] font-mono">
                  {profile?.phone || 'Not specified'}
                </p>
                <p className="text-[11px] text-[#717680] mt-0.5">
                  Primary contact number
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#FAFBFB]">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-[#717680]">Date of Joining</span>
                </div>
                <p className="text-[13px] font-semibold text-[#181D27]">
                  {profile?.dateOfJoining ? formatDate(profile.dateOfJoining) : 'Active Contract'}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                  Le Paradise Resort Staff
                </p>
              </div>
            </div>
          </div>

          {/* Quick Access to Specialized Workspaces */}
          <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAFBFB] text-[#181D27] flex items-center justify-center border border-[#EAECF0]">
                  <Sparkles className="w-4 h-4 text-[#2D7A58]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#181D27]">Self-Service Workspaces</h3>
                  <p className="text-[11px] text-[#717680]">Dedicated portals for attendance, leave management, and wages</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tile 1: Attendance Logs */}
              <Link
                href="/attendance"
                className="group p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB] hover:bg-white hover:border-[#2D7A58] hover:shadow-subtle transition-all block cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-[13px] font-bold text-[#181D27] mt-3 group-hover:text-[#2D7A58] transition-colors flex items-center justify-between">
                  <span>Attendance Logs</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </h4>
                <p className="text-[11px] text-[#717680] mt-1 leading-relaxed">
                  Monthly shift calendar, working hours, and punctuality logs.
                </p>
              </Link>

              {/* Tile 2: Leave Inquiries */}
              <Link
                href="/leaves"
                className="group p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB] hover:bg-white hover:border-[#2D7A58] hover:shadow-subtle transition-all block cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h4 className="text-[13px] font-bold text-[#181D27] mt-3 group-hover:text-[#2D7A58] transition-colors flex items-center justify-between">
                  <span>Leave Inquiries</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </h4>
                <p className="text-[11px] text-[#717680] mt-1 leading-relaxed">
                  Apply for time off, view annual quotas, and track approvals.
                </p>
              </Link>

              {/* Tile 3: My Payslips */}
              <Link
                href="/payroll"
                className="group p-4 rounded-xl border border-[#EAECF0] bg-[#FAFBFB] hover:bg-white hover:border-[#2D7A58] hover:shadow-subtle transition-all block cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF6ED] text-[#2D7A58] flex items-center justify-center border border-[#D1EBD9] group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-[13px] font-bold text-[#181D27] mt-3 group-hover:text-[#2D7A58] transition-colors flex items-center justify-between">
                  <span>My Payslips</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </h4>
                <p className="text-[11px] text-[#717680] mt-1 leading-relaxed">
                  Verified salary statements, monthly breakdowns, and PDF exports.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
