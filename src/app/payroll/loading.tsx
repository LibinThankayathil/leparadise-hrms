import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton, SkeletonHeader, SkeletonTable } from '@/components/Skeleton';

export default function PayrollLoading() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <SkeletonHeader
          titleWidth="w-52"
          subtitleWidth="w-80"
          hasAction={true}
        />

        {/* Date Selector & Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-[#EAECF0] bg-white shadow-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-24 rounded ml-auto" />
              <Skeleton className="h-6 w-32 rounded-lg ml-auto" />
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <SkeletonTable columns={7} rows={6} />
      </div>
    </DashboardLayout>
  );
}

