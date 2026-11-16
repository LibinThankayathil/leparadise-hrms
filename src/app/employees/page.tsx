'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/lib/permissions';
import { 
  Users, 
  Search, 
  ChevronDown, 
  FileText, 
  MoreHorizontal, 
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const canAddStaff = Permissions.canAddStaff(user?.role);
  const canViewSalary = user?.role === 'MANAGER';

  useEffect(() => {
    if (!authLoading && user && user.role === 'EMPLOYEE') {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeCode: '',
    designation: '',
    departmentId: '',
    role: 'EMPLOYEE',
    phone: '',
    baseSalary: 1400,
  });

  const loadData = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (selectedDept) query.append('departmentId', selectedDept);
      if (selectedStatus) query.append('status', selectedStatus);

      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/employees?${query.toString()}`),
        fetch('/api/departments'),
      ]);

      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(d.employees);
      }
      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartments(d.departments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const next: Record<string, boolean> = {};
    employees.forEach((emp) => {
      next[emp.id] = checked;
    });
    setSelectedRows(next);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create staff record');
        setFormSubmitting(false);
        return;
      }

      setShowModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeCode: '',
        designation: '',
        departmentId: '',
        role: 'EMPLOYEE',
        phone: '',
        baseSalary: 1400,
      });
      loadData();
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const isAllSelected = employees.length > 0 && employees.every((emp) => selectedRows[emp.id]);

  if (user?.role === 'EMPLOYEE') {
    return null;
  }

  return (
    <DashboardLayout 
      onActionClick={canAddStaff ? () => setShowModal(true) : undefined} 
      actionLabel={canAddStaff ? '+ Add New Staff' : undefined}
    >
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                Staff Directory
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                Active staff members, allocated departments, and employment status
              </p>
            </div>
          </div>

          {canAddStaff && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>+ Add New Staff</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Functional Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="appearance-none bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] text-[13px] font-medium pl-3.5 pr-8 py-2 rounded-lg shadow-subtle focus:outline-none focus:ring-1 focus:ring-[#2D7A58] cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] text-[13px] font-medium pl-3.5 pr-8 py-2 rounded-lg shadow-subtle focus:outline-none focus:ring-1 focus:ring-[#2D7A58] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search & Export Action */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#EAECF0] hover:border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D7A58] shadow-subtle placeholder:text-slate-400 text-[#181D27]"
              />
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EAECF0] hover:border-slate-300 text-[#344054] rounded-lg text-[13px] font-medium shadow-subtle transition-colors cursor-pointer shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-[#EAECF0] rounded-xl overflow-hidden shadow-subtle bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] min-w-[760px]">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[11px] font-semibold text-[#535862]">
                  {canAddStaff && (
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Name of Staff</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Mobile</th>
                  {canViewSalary && <th className="py-3 px-4">Monthly Salary</th>}
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] text-[#181D27]">
                {loading ? (
                  <tr>
                    <td colSpan={canViewSalary ? (canAddStaff ? 9 : 8) : (canAddStaff ? 8 : 7)} className="py-8">
                      <InlineLoader message="Loading staff directory..." />
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={canViewSalary ? (canAddStaff ? 9 : 8) : (canAddStaff ? 8 : 7)} className="py-12 text-center text-slate-400 text-xs">
                      No staff records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const isChecked = !!selectedRows[emp.id];
                    const isPending = emp.status === 'ON_LEAVE';

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-[#F9FAFB] transition-colors ${isChecked ? 'bg-[#F4F6F5]' : ''}`}
                      >
                        {canAddStaff && (
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectRow(emp.id)}
                              className="cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3 px-4 font-normal text-[#535862] font-mono text-xs">
                          #{emp.employeeCode.replace(/\D/g, '') || '102112'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#181D27]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}_${emp.lastName}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="truncate">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#535862]">
                          {emp.department?.name || 'General Operations'}
                        </td>
                        <td className="py-3 px-4 text-[#535862]">
                          {emp.designation}
                        </td>
                        <td className="py-3 px-4 text-[#535862] max-w-[160px] truncate">
                          {emp.user?.email}
                        </td>
                        <td className="py-3 px-4 text-[#535862] whitespace-nowrap font-mono text-[12px]">
                          {emp.phone || '+88 01766703570'}
                        </td>
                        {canViewSalary && (
                          <td className="py-3 px-4 font-semibold text-[#181D27]">
                            {formatCurrency(emp.baseSalary ? Number(emp.baseSalary) / 12 : 1400)}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]">
                              On Leave
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clean Responsive Pagination */}
        <div className="flex items-center justify-between pt-2 text-[13px] text-[#535862]">
          <span className="text-xs text-[#717680]">
            Showing <span className="font-semibold text-[#181D27]">{employees.length}</span> staff member(s)
          </span>

          <div className="flex items-center gap-1.5 font-medium">
            <button className="w-8 h-8 rounded-lg bg-[#2D7A58] text-white flex items-center justify-center font-semibold shadow-sm">
              1
            </button>
          </div>
        </div>

        {/* Add Employee Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#EAECF0] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
                <h2 className="text-base font-bold text-[#181D27]">Add New Staff Member</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateEmployee} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Staff ID Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 102113"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Front Desk Officer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">System Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    >
                      <option value="EMPLOYEE">Staff Employee</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="+88 01766703570"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Monthly Salary ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
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
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm disabled:opacity-50"
                  >
                    {formSubmitting ? 'Adding...' : 'Add Staff Member'}
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
