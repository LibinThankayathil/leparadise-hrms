import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge('animate-pulse rounded-md bg-slate-200/70', className)}
      {...props}
    />
  );
}

export function SkeletonHeader({
  titleWidth = 'w-48',
  subtitleWidth = 'w-72',
  hasAction = true,
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  hasAction?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#EAECF0]">
      <div className="space-y-2">
        <Skeleton className={`h-8 ${titleWidth} rounded-lg`} />
        <Skeleton className={`h-4 ${subtitleWidth} rounded-md`} />
      </div>
      {hasAction && (
        <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
      )}
    </div>
  );
}

export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-[#EAECF0] bg-white space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  columns = 5,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-2xl border border-[#EAECF0] bg-white overflow-hidden shadow-xs">
      {/* Table toolbar */}
      <div className="p-4 border-b border-[#EAECF0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table header */}
      <div className="px-6 py-3.5 bg-slate-50/70 border-b border-[#EAECF0] flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24 rounded" />
        ))}
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[#EAECF0]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-6 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            {Array.from({ length: columns - 1 }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 w-20 rounded hidden sm:block"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

