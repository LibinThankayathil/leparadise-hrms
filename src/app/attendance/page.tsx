'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X, 
  List, 
  Grid, 
  CalendarCheck
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

function toLocalDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'EMPLOYEE';

  const today = new Date();
  const todayStr = toLocalDateInputValue(today);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(isStaff ? 'calendar' : 'list');

  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<
    | { key: string; data: { records: any[]; todayRecord: any; approvedLeaves: any[] } }
    | { key: string; error: true }
    | null
  >(null);
  const requestKey = JSON.stringify([user?.id, isStaff, selectedYear, selectedMonth, selectedDate, reload]);
  const selectedResult = result?.key === requestKey ? result : null;
  const attendance = selectedResult && 'data' in selectedResult ? selectedResult.data : null;
  const [records, , approvedLeaves] = [
    attendance?.records ?? [], attendance?.todayRecord ?? null, attendance?.approvedLeaves ?? [],
  ] as const;
  const showCalendar = isStaff && viewMode === 'calendar';
  const retryAttendance = () => setReload((count) => count + 1);
  const [time, setTime] = useState(new Date());

  // Day detail popover modal
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default view mode once role is loaded
  useEffect(() => {
    if (isStaff) {
      setViewMode('calendar');
    }
  }, [isStaff]);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();

    async function loadAttendance() {
      try {
        const query = isStaff
          ? `month=${selectedMonth}&year=${selectedYear}`
          : `date=${selectedDate}`;
        const res = await fetch(`/api/attendance?${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Attendance request failed: ${res.status}`);
        const data = await res.json();
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      } catch {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: true });
      }
    }

    setSelectedDayDetail(null);
    void loadAttendance();
    return () => controller.abort();
  }, [requestKey, isStaff, selectedMonth, selectedYear, selectedDate, user?.id]);

  const handleShiftDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + delta);
    setSelectedDate(toLocalDateInputValue(next));
  };

  const handlePrevMonth = () => {
    retryAttendance();
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    retryAttendance();
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Month Names and day headers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Index records by date string YYYY-MM-DD
  const recordMap = new Map<string, any>();
  if (showCalendar && attendance) {
    records.forEach((record) => {
      recordMap.set(new Date(record.date).toISOString().slice(0, 10), record);
    });
  }

  // Check if a date string falls within any approved leave
  const getLeaveForDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const check = new Date(y, m - 1, d, 12, 0, 0, 0);

    for (const l of approvedLeaves) {
      const sRaw = new Date(l.startDate);
      const s = new Date(sRaw.getUTCFullYear(), sRaw.getUTCMonth(), sRaw.getUTCDate(), 0, 0, 0, 0);
      const eRaw = new Date(l.endDate);
      const e = new Date(eRaw.getUTCFullYear(), eRaw.getUTCMonth(), eRaw.getUTCDate(), 23, 59, 59, 999);
      if (check >= s && check <= e) {
        return l;
      }
    }
    return null;
  };

  // Calendar cell builder
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayRaw = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  // Monday as 0, Sunday as 6
  const firstDayIndex = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

  const prevMonthDays: number[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthDays.push(d);
  }

  const totalFilled = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalFilled <= 35 ? 35 - totalFilled : 42 - totalFilled;
  const nextMonthDays: number[] = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    nextMonthDays.push(d);
  }

  // Summary counts for current month
  let onTimeCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let halfDayCount = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  (showCalendar && attendance ? currentMonthDays : []).forEach((d) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayDate = new Date(selectedYear, selectedMonth - 1, d);
    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 0;

    const dayCheck = new Date(selectedYear, selectedMonth - 1, d);
    dayCheck.setHours(0, 0, 0, 0);
    const isPast = dayCheck.getTime() < todayStart.getTime();

    const record = recordMap.get(dateStr);
    const leave = getLeaveForDate(dateStr);

    if (record) {
      if (record.status === 'LATE') lateCount++;
      else if (record.status === 'ABSENT') absentCount++;
      else if (record.status === 'HALF_DAY') halfDayCount++;
      else onTimeCount++;
    } else if (leave) {
      leaveCount++;
    } else if (isPast && !isWeekend) {
      absentCount++;
    }
  });

  return (
    <DashboardLayout actionLabel="Daily Shift Attendance">
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                {isStaff ? 'My Attendance Calendar' : 'Attendance Logs'}
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                {isStaff 
                  ? 'Monthly shift attendance calendar with punctuality, late arrivals, and absence tracking'
                  : 'Staff check-in timestamps, working durations, and monthly attendance history'}
              </p>
            </div>
          </div>


        </div>

        {/* Top Controls Bar: Month Navigator (Staff) / Date Selector (Manager) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-[#EAECF0] rounded-2xl shadow-subtle">
          {isStaff ? (
            <>
              {/* Month Navigator */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center border border-[#EAECF0] rounded-xl bg-[#FAFBFB] p-0.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      title="Previous Month"
                      aria-label="Previous Month"
                      className="p-1.5 rounded-lg text-[#535862] hover:text-[#181D27] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      title="Next Month"
                      aria-label="Next Month"
                      className="p-1.5 rounded-lg text-[#535862] hover:text-[#181D27] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-[#181D27] tracking-tight ml-1.5">
                    {monthNames[selectedMonth - 1]}{' '}
                    <span className="font-medium text-[#717680]">{selectedYear}</span>
                  </h2>
                </div>

                {(selectedMonth !== today.getMonth() + 1 || selectedYear !== today.getFullYear()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth(today.getMonth() + 1);
                      setSelectedYear(today.getFullYear());
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#2D7A58] bg-[#EAF6ED] hover:bg-[#D1EBD9] border border-[#D1EBD9] rounded-lg transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Right Tools: View Mode Toggle */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <div className="inline-flex items-center p-1 bg-[#F4F6F5] border border-[#EAECF0] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'calendar'
                        ? 'bg-white text-[#181D27] shadow-xs'
                        : 'text-[#717680] hover:text-[#181D27]'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Calendar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#181D27] shadow-xs'
                        : 'text-[#717680] hover:text-[#181D27]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List Table</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manager Daily Date Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center border border-[#EAECF0] rounded-lg bg-[#FAFBFB] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleShiftDay(-1)}
                    title="Previous Day"
                    className="p-2 text-[#535862] hover:text-[#181D27] hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftDay(1)}
                    title="Next Day"
                    className="p-2 text-[#535862] hover:text-[#181D27] hover:bg-slate-100 transition-colors border-l border-[#EAECF0] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative flex items-center">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#535862] absolute left-3 pointer-events-none" />
                  <input
                    type="date"
                    aria-label="Select attendance date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="pl-8 pr-3 py-1.5 bg-[#FAFBFB] border border-[#EAECF0] hover:border-slate-300 rounded-lg text-[13px] font-semibold text-[#181D27] focus:outline-none focus:ring-1 focus:ring-[#2D7A58] cursor-pointer"
                  />
                </div>

                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-[#2D7A58] bg-[#EAF6ED] hover:bg-[#D1EBD9] border border-[#D1EBD9] rounded-lg transition-colors cursor-pointer"
                  >
                    Go to Today
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#535862] font-medium self-end md:self-auto">
                <span>
                  {selectedDate === todayStr
                    ? `Today (${formatLocalDate(selectedDate)})`
                    : formatLocalDate(selectedDate)}
                </span>
                {attendance && (
                  <span className="px-2.5 py-1 rounded-full bg-[#FAFBFB] border border-[#EAECF0] text-[#181D27] font-semibold">
                    {records.length} {records.length === 1 ? 'record' : 'records'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Monthly Summary Statistics Cards (Shown on Calendar View) */}
        {showCalendar && attendance && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* On-Time Card */}
            <div className="p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-subtle flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D7A58]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#717680]">On-Time</span>
                </div>
                <h3 className="text-2xl font-bold text-[#181D27] mt-1 tabular-nums">
                  {onTimeCount} <span className="text-xs font-medium text-[#717680]">{onTimeCount === 1 ? 'Day' : 'Days'}</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Late Arrivals Card */}
            <div className="p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-subtle flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B93815]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#717680]">Late Arrivals</span>
                </div>
                <h3 className="text-2xl font-bold text-[#181D27] mt-1 tabular-nums">
                  {lateCount} <span className="text-xs font-medium text-[#717680]">{lateCount === 1 ? 'Day' : 'Days'}</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Absences Card */}
            <div className="p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-subtle flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#717680]">Absences</span>
                </div>
                <h3 className="text-2xl font-bold text-[#181D27] mt-1 tabular-nums">
                  {absentCount} <span className="text-xs font-medium text-[#717680]">{absentCount === 1 ? 'Day' : 'Days'}</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Approved Leave Card */}
            <div className="p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-subtle flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#717680]">Time-Off</span>
                </div>
                <h3 className="text-2xl font-bold text-[#181D27] mt-1 tabular-nums">
                  {leaveCount} <span className="text-xs font-medium text-[#717680]">{leaveCount === 1 ? 'Day' : 'Days'}</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {selectedResult && 'error' in selectedResult ? (
          <div className="py-12 text-center border border-[#EAECF0] rounded-2xl bg-white">
            <p role="alert">Could not load attendance for {isStaff ? `${monthNames[selectedMonth - 1]} ${selectedYear}` : formatLocalDate(selectedDate)}.</p>
            <button type="button" onClick={retryAttendance} className="mt-3 underline">Retry</button>
          </div>
        ) : !attendance ? (
          showCalendar ? (
            <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading attendance calendar">
              {/* Skeleton Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skel-card-${i}`}
                    className="p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-subtle flex items-center justify-between gap-3"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                      <div className="h-7 w-16 rounded bg-slate-200" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Skeleton Calendar Grid */}
              <div className="bg-white border border-[#EAECF0] rounded-2xl shadow-subtle overflow-hidden">
                <div className="px-4 py-3 border-b border-[#EAECF0] bg-[#FAFBFB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="h-3.5 w-56 rounded bg-slate-200" />
                  <div className="flex items-center gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`skel-leg-${i}`} className="h-3 w-12 rounded bg-slate-200" />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-[#EAECF0] bg-white">
                  {dayHeaders.map((dh, idx) => (
                    <div
                      key={dh}
                      className={`py-2.5 text-center text-[11px] font-bold uppercase tracking-wider ${
                        idx === 6 ? 'text-[#98A2B3] bg-[#FAFBFB]/80' : 'text-[#717680]'
                      }`}
                    >
                      {dh}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-[#EAECF0]">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={`skel-day-${i}`}
                      className="min-h-[82px] sm:min-h-[104px] p-1.5 sm:p-2.5 bg-white flex flex-col justify-between"
                    >
                      <div className="h-4 w-5 rounded bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="h-5 w-full rounded-md bg-slate-100" />
                        <div className="hidden sm:block h-2.5 w-16 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 border border-[#EAECF0] rounded-2xl bg-white">
              <InlineLoader message="Loading attendance records..." />
            </div>
          )
        ) : showCalendar ? (
          /* CALENDAR VIEW */
          <div className="bg-white border border-[#EAECF0] rounded-2xl shadow-subtle overflow-hidden">
            {/* Integrated Calendar Header + Legend */}
            <div className="px-4 py-3 border-b border-[#EAECF0] bg-[#FAFBFB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#344054]">
                Click any past or current day to inspect shift timestamps
              </span>
              <div className="flex items-center gap-3.5 flex-wrap text-[11px] font-medium text-[#535862]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D7A58]" />
                  On-Time
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B93815]" />
                  Late
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Absent
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  Leave
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  Rest Day
                </span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-[#EAECF0] bg-white text-center text-[11px] font-bold uppercase tracking-wider text-[#717680]">
              {dayHeaders.map((dh, idx) => (
                <div
                  key={dh}
                  className={`py-2.5 ${idx === 6 ? 'text-[#98A2B3] bg-[#FAFBFB]/80' : ''}`}
                >
                  {dh}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-[#EAECF0]">
              {/* Previous Month Padding Days */}
              {prevMonthDays.map((d) => (
                <div
                  key={`prev-${d}`}
                  className="min-h-[82px] sm:min-h-[104px] p-1.5 sm:p-2.5 bg-[#FAFBFB] text-slate-300 select-none flex flex-col justify-between"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 tabular-nums">{d}</span>
                </div>
              ))}

              {/* Current Month Active Days */}
              {currentMonthDays.map((d) => {
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayDate = new Date(selectedYear, selectedMonth - 1, d);
                const dayOfWeek = dayDate.getDay();
                const isWeekend = dayOfWeek === 0;

                const dayCheck = new Date(selectedYear, selectedMonth - 1, d);
                dayCheck.setHours(0, 0, 0, 0);

                const isToday = dayCheck.getTime() === todayStart.getTime();
                const isFuture = dayCheck.getTime() > todayStart.getTime();

                const record = recordMap.get(dateStr);
                const leave = getLeaveForDate(dateStr);

                // Determine Day Status & Style
                let statusLabel = '';
                let shortLabel = '';
                let dotClass = '';
                let statusBadgeClass = '';
                let cellClass = isWeekend ? 'bg-[#FAFBFB]/60 hover:bg-[#FAFBFB]' : 'bg-white hover:bg-[#FAFBFB]';

                if (record) {
                  if (record.status === 'LATE') {
                    statusLabel = 'Late';
                    shortLabel = 'Late';
                    dotClass = 'bg-[#B93815]';
                    statusBadgeClass = 'bg-[#FEF6EE] text-[#B93815] border-[#F9DBAF]';
                    cellClass = 'bg-white hover:bg-[#FEF6EE]/40';
                  } else if (record.status === 'ABSENT') {
                    statusLabel = 'Absent';
                    shortLabel = 'Abs';
                    dotClass = 'bg-rose-600';
                    statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    cellClass = 'bg-white hover:bg-rose-50/40';
                  } else if (record.status === 'HALF_DAY') {
                    statusLabel = 'Half Day';
                    shortLabel = 'Half';
                    dotClass = 'bg-purple-600';
                    statusBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                    cellClass = 'bg-white hover:bg-purple-50/40';
                  } else {
                    statusLabel = 'On-Time';
                    shortLabel = 'On-Time';
                    dotClass = 'bg-[#2D7A58]';
                    statusBadgeClass = 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]';
                    cellClass = 'bg-white hover:bg-[#EAF6ED]/40';
                  }
                } else if (leave) {
                  statusLabel = leave.leaveType?.name || 'On Leave';
                  shortLabel = 'Leave';
                  dotClass = 'bg-sky-600';
                  statusBadgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                  cellClass = 'bg-white hover:bg-sky-50/40';
                } else if (isWeekend) {
                  statusLabel = 'Rest Day';
                  shortLabel = 'Rest';
                  dotClass = 'bg-slate-300';
                  statusBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
                  cellClass = 'bg-[#FAFBFB]/70 hover:bg-[#FAFBFB] text-slate-400';
                } else if (isFuture) {
                  statusLabel = '';
                  cellClass = 'bg-white';
                } else if (isToday) {
                  statusLabel = 'Pending';
                  shortLabel = 'Pending';
                  dotClass = 'bg-amber-500';
                  statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 border-dashed';
                  cellClass = 'bg-[#EAF6ED]/25 hover:bg-[#EAF6ED]/45';
                } else {
                  // Past workday with no log
                  statusLabel = 'Absent';
                  shortLabel = 'Abs';
                  dotClass = 'bg-rose-600';
                  statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  cellClass = 'bg-white hover:bg-rose-50/40';
                }

                return (
                  <button
                    key={`day-${d}`}
                    type="button"
                    disabled={isFuture}
                    aria-label={`${dayDate.toLocaleDateString('en-US', { dateStyle: 'full' })}: ${statusLabel || 'Future day'}`}
                    onClick={() => setSelectedDayDetail({
                      date: dayDate,
                      record,
                      leave,
                      statusLabel,
                    })}
                    className={`min-h-[82px] sm:min-h-[104px] p-1.5 sm:p-2.5 text-left transition-colors flex flex-col justify-between cursor-pointer disabled:cursor-default focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D7A58] group ${cellClass} ${
                      isToday ? 'ring-2 ring-inset ring-[#2D7A58]' : ''
                    }`}
                  >
                    {/* Top Row: Date Number & Today Indicator */}
                    <span className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-bold tabular-nums transition-colors ${
                          isToday
                            ? 'bg-[#2D7A58] text-white shadow-xs w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center'
                            : isFuture
                            ? 'text-[#98A2B3]'
                            : 'text-[#181D27] group-hover:text-[#2D7A58]'
                        }`}
                      >
                        {d}
                      </span>
                      {isToday && (
                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#EAF6ED] text-[#2D7A58]">
                          Today
                        </span>
                      )}
                    </span>

                    {/* Bottom: Status Pill & Time Stamp */}
                    <span className="block w-full mt-1.5 space-y-1">
                      {statusLabel && (
                        <span
                          className={`inline-flex items-center justify-center sm:justify-start gap-1.5 w-full text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md border truncate ${statusBadgeClass}`}
                        >
                          <span className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                          <span className="truncate sm:hidden">{shortLabel}</span>
                          <span className="hidden sm:inline truncate">{statusLabel}</span>
                        </span>
                      )}

                      {/* Display Clock-In / Out details if available */}
                      {record && record.clockIn && (
                        <span className="hidden sm:block text-[10px] text-[#717680] font-mono truncate pl-0.5 tabular-nums">
                          {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {record.clockOut && (
                            <> &ndash; {new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}

              {/* Next Month Padding Days */}
              {nextMonthDays.map((d) => (
                <div
                  key={`next-${d}`}
                  className="min-h-[82px] sm:min-h-[104px] p-1.5 sm:p-2.5 bg-[#FAFBFB] text-slate-300 select-none flex flex-col justify-between"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 tabular-nums">{d}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* LIST / TABLE VIEW */
          <div className="border border-[#EAECF0] rounded-xl overflow-hidden shadow-subtle bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px] min-w-[680px]">
                <thead>
                  <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[11px] font-semibold text-[#535862]">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Staff Code</th>
                    <th className="py-3 px-4">Shift Date</th>
                    <th className="py-3 px-4">Clock In</th>
                    <th className="py-3 px-4">Clock Out</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] text-[#181D27]">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No attendance records logged for {isStaff ? `${monthNames[selectedMonth - 1]} ${selectedYear}` : formatLocalDate(selectedDate)}.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const isPresent = rec.status === 'PRESENT';
                      const isLate = rec.status === 'LATE';

                      return (
                        <tr key={rec.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#181D27]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.employee?.firstName || user?.email}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span>{rec.employee?.firstName} {rec.employee?.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#535862] font-mono text-xs">
                            #{rec.employee?.employeeCode?.replace(/\D/g, '') || '102112'}
                          </td>
                          <td className="py-3 px-4 text-[#535862]">
                            {formatDate(rec.date)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[12px] text-[#181D27]">
                            {rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[12px] text-[#535862]">
                            {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isPresent
                                  ? 'bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]'
                                  : isLate
                                  ? 'bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPresent ? 'On-Time' : rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Day Details Popover / Modal */}
        {showCalendar && attendance && selectedDayDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EAECF0] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
                <div>
                  <h3 className="text-base font-bold text-[#181D27]">
                    {selectedDayDetail.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-[#717680] mt-0.5">Shift Attendance Verification</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* Status Badge */}
                <div className="p-3 rounded-xl bg-[#FAFBFB] border border-[#EAECF0] flex items-center justify-between">
                  <span className="text-[#535862] font-medium">Shift Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    selectedDayDetail.statusLabel === 'On-Time'
                      ? 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]'
                      : selectedDayDetail.statusLabel === 'Late'
                      ? 'bg-[#FEF6EE] text-[#B93815] border-[#F9DBAF]'
                      : selectedDayDetail.statusLabel === 'Absent'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {selectedDayDetail.statusLabel || 'Regular Shift'}
                  </span>
                </div>

                {/* Clock In / Out Times */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-[#EAECF0] bg-white">
                    <span className="text-[#717680] text-[11px] block">Clocked In</span>
                    <span className="font-semibold text-[#181D27] text-sm mt-0.5 block font-mono">
                      {selectedDayDetail.record?.clockIn 
                        ? new Date(selectedDayDetail.record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : '--:--'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#EAECF0] bg-white">
                    <span className="text-[#717680] text-[11px] block">Clocked Out</span>
                    <span className="font-semibold text-[#181D27] text-sm mt-0.5 block font-mono">
                      {selectedDayDetail.record?.clockOut 
                        ? new Date(selectedDayDetail.record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : '--:--'}
                    </span>
                  </div>
                </div>

                {/* Duration calculation */}
                {selectedDayDetail.record?.clockIn && selectedDayDetail.record?.clockOut && (
                  <div className="p-2.5 rounded-lg bg-[#FAFBFB] border border-[#EAECF0] flex justify-between items-center text-xs">
                    <span className="text-[#717680]">Total Working Duration:</span>
                    <span className="font-semibold text-[#2D7A58]">
                      {(() => {
                        const diff = new Date(selectedDayDetail.record.clockOut).getTime() - new Date(selectedDayDetail.record.clockIn).getTime();
                        const hrs = Math.floor(diff / (1000 * 60 * 60));
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return `${hrs}h ${mins}m`;
                      })()}
                    </span>
                  </div>
                )}

                {/* Leave information if on leave */}
                {selectedDayDetail.leave && (
                  <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-200 text-sky-800 text-xs">
                    <span className="font-semibold block">Approved Time Off:</span>
                    <span className="mt-0.5 block">{selectedDayDetail.leave.leaveType?.name} &bull; &ldquo;{selectedDayDetail.leave.reason}&rdquo;</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#EAECF0] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDayDetail(null)}
                  className="px-4 py-2 bg-[#181D27] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
