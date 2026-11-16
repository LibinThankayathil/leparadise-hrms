'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InlineLoader } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/lib/permissions';
import { Building2, Users, X } from 'lucide-react';

export default function DepartmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const canAddDept = Permissions.canAddDepartment(user?.role);

  useEffect(() => {
    if (!authLoading && user && user.role === 'EMPLOYEE') {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.departments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create department');
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      setName('');
      setDescription('');
      loadDepartments();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === 'EMPLOYEE') {
    return null;
  }

  return (
    <DashboardLayout 
      onActionClick={canAddDept ? () => setShowModal(true) : undefined} 
      actionLabel={canAddDept ? '+ Add Department' : undefined}
    >
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#252B37] flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#181D27] tracking-tight">
                Hotel Departments
              </h1>
              <p className="text-xs text-[#717680] font-normal mt-0.5">
                Operational divisions, staff headcounts, and organizational units
              </p>
            </div>
          </div>

          {canAddDept && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D7A58] hover:bg-[#256549] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>+ Add Department</span>
            </button>
          )}
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-8">
              <InlineLoader message="Loading hotel departments..." />
            </div>
          ) : departments.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No departments configured yet.
            </div>
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-subtle hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF6ED] text-[#2D7A58] border border-[#D1EBD9] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAFBFB] text-[#344054] border border-[#EAECF0]">
                      <Users className="w-3 h-3 text-[#717680]" />
                      {dept._count?.employees || 0} Staff
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#181D27] mt-3.5">{dept.name}</h3>
                  <p className="text-xs text-[#717680] mt-1 leading-relaxed">
                    {dept.description || 'Hotel and resort operations unit.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAECF0] flex items-center justify-between text-xs">
                  <span className="text-[#717680]">Operational Unit</span>
                  <span className="text-[#2D7A58] font-semibold">Active</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Department Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAECF0]">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
                <h2 className="text-base font-bold text-[#181D27]">Add New Department</h2>
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

              <form onSubmit={handleCreateDept} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Concierge & Guest Services"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAECF0] rounded-lg text-[13px] focus:ring-1 focus:ring-[#2D7A58] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Summary of responsibilities..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    {submitting ? 'Creating...' : 'Add Department'}
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
