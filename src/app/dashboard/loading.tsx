import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton, SkeletonHeader } from '@/components/Skeleton';

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <SkeletonHeader
          titleWidth="w-56"
          subtitleWidth="w-80"
          hasAction={false}
        />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-[#EAECF0] bg-white space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3.5 w-36 rounded" />
            </div>
          ))}
        </div>

        {/* Main Grid: Clock / Quick action + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left card: Clock / Shift card */}
          <div className="p-6 rounded-2xl border border-[#EAECF0] bg-white space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="py-6 flex flex-col items-center justify-center space-y-3 border-y border-[#EAECF0]">
              <Skeleton className="h-12 w-44 rounded-xl" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          {/* Right card: Attendance / Activity table */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-[#EAECF0] bg-white space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="divide-y divide-[#EAECF0]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

