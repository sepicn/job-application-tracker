// Mirrors the real board's geometry so the page does not jump when it loads.
export default function BoardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="rounded-xl bg-card px-5 py-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
          <div className="h-12 w-16 rounded bg-muted" />
          <div className="h-7 w-12 rounded bg-muted" />
        </div>
        <div className="mt-5 h-2 rounded-full bg-muted" />
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-4 w-24 rounded bg-muted" />
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="min-w-75 shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/10"
          >
            <div className="h-12 bg-muted" />
            <div className="min-h-100 space-y-2 bg-muted/30 p-4">
              <div className="h-24 rounded-lg bg-muted" />
              <div className="h-24 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
