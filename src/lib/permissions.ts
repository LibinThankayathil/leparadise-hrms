export type UserRole = 'MANAGER' | 'EMPLOYEE';

export const Permissions = {
  // Staff Directory
  canAddStaff: (role?: string | null): boolean => role === 'MANAGER',
  canEditStaff: (role?: string | null): boolean => role === 'MANAGER',
  canDeleteStaff: (role?: string | null): boolean => role === 'MANAGER',

  // Departments
  canAddDepartment: (role?: string | null): boolean => role === 'MANAGER',
  canEditDepartment: (role?: string | null): boolean => role === 'MANAGER',

  // Leaves
  canReviewLeaves: (role?: string | null): boolean => role === 'MANAGER',
  canApplyLeave: (_role?: string | null): boolean => true,

  // Attendance
  canViewAllAttendance: (role?: string | null): boolean => role === 'MANAGER',

  // Payroll
  canRunPayroll: (role?: string | null): boolean => role === 'MANAGER',
  canViewCompanyPayroll: (role?: string | null): boolean => role === 'MANAGER',

  // Role labels and badges
  getRoleLabel: (role?: string | null): string => {
    switch (role) {
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Staff Member';
      default:
        return 'Staff';
    }
  },

  getRoleBadgeColor: (role?: string | null): { bg: string; text: string; border: string } => {
    switch (role) {
      case 'MANAGER':
        return { bg: 'bg-[#EAF6ED]', text: 'text-[#2D7A58]', border: 'border-[#D1EBD9]' };
      case 'EMPLOYEE':
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  },
};
