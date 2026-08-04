"use client"

import { Column } from "@/lib/models/models.types"
import { Card } from "./ui/card"
import { columnConfigAt } from "./column-config"

export default function BoardStats({
  columns,
  addedThisWeek,
}: {
  columns: Column[]
  addedThisWeek: number
}) {
  const stages = [...columns]
    .sort((a, b) => a.order - b.order)
    .map((col, index) => ({
      id: col._id,
      name: col.name,
      count: col.jobApplications?.length ?? 0,
      fill: columnConfigAt(index).fill,
    }))

  const total = stages.reduce((sum, stage) => sum + stage.count, 0)
  const filled = stages.filter((stage) => stage.count > 0)

  return (
    <Card className="px-5 py-5">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
        <div>
          <p className="text-5xl leading-none font-semibold text-foreground">
            {total}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Total applications
          </p>
        </div>
        <div>
          <p className="text-2xl leading-none font-semibold text-foreground">
            {addedThisWeek}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Added this week</p>
        </div>
      </div>

      {/* Part-to-whole, so one bar rather than a tile per column: it holds a
          single row at any column count and shows proportion, not just counts. */}
      <div
        className="mt-5 flex h-2 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${total} applications across ${stages.length} columns`}
      >
        {filled.length === 0 ? (
          <div className="flex-1 bg-muted" />
        ) : (
          filled.map((stage) => (
            <div
              key={stage.id}
              className={`basis-0 ${stage.fill}`}
              style={{ flexGrow: stage.count }}
              title={`${stage.name}: ${stage.count}`}
            />
          ))
        )}
      </div>

      {/* The legend carries every value, so nothing is reachable only by hover. */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {stages.map((stage) => (
          <li key={stage.id} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${stage.fill}`} />
            <span className="text-muted-foreground">{stage.name}</span>
            <span className="font-medium text-foreground">{stage.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
