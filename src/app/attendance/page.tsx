'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Clock, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AttendancePage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'EMPLOYEE';

  const [records, setRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    try {
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setTodayRecord(data.todayRecord);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
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
        await loadAttendance();
      } else {
        const d = await res.json();
        alert(d.error || 'Attendance action failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClockLoading(false);
    }
  };

  const isClockedIn = !!todayRecord?.clockIn;
  const isClockedOut = !!todayRecord?.clockOut;

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
                {isStaff ? 'My Attendance Logs' : 'Attendance Logs'}
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                {isStaff 
                  ? 'Your daily check-in timestamps, working durations, and punctuality records'
                  : 'Staff check-in timestamps, working durations, and punctuality'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={clockLoading || isClockedIn}
              onClick={() => handleClock('CLOCK_IN')}
              className="px-4 py-2 rounded-lg bg-[#2D7A58] hover:bg-[#256549] text-white font-semibold text-[13px] shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isClockedIn ? 'Clocked In Today' : '+ Clock In'}
            </button>
            <button
              type="button"
              disabled={clockLoading || !isClockedIn || isClockedOut}
              onClick={() => handleClock('CLOCK_OUT')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#344054] border border-[#EAECF0] font-semibold text-[13px] shadow-subtle transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isClockedOut ? 'Clocked Out' : 'Clock Out'}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#717680] font-medium">
              Today: <strong className="text-[#181D27]">{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] rounded-lg text-[13px] font-medium shadow-subtle transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Attendance Records Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <InlineLoader message="Loading attendance records..." />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No attendance logged for today.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#181D27]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.employee?.firstName}`}
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
                            rec.status === 'PRESENT'
                              ? 'bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]'
                              : rec.status === 'LATE'
                              ? 'bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.status === 'PRESENT' ? 'On-Time' : rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
