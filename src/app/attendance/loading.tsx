import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton, SkeletonHeader, SkeletonTable } from '@/components/Skeleton';

export default function AttendanceLoading() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <SkeletonHeader
          titleWidth="w-56"
          subtitleWidth="w-80"
          hasAction={false}
        />

        {/* Live Clock Card */}
        <div className="p-6 rounded-2xl border border-[#EAECF0] bg-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <Skeleton className="h-4 w-28 rounded mx-auto md:mx-0" />
            <Skeleton className="h-10 w-48 rounded-xl mx-auto md:mx-0" />
            <Skeleton className="h-3.5 w-60 rounded mx-auto md:mx-0" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-11 w-full md:w-36 rounded-xl" />
            <Skeleton className="h-11 w-full md:w-36 rounded-xl" />
          </div>
        </div>

        {/* Attendance Records Table */}
        <SkeletonTable columns={5} rows={6} />
      </div>
    </DashboardLayout>
  );
}

