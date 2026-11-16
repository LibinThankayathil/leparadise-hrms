import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton, SkeletonHeader, SkeletonTable } from '@/components/Skeleton';

export default function LeavesLoading() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <SkeletonHeader
          titleWidth="w-48"
          subtitleWidth="w-80"
          hasAction={true}
        />

        {/* Leave Balances Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-[#EAECF0] bg-white space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-14 rounded-lg" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
          ))}
        </div>

        {/* Leaves Table Skeleton */}
        <SkeletonTable columns={6} rows={6} />
      </div>
    </DashboardLayout>
  );
}

