export function EpisodeCardSkeleton() {
  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col justify-end p-6 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/30 to-neutral-900" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-700" />
          <div className="h-3 w-32 rounded bg-neutral-700" />
        </div>
        <div className="h-5 w-3/4 rounded bg-neutral-700" />
        <div className="h-3 w-full rounded bg-neutral-700" />
        <div className="h-3 w-5/6 rounded bg-neutral-700" />
        <div className="h-1 w-full rounded-full bg-neutral-700 mt-4" />
      </div>
    </div>
  );
}
