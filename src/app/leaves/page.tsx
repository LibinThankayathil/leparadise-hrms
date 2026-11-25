'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/lib/permissions';
import { CalendarDays, X, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function LeavesPage() {
  const { user } = useAuth();
  const canReview = Permissions.canReviewLeaves(user?.role);
  const isStaff = user?.role === 'EMPLOYEE';

  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const loadLeaves = async () => {
    try {
      const res = await fetch('/api/leaves');
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests);
        setBalances(d.balances);
        setLeaveTypes(d.leaveTypes);
        if (d.leaveTypes.length > 0 && !leaveTypeId) {
          setLeaveTypeId(d.leaveTypes[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveTypeId, startDate, endDate, reason }),
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to submit leave request');
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadLeaves();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/leaves/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        loadLeaves();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to review leave');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                {isStaff ? 'My Leave Inquiries & Requests' : 'Leave Inquiries & Requests'}
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                {isStaff
                  ? 'View your annual leave balances, submit time-off requests, and track status'
                  : 'Staff leave balances, time-off requests, and manager approvals'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>+ Request Leave</span>
          </button>
        </div>

        {/* Leave Balances Grid - Responsive */}
        {balances.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {balances.map((b) => {
              const remaining = b.totalDays - b.usedDays;
              return (
                <div key={b.id} className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-subtle">
                  <p className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">{b.leaveType?.name}</p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-2xl font-bold text-[#2D7A58]">{remaining}</span>
                    <span className="text-xs text-[#717680] font-normal">/ {b.totalDays} Days Left</span>
                  </div>
                  <div className="mt-2.5 w-full bg-[#EAECF0] rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-[#2D7A58] h-1 rounded-full"
                      style={{ width: `${Math.min(100, (b.usedDays / b.totalDays) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#717680] font-medium">
            Active Requests ({requests.length})
          </span>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] rounded-lg text-[13px] font-medium shadow-subtle cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Leave Requests Table */}
        <div className="border border-[#EAECF0] rounded-xl overflow-hidden shadow-subtle bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] min-w-[760px]">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[11px] font-semibold text-[#535862]">
                  {!isStaff && <th className="py-3 px-4">Staff Member</th>}
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">Duration Range</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Handover / Reason</th>
                  <th className="py-3 px-4">Status</th>
                  {canReview && <th className="py-3 px-4 text-right">Review Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] text-[#181D27]">
                {loading ? (
                  <tr>
                    <td colSpan={(!isStaff ? 1 : 0) + 5 + (canReview ? 1 : 0)} className="py-8">
                      <InlineLoader message="Loading leave inquiries..." />
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={(!isStaff ? 1 : 0) + 5 + (canReview ? 1 : 0)} className="py-12 text-center text-slate-400 text-xs">
                      {isStaff ? 'You have no leave requests submitted yet.' : 'No leave requests submitted yet.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F9FAFB] transition-colors">
                      {!isStaff && (
                        <td className="py-3 px-4 font-semibold text-[#181D27]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.employee?.firstName}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>{req.employee?.firstName} {req.employee?.lastName}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-[#535862]">
                        {req.leaveType?.name}
                      </td>
                      <td className="py-3 px-4 text-[#535862]">
                        {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#181D27]">
                        {Number(req.daysCount)}
                      </td>
                      <td className="py-3 px-4 text-[#535862] max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      {canReview && (
                        <td className="py-3 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleReview(req.id, 'APPROVED')}
                                className="px-2.5 py-1 text-xs font-semibold bg-[#EAF6ED] text-[#2D7A58] hover:bg-[#2D7A58] hover:text-white rounded-lg border border-[#D1EBD9] transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(req.id, 'REJECTED')}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#717680] font-normal">Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAECF0]">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
                <h2 className="text-base font-bold text-[#181D27]">Apply for Leave</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleApply} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Leave Category *
                  </label>
                  <select
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Default: {t.defaultDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Handover Notes / Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Details about task handover or coverage..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-[#EAECF0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-[#EAECF0] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
