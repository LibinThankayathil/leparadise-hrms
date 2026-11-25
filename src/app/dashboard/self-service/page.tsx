import { DashboardLayout } from '@/components/DashboardLayout';
import { EmployeeSelfServiceDashboard } from '@/components/dashboard/EmployeeSelfServiceDashboard';

export default function EmployeeSelfServicePage() {
  return (
    <DashboardLayout>
      <EmployeeSelfServiceDashboard />
    </DashboardLayout>
  );
}
