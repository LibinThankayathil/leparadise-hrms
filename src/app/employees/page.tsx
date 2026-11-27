'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/lib/permissions';
import { 
  Users, 
  Search, 
  ChevronDown, 
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pencil,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type SelectedStaff = { id: string; name: string; code: string };

function describeStaff(emp: any): SelectedStaff {
  return { id: emp.id, name: `${emp.firstName} ${emp.lastName}`, code: emp.employeeCode };
}

function employeeFormValues(emp: any) {
  return {
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    email: emp.user?.email || '',
    password: '',
    employeeCode: emp.employeeCode || '',
    designation: emp.designation || '',
    role: emp.user?.role || 'EMPLOYEE',
    phone: emp.phone || '',
    baseSalary: Number(emp.baseSalary ?? 0) / 12,
    status: emp.status || 'ACTIVE',
  };
}

function StaffDialog({ titleId, width, restoreFocus, onDismiss, children }: {
  titleId: string;
  width: string;
  restoreFocus?: { current: HTMLElement | null };
  onDismiss: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    return () => {
      dialog.close();
      restoreFocus?.current?.focus();
    };
  }, [restoreFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      className={`m-auto max-h-[90vh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-xs ${width}`}
    >
      {children}
    </dialog>
  );
}

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const canAddStaff = Permissions.canAddStaff(user?.role);
  const canEditStaff = Permissions.canEditStaff(user?.role);
  const canDeleteStaff = Permissions.canDeleteStaff(user?.role);
  const canViewSalary = user?.role === 'MANAGER';

  useEffect(() => {
    if (!authLoading && user && user.role === 'EMPLOYEE') {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, SelectedStaff>>({});

  // Delete modal state
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const directoryHeading = useRef<HTMLHeadingElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string; code: string } | null>(null);
  const [bulkDeleteSnapshot, setBulkDeleteSnapshot] = useState<SelectedStaff[]>([]);
  const isBulkDelete = bulkDeleteSnapshot.length > 0;
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editFormError, setEditFormError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState(() => employeeFormValues({}));

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeCode: '',
    designation: '',
    role: 'EMPLOYEE',
    phone: '',
    baseSalary: 1400,
  });

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshEmployees = () => setRefreshVersion((version) => version + 1);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadData() {
      try {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (selectedStatus) query.append('status', selectedStatus);

        const empRes = await fetch(`/api/employees?${query.toString()}`, { signal });

        if (empRes.ok) {
          const d = await empRes.json();
          if (!signal.aborted) setEmployees(d.employees);
        }
      } catch (e) {
        if (!signal.aborted) console.error(e);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [search, selectedStatus, refreshVersion]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const isSelfEmployee = (emp: any): boolean => {
    return Boolean(
      (user?.employee?.id && emp.id === user.employee.id) ||
      (user?.id && emp.userId === user.id) ||
      (user?.email && emp.user?.email === user.email)
    );
  };

  const selectableEmployees = employees.filter((emp) => !isSelfEmployee(emp));
  const isAllSelected = selectableEmployees.length > 0 && selectableEmployees.every((emp) => selectedRows[emp.id]);
  const selectedCount = Object.keys(selectedRows).length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectedRows(checked
      ? Object.fromEntries(selectableEmployees.map((emp) => [emp.id, describeStaff(emp)]))
      : {}
    );
  };

  const handleSelectRow = (emp: any) => {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[emp.id]) delete next[emp.id];
      else next[emp.id] = describeStaff(emp);
      return next;
    });
  };

  const handleInitiateSingleDelete = (emp: any, trigger: HTMLButtonElement) => {
    deleteTrigger.current = trigger;
    setStaffToDelete(describeStaff(emp));
    setBulkDeleteSnapshot([]);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleInitiateBulkDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    const snapshot = Object.values(selectedRows);
    if (snapshot.length === 0) return;
    deleteTrigger.current = event.currentTarget;
    setBulkDeleteSnapshot(snapshot);
    setStaffToDelete(null);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteSubmitting(true);
    setDeleteError('');

    try {
      if (isBulkDelete) {
        const selectedIds = bulkDeleteSnapshot.map(({ id }) => id);
        const res = await fetch('/api/employees', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });

        const data = await res.json();
        if (!res.ok) {
          setDeleteError(data.error || 'Failed to delete selected staff members');
          setDeleteSubmitting(false);
          return;
        }

        deleteTrigger.current = directoryHeading.current;
        setShowDeleteModal(false);
        setSelectedRows({});
        setSuccessMessage(data.message || 'Staff deletion completed');
        refreshEmployees();
      } else if (staffToDelete) {
        const res = await fetch(`/api/employees/${staffToDelete.id}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok) {
          setDeleteError(data.error || 'Failed to delete staff member');
          setDeleteSubmitting(false);
          return;
        }

        deleteTrigger.current = directoryHeading.current;
        setShowDeleteModal(false);
        setStaffToDelete(null);
        setSelectedRows((prev) => {
          const next = { ...prev };
          delete next[staffToDelete.id];
          return next;
        });
        setSuccessMessage(data.message || 'Staff member deleted successfully');
        refreshEmployees();
      }
    } catch (err) {
      console.error(err);
      setDeleteError('An unexpected network error occurred.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, baseSalary: formData.baseSalary * 12 }),
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
        role: 'EMPLOYEE',
        phone: '',
        baseSalary: 1400,
      });
      setSuccessMessage('New staff member added successfully');
      refreshEmployees();
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEditFormData(employeeFormValues(emp));
    setEditFormError('');
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    setEditSubmitting(true);

    try {
      const original = employeeFormValues(editingEmployee);
      const changedFields = Object.fromEntries(
        (Object.keys(editFormData) as (keyof typeof editFormData)[])
          .filter((field) => field !== 'password' && editFormData[field] !== original[field])
          .map((field) => [field, editFormData[field]])
      );
      const payload = {
        ...changedFields,
        ...('phone' in changedFields && { phone: editFormData.phone || null }),
        ...('baseSalary' in changedFields && { baseSalary: editFormData.baseSalary * 12 }),
        ...(editFormData.password.trim() && { password: editFormData.password }),
      };

      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const fieldError = Object.entries(data.details ?? {})
          .flatMap(([field, detail]) => {
            const message = (detail as { _errors?: string[] } | null)?._errors?.[0];
            if (!message) return [];
            const label = field === 'employeeCode' ? 'Staff ID Code' : field === 'password' ? 'Password' : field;
            return [`${label}: ${message}`];
          })[0];
        setEditFormError(fieldError || data.error || 'Failed to update staff member');
        setEditSubmitting(false);
        return;
      }

      setShowEditModal(false);
      setEditingEmployee(null);
      setSuccessMessage(`${editFormData.firstName} ${editFormData.lastName}'s profile updated successfully`);
      refreshEmployees();
    } catch (err) {
      console.error(err);
      setEditFormError('An unexpected error occurred.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (user?.role === 'EMPLOYEE') {
    return null;
  }

  // Calculate total table columns (Actions column is always visible to allow viewing full profile)
  const hasActions = true;
  let totalColumns = 5; // Staff ID, Name, Designation, Email, Mobile
  if (canDeleteStaff) totalColumns += 1; // Checkbox
  if (canViewSalary) totalColumns += 1; // Salary
  totalColumns += 1; // Status
  if (hasActions) totalColumns += 1; // Actions

  return (
    <DashboardLayout 
      onActionClick={canAddStaff ? () => setShowModal(true) : undefined} 
      actionLabel={canAddStaff ? '+ Add New Staff' : undefined}
    >
      <div className="space-y-6">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 bg-[#EAF6ED] border border-[#D1EBD9] text-[#2D7A58] rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D7A58]" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-[#2D7A58] hover:opacity-70 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 ref={directoryHeading} tabIndex={-1} className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                Staff Directory
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                Active staff members and their employment status
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

          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedCount > 0 && canDeleteStaff && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-[13px] shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-[#B42318] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#D92D20] animate-pulse" />
              <span>
                <strong>{selectedCount}</strong> staff member{selectedCount > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedRows({})}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={handleInitiateBulkDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D92D20] hover:bg-[#B42318] text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedCount})</span>
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="border border-[#EAECF0] rounded-xl overflow-hidden shadow-subtle bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] min-w-[760px]">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-[#EAECF0] text-[11px] font-semibold text-[#535862]">
                  {canDeleteStaff && (
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        disabled={selectableEmployees.length === 0}
                        className="cursor-pointer rounded border-[#EAECF0] text-[#2D7A58] focus:ring-[#2D7A58]"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Name of Staff</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Mobile</th>
                  {canViewSalary && <th className="py-3 px-4">Monthly Salary</th>}
                  <th className="py-3 px-4">Status</th>
                  {hasActions && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] text-[#181D27]">
                {loading ? (
                  <>
                    <tr role="status" className="sr-only">
                      <td colSpan={totalColumns}>Loading staff directory...</td>
                    </tr>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-staff-${i}`} aria-hidden="true" className="animate-pulse">
                        {canDeleteStaff && (
                          <td className="py-3 px-4">
                            <div className="w-4 h-4 rounded bg-slate-200" />
                          </td>
                        )}
                        <td className="py-3 px-4"><div className="h-3.5 w-14 rounded bg-slate-200" /></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                            <div className="h-3.5 w-28 rounded bg-slate-200" />
                          </div>
                        </td>
                        <td className="py-3 px-4"><div className="h-3.5 w-28 rounded bg-slate-100" /></td>
                        <td className="py-3 px-4"><div className="h-3.5 w-36 rounded bg-slate-100" /></td>
                        <td className="py-3 px-4"><div className="h-3.5 w-24 rounded bg-slate-100" /></td>
                        {canViewSalary && (
                          <td className="py-3 px-4"><div className="h-3.5 w-16 rounded bg-slate-200" /></td>
                        )}
                        <td className="py-3 px-4"><div className="h-5 w-16 rounded-full bg-slate-200" /></td>
                        {hasActions && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-slate-100" />
                              <div className="w-6 h-6 rounded-lg bg-slate-100" />
                              <div className="w-6 h-6 rounded-lg bg-slate-100" />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="py-12 text-center text-slate-400 text-xs">
                      No staff records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const isChecked = !!selectedRows[emp.id];
                    const isSelf = isSelfEmployee(emp);

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-[#F9FAFB] transition-colors ${isChecked ? 'bg-[#F4F6F5]' : ''}`}
                      >
                        {canDeleteStaff && (
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectRow(emp)}
                              disabled={isSelf}
                              title={isSelf ? "You cannot select or delete your own account" : undefined}
                              className={`cursor-pointer rounded border-[#EAECF0] text-[#2D7A58] focus:ring-[#2D7A58] ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
                            />
                          </td>
                        )}
                        <td className="py-3 px-4 font-normal text-[#535862] font-mono text-xs">
                          #{emp.employeeCode?.replace(/\D/g, '') || emp.employeeCode || '102112'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#181D27]">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="flex items-center gap-2.5 group hover:text-[#2D7A58] transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-[#2D7A58] transition-all">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}_${emp.lastName}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="truncate group-hover:underline underline-offset-2">{emp.firstName} {emp.lastName}</span>
                          </Link>
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
                            {formatCurrency(Number(emp.baseSalary ?? 0) / 12)}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          {emp.status === 'TERMINATED' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                              Terminated
                            </span>
                          ) : emp.status === 'ON_LEAVE' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]">
                              On Leave
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9]">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions column */}
                        {hasActions && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-0.5">
                              <Link
                                href={`/employees/${emp.id}`}
                                title="View staff profile & records"
                                className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-[#2D7A58] hover:bg-[#EAF6ED] rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {isSelf ? (
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-1">
                                  You
                                </span>
                              ) : (
                                <>
                                  {canEditStaff && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(emp)}
                                      title="Edit staff member"
                                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-[#2D7A58] hover:bg-[#EAF6ED] rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDeleteStaff && (
                                    <button
                                      type="button"
                                      onClick={(event) => handleInitiateSingleDelete(emp, event.currentTarget)}
                                      title="Delete staff member"
                                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-[#D92D20] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
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
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
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

        {/* Edit Employee Modal */}
        {showEditModal && editingEmployee && (
          <StaffDialog
            titleId="edit-staff-title"
            width="max-w-xl"
            onDismiss={() => {
              if (!editSubmitting) { setShowEditModal(false); setEditingEmployee(null); }
            }}
          >
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#EAECF0] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF6ED] flex items-center justify-center shrink-0">
                    <Pencil className="w-4 h-4 text-[#2D7A58]" />
                  </div>
                  <div>
                    <h2 id="edit-staff-title" className="text-base font-bold text-[#181D27]">Edit Staff Member</h2>
                    <p className="text-[11px] text-[#717680] mt-0.5">
                      Editing {editingEmployee.firstName} {editingEmployee.lastName}{' '}
                      <span className="font-mono">({editingEmployee.employeeCode})</span>
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Close edit dialog"
                  disabled={editSubmitting}
                  onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editFormError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                  {editFormError}
                </div>
              )}

              <form onSubmit={handleUpdateEmployee} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
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
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">
                      New Password
                      <span className="font-normal text-[#717680] ml-1">(leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      minLength={6}
                      placeholder="••••••••"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Staff ID Code *</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={editFormData.employeeCode}
                      onChange={(e) => setEditFormData({ ...editFormData, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.designation}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">System Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  >
                    <option value="EMPLOYEE">Staff Employee</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="+88 01766703570"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#344054] mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editFormData.baseSalary}
                      onChange={(e) => setEditFormData({ ...editFormData, baseSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Employment Status</label>
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'ACTIVE', label: 'Active', color: 'bg-[#EAF6ED] text-[#2D7A58] border-[#D1EBD9]' },
                      { value: 'ON_LEAVE', label: 'On Leave', color: 'bg-[#FEF6EE] text-[#B93815] border-[#F9DBAF]' },
                      { value: 'TERMINATED', label: 'Terminated', color: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, status: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          editFormData.status === opt.value
                            ? `${opt.color} ring-1 ring-offset-1 ring-current`
                            : 'bg-white text-[#535862] border-[#EAECF0] hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-[#EAECF0]">
                  <button
                    type="button"
                    disabled={editSubmitting}
                    onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}
                    className="px-4 py-2 border border-[#EAECF0] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm disabled:opacity-50"
                  >
                    {editSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </StaffDialog>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <StaffDialog
            titleId="delete-staff-title"
            restoreFocus={deleteTrigger}
            width="max-w-md"
            onDismiss={() => { if (!deleteSubmitting) setShowDeleteModal(false); }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAECF0] overflow-hidden">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-[#D92D20] shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 id="delete-staff-title" className="text-base font-bold text-[#181D27]">
                    {isBulkDelete ? `Delete ${bulkDeleteSnapshot.length} Staff Members` : 'Delete Staff Member'}
                  </h3>
                  <p className="text-xs text-[#535862] mt-1">
                    {isBulkDelete ? (
                      <>
                        Are you sure you want to permanently delete the{' '}
                        <strong className="text-[#181D27]">{bulkDeleteSnapshot.length} selected staff members</strong>?
                      </>
                    ) : (
                      <>
                        Are you sure you want to delete <strong className="text-[#181D27]">{staffToDelete?.name}</strong>{' '}
                        <span className="font-mono text-slate-500">({staffToDelete?.code})</span>?
                      </>
                    )}
                  </p>
                </div>
                <button
                  aria-label="Close delete dialog"
                  disabled={deleteSubmitting}
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isBulkDelete && (
                <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-[#535862]">
                  {bulkDeleteSnapshot.map(({ id, name, code }) => (
                    <li key={id}>{name} <span className="font-mono">({code})</span></li>
                  ))}
                </ul>
              )}

              <div className="mt-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#D92D20] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#B42318] leading-relaxed">
                  <strong>Warning:</strong> This action cannot be undone. Their profile, system login, attendance records, leave history, and payroll data will be permanently removed.
                </p>
              </div>

              {deleteError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAECF0]">
                <button
                  type="button"
                  data-dialog-focus
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteSubmitting}
                  className="px-4 py-2 border border-[#EAECF0] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D92D20] hover:bg-[#B42318] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {deleteSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{isBulkDelete ? `Delete ${bulkDeleteSnapshot.length} Staff` : 'Delete Staff Member'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </StaffDialog>
        )}
      </div>
    </DashboardLayout>
  );
}
