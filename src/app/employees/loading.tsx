import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton, SkeletonHeader, SkeletonTable } from '@/components/Skeleton';

export default function EmployeesLoading() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <SkeletonHeader
          titleWidth="w-52"
          subtitleWidth="w-96"
          hasAction={true}
        />

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-xs">
          <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Employees Table Skeleton */}
        <SkeletonTable columns={6} rows={7} />
      </div>
    </DashboardLayout>
  );
}

