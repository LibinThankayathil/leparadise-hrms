'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/lib/permissions';
import { 
  CreditCard, 
  Printer, 
  X, 
  ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PayrollPage() {
  const { user } = useAuth();
  const canRunPayroll = Permissions.canRunPayroll(user?.role);
  const isStaff = user?.role === 'EMPLOYEE';

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const loadPayslips = async () => {
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      if (res.ok) {
        const d = await res.json();
        setPayslips(d.payslips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [month, year]);

  const handleProcessPayroll = async () => {
    if (!confirm(`Are you sure you want to process payroll for Month ${month}, ${year}?`)) {
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });

      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Payroll processed successfully');
        loadPayslips();
      } else {
        alert(d.error || 'Failed to process payroll');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout 
      onActionClick={canRunPayroll ? handleProcessPayroll : undefined} 
      actionLabel={canRunPayroll ? '+ Run Monthly Payroll' : undefined}
    >
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                {isStaff ? 'My Payslips & Salary' : 'Payroll & Wages Register'}
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                {isStaff 
                  ? 'Review and download your monthly compensation vouchers and payment records'
                  : 'Monthly wage compensation, deductions, and downloadable employee payslips'}
              </p>
            </div>
          </div>

          {canRunPayroll && (
            <button
              type="button"
              disabled={processing}
              onClick={handleProcessPayroll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <span>+ Run Monthly Payroll</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="appearance-none bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] text-[13px] font-medium pl-3.5 pr-8 py-2 rounded-lg shadow-subtle focus:outline-none focus:ring-1 focus:ring-[#2D7A58] cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="appearance-none bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] text-[13px] font-medium pl-3.5 pr-8 py-2 rounded-lg shadow-subtle focus:outline-none focus:ring-1 focus:ring-[#2D7A58] cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Payslips Table */}
        <div className="border border-[#EAECF0] rounded-xl overflow-hidden shadow-subtle bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] min-w-[760px]">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[11px] font-semibold text-[#535862]">
                  {!isStaff && <th className="py-3 px-4">Staff Member</th>}
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Base Wages</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] text-[#181D27]">
                {loading ? (
                  <tr>
                    <td colSpan={isStaff ? 7 : 8} className="py-8">
                      <InlineLoader message="Loading payroll records..." />
                    </td>
                  </tr>
                ) : payslips.length === 0 ? (
                  <tr>
                    <td colSpan={isStaff ? 7 : 8} className="py-12 text-center text-slate-400 text-xs">
                      No payroll records processed for {monthNames[month - 1]} {year}. Click "+ Run Monthly Payroll" to disburse.
                    </td>
                  </tr>
                ) : (
                  payslips.map((ps) => (
                    <tr key={ps.id} className="hover:bg-[#F9FAFB] transition-colors">
                      {!isStaff && (
                        <td className="py-3 px-4 font-semibold text-[#181D27]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ps.employee?.firstName}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>{ps.employee?.firstName} {ps.employee?.lastName}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-[#535862]">
                        {ps.employee?.department?.name || 'Hotel Operations'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#535862]">
                        {formatCurrency(ps.basicSalary)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#2D7A58]">
                        +{formatCurrency(ps.allowances)}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600">
                        -{formatCurrency(ps.deductions)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#181D27]">
                        {formatCurrency(ps.netSalary)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                          {ps.status === 'PAID' ? 'Paid' : ps.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayslip(ps)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#EAECF0] hover:bg-slate-50 text-[#344054] rounded-lg transition-colors shadow-subtle cursor-pointer"
                        >
                          View Voucher
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher Modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border border-[#EAECF0]">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2D7A58] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    LP
                  </div>
                  <div>
                    <h3 className="font-bold text-[#181D27] text-base">Le Paradise HRMS</h3>
                    <p className="text-xs text-[#717680]">Official Staff Wage Voucher</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 bg-[#FAFBFB] p-4 rounded-xl border border-[#EAECF0] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#717680] block text-[11px]">Staff Name:</span>
                  <span className="font-bold text-[#181D27]">
                    {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[#717680] block text-[11px]">Staff ID:</span>
                  <span className="font-mono font-semibold text-[#181D27]">
                    #{selectedPayslip.employee?.employeeCode?.replace(/\D/g, '') || '102112'}
                  </span>
                </div>
                <div>
                  <span className="text-[#717680] block text-[11px]">Designation:</span>
                  <span className="font-semibold text-[#181D27]">
                    {selectedPayslip.employee?.designation}
                  </span>
                </div>
                <div>
                  <span className="text-[#717680] block text-[11px]">Pay Period:</span>
                  <span className="font-semibold text-[#181D27]">
                    {monthNames[selectedPayslip.month - 1]} {selectedPayslip.year}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#EAECF0]">
                  <span className="text-[#535862]">Base Monthly Wages:</span>
                  <span className="font-mono font-semibold text-[#181D27]">
                    {formatCurrency(selectedPayslip.basicSalary)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAECF0]">
                  <span className="text-[#2D7A58] font-medium">Standard Allowances (15%):</span>
                  <span className="font-mono font-semibold text-[#2D7A58]">
                    +{formatCurrency(selectedPayslip.allowances)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAECF0]">
                  <span className="text-rose-600 font-medium">Statutory Deductions (10%):</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatCurrency(selectedPayslip.deductions)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 text-sm font-bold">
                  <span className="text-[#181D27]">Total Net Disbursement:</span>
                  <span className="font-mono text-[#2D7A58] text-base font-bold">
                    {formatCurrency(selectedPayslip.netSalary)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAECF0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#EAECF0] rounded-lg text-xs font-semibold text-[#344054] hover:bg-slate-50 shadow-subtle cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-[#252B37] text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
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
