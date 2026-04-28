"use client";

export function GameCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-white/10 rounded" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function GameSliderSkeleton() {
  return (
    <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl bg-white/5 animate-pulse" />
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 w-24 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 glass-panel animate-pulse">
          <div className="w-12 h-12 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
          <div className="h-6 w-16 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function PageLoader() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <GameSliderSkeleton />
      <CategorySkeleton />
      <div className="space-y-4">
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}