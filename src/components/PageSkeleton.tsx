import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4 animate-fade-in-up">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="space-y-4 animate-fade-in-up">
    <Skeleton className="h-4 w-48" />
    <Skeleton className="h-40 w-full rounded-2xl" />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-48 w-full rounded-xl" />
    ))}
  </div>
);
