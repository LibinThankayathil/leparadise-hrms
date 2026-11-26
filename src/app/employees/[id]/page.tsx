'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { InlineLoader } from '@/components/LoadingScreen';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Users,
  Briefcase,
  UserCheck,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const employeeId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'payroll'>('attendance');

  // Security guard: Only Managers can view other staff's full profile
  useEffect(() => {
    if (!authLoading && user && user.role !== 'MANAGER') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/${employeeId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        router.push('/employees');
      }
    } catch (err) {
      console.error('Failed to load employee details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId && user?.role === 'MANAGER') {
      loadEmployee();
    }
  }, [employeeId, user]);

  if (authLoading || (loading && !data)) {
    return (
      <DashboardLayout>
        <div className="py-24">
          <InlineLoader message="Loading complete staff profile & employment records..." />
        </div>
      </DashboardLayout>
    );
  }

  const emp = data?.employee;
  const stats = data?.stats;

  if (!emp) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <p className="text-slate-500 text-sm">Staff member not found.</p>
          <Link
            href="/employees"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#2D7A58] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Staff Directory</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const monthlyBase = Number(emp.baseSalary ?? 0) / 12;
  const annualBase = Number(emp.baseSalary ?? 0);
  const allowancesEst = monthlyBase * 0.15;
  const deductionsEst = monthlyBase * 0.10;
  const netMonthlyEst = monthlyBase + allowancesEst - deductionsEst;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#535862] hover:text-[#181D27] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Staff Directory</span>
          </Link>

          <span className="text-xs font-mono text-[#717680]">
            Staff Code: <strong className="text-[#181D27]">{emp.employeeCode}</strong>
          </span>
        </div>

        {/* Hero Card: Profile Header */}
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-8 shadow-subtle relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 shadow-sm">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}_${emp.lastName}`}
                  alt={`${emp.firstName} ${emp.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl font-bold text-[#181D27] tracking-tight">
                    {emp.firstName} {emp.lastName}
                  </h1>

                  {/* Status Badge */}
                  {emp.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                      Active
                    </span>
                  ) : emp.status === 'ON_LEAVE' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]">
                      On Leave
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                      Terminated
                    </span>
                  )}

                  {/* Role Badge */}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {emp.user?.role === 'MANAGER' ? 'Manager' : 'Staff Member'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#535862]">
                  <div className="flex items-center gap-1.5 font-medium text-[#181D27]">
                    <Briefcase className="w-3.5 h-3.5 text-[#2D7A58]" />
                    <span>{emp.designation}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {formatDate(emp.dateOfJoining)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Highlights */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-right">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-[#717680] block">Monthly Base Salary</span>
                <span className="text-xl font-bold font-mono text-[#2D7A58]">
                  {formatCurrency(monthlyBase)}
                </span>
                <span className="text-[10px] text-[#717680] block font-mono">
                  {formatCurrency(annualBase)} / year
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Executive Stats Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-subtle">
            <span className="text-[11px] font-medium text-[#717680] block mb-1">Company Tenure</span>
            <div className="text-lg font-bold text-[#181D27]">{stats?.tenureString || '1 year'}</div>
            <span className="text-[11px] text-[#2D7A58] mt-1 block">
              Since {formatDate(emp.dateOfJoining)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-subtle">
            <span className="text-[11px] font-medium text-[#717680] block mb-1">30D Attendance Health</span>
            <div className="text-lg font-bold text-[#181D27] flex items-center gap-1.5">
              <span>{stats?.attendance?.attendanceHealthRate ?? 100}%</span>
              <span className="text-xs font-normal text-emerald-600">Active</span>
            </div>
            <span className="text-[11px] text-[#717680] mt-1 block">
              {stats?.attendance?.punctualityRate ?? 100}% on-time rate
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-subtle">
            <span className="text-[11px] font-medium text-[#717680] block mb-1">Annual Leave Balance</span>
            <div className="text-lg font-bold text-[#181D27]">
              {emp.leaveBalances?.[0]
                ? `${emp.leaveBalances[0].totalDays - emp.leaveBalances[0].usedDays} Days`
                : '12 Days'}
            </div>
            <span className="text-[11px] text-[#717680] mt-1 block">
              {emp.leaveBalances?.[0]?.usedDays ?? 0} days used this year
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-subtle">
            <span className="text-[11px] font-medium text-[#717680] block mb-1">Disbursed Payslips</span>
            <div className="text-lg font-bold text-[#181D27]">{emp.payslips?.length ?? 0} Payslips</div>
            <span className="text-[11px] text-[#2D7A58] mt-1 block">
              Latest: {emp.payslips?.[0] ? `${monthNames[emp.payslips[0].month - 1]} ${emp.payslips[0].year}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex border-b border-[#EAECF0] bg-white rounded-xl p-1 shadow-subtle">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'attendance'
                ? 'bg-[#EAF6ED] text-[#2D7A58] shadow-xs'
                : 'text-[#535862] hover:text-[#181D27] hover:bg-slate-50'
            }`}
          >
            Attendance Logs ({emp.attendanceRecords?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'leaves'
                ? 'bg-[#EAF6ED] text-[#2D7A58] shadow-xs'
                : 'text-[#535862] hover:text-[#181D27] hover:bg-slate-50'
            }`}
          >
            Leaves & Balances ({emp.leaveRequests?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'payroll'
                ? 'bg-[#EAF6ED] text-[#2D7A58] shadow-xs'
                : 'text-[#535862] hover:text-[#181D27] hover:bg-slate-50'
            }`}
          >
            Compensation & Payslips ({emp.payslips?.length ?? 0})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ATTENDANCE HISTORY (LAST 30 DAYS)                                  */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* 4 Attendance Status Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#D1EBD9] bg-[#EAF6ED]/40">
                <span className="text-[11px] font-bold uppercase text-[#2D7A58] block">On-Time Present</span>
                <span className="text-2xl font-bold text-[#181D27] mt-1 block">
                  {stats?.attendance?.presentCount ?? 0}
                </span>
                <span className="text-[11px] text-[#717680]">shifts logged</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <span className="text-[11px] font-bold uppercase text-amber-700 block">Late Arrivals</span>
                <span className="text-2xl font-bold text-[#181D27] mt-1 block">
                  {stats?.attendance?.lateCount ?? 0}
                </span>
                <span className="text-[11px] text-[#717680]">after shift start</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="text-[11px] font-bold uppercase text-blue-700 block">Half-Day Shifts</span>
                <span className="text-2xl font-bold text-[#181D27] mt-1 block">
                  {stats?.attendance?.halfDayCount ?? 0}
                </span>
                <span className="text-[11px] text-[#717680]">partial hours</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                <span className="text-[11px] font-bold uppercase text-rose-700 block">Absent Days</span>
                <span className="text-2xl font-bold text-[#181D27] mt-1 block">
                  {stats?.attendance?.absentCount ?? 0}
                </span>
                <span className="text-[11px] text-[#717680]">unexcused absence</span>
              </div>
            </div>

            {/* Table of Attendance Records */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-subtle overflow-hidden">
              <div className="p-4 border-b border-[#EAECF0]">
                <h3 className="text-sm font-bold text-[#181D27]">Chronological Attendance Log (Last 30 Records)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[#535862] font-semibold text-[11px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {emp.attendanceRecords?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No recent attendance logs recorded.
                        </td>
                      </tr>
                    ) : (
                      emp.attendanceRecords?.map((rec: any) => {
                        const clockInTime = rec.clockIn
                          ? new Date(rec.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : '--:--';
                        const clockOutTime = rec.clockOut
                          ? new Date(rec.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : '--:--';

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-[#181D27]">{formatDate(rec.date)}</td>
                            <td className="py-3 px-4 font-mono">{clockInTime}</td>
                            <td className="py-3 px-4 font-mono">{clockOutTime}</td>
                            <td className="py-3 px-4">
                              {rec.status === 'PRESENT' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF6ED] text-[#2D7A58]">
                                  Present
                                </span>
                              ) : rec.status === 'LATE' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                                  Late
                                </span>
                              ) : rec.status === 'HALF_DAY' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                  Half-Day
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                                  Absent
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{rec.note || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LEAVES & BALANCES                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'leaves' && (
          <div className="space-y-6">
            {/* Balances Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emp.leaveBalances?.map((bal: any) => {
                const remaining = Math.max(0, bal.totalDays - bal.usedDays);
                const percent = Math.min(100, Math.round((bal.usedDays / bal.totalDays) * 100));

                return (
                  <div key={bal.id} className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#181D27]">{bal.leaveType.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {bal.leaveType.code}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-2xl font-bold text-[#2D7A58]">{remaining} Days</span>
                      <span className="text-slate-500 text-[11px]">{bal.usedDays} of {bal.totalDays} used</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#2D7A58] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave History Table */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-subtle overflow-hidden">
              <div className="p-4 border-b border-[#EAECF0]">
                <h3 className="text-sm font-bold text-[#181D27]">Past Leave Applications & Inquiries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[#535862] font-semibold text-[11px]">
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Manager Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {emp.leaveRequests?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No leave applications submitted.
                        </td>
                      </tr>
                    ) : (
                      emp.leaveRequests?.map((req: any) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-[#181D27]">
                            {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                          </td>
                          <td className="py-3 px-4">{req.leaveType?.name}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{req.daysCount} Day(s)</td>
                          <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{req.reason}</td>
                          <td className="py-3 px-4">
                            {req.status === 'APPROVED' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF6ED] text-[#2D7A58]">
                                Approved
                              </span>
                            ) : req.status === 'REJECTED' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic">
                            {req.reviewComment || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COMPENSATION & PAYSLIPS                                            */}
        {/* ========================================================================= */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            {/* Compensation Breakdown Card */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#181D27] pb-3 border-b border-[#EAECF0]">
                Monthly Wage Breakdown (Indian Rupees)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[#717680] block text-[11px]">Base Monthly Wages</span>
                  <span className="text-base font-bold font-mono text-[#181D27] mt-1 block">
                    {formatCurrency(monthlyBase)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 block text-[11px]">Standard Allowances (15%)</span>
                  <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                    +{formatCurrency(allowancesEst)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-rose-700 block text-[11px]">Statutory Deductions (10%)</span>
                  <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
                    -{formatCurrency(deductionsEst)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EAF6ED] border border-[#D1EBD9]">
                  <span className="text-[#2D7A58] block text-[11px]">Estimated Net Payout</span>
                  <span className="text-base font-bold font-mono text-[#2D7A58] mt-1 block">
                    {formatCurrency(netMonthlyEst)}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Payslips History Table */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-subtle overflow-hidden">
              <div className="p-4 border-b border-[#EAECF0] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#181D27]">Generated Payslips</h3>
                  <p className="text-[11px] text-[#717680]">Official downloadable salary statements for this employee</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[#535862] font-semibold text-[11px]">
                      <th className="py-3 px-4">Pay Period</th>
                      <th className="py-3 px-4">Base Wages</th>
                      <th className="py-3 px-4">Allowances</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Net Salary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">PDF Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {emp.payslips?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No payslips processed yet for this employee.
                        </td>
                      </tr>
                    ) : (
                      emp.payslips?.map((ps: any) => (
                        <tr key={ps.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#181D27]">
                            {monthNames[ps.month - 1]} {ps.year}
                          </td>
                          <td className="py-3 px-4 font-mono">{formatCurrency(ps.basicSalary)}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600">+{formatCurrency(ps.allowances)}</td>
                          <td className="py-3 px-4 font-mono text-rose-600">-{formatCurrency(ps.deductions)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#181D27]">{formatCurrency(ps.netSalary)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF6ED] text-[#2D7A58]">
                              {ps.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/api/payroll/${ps.id}/pdf?inline=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-[#EAECF0] hover:bg-slate-50 text-[#344054] rounded-lg shadow-xs"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                <span>Preview</span>
                              </a>
                              <a
                                href={`/api/payroll/${ps.id}/pdf`}
                                download
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg shadow-xs"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

