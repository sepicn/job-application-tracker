"use client"

import { Board, Column, JobAppication } from "@/lib/models/models.types"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import CreateJobApplicationDialog from "./create-job-application-dialog"
import CreateColumnDialog from "./create-column-dialog"
import BoardStats from "./board-stats"
import { ColConfig, columnConfigAt } from "./column-config"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import JobApplicationCard from "./job-application-card"
import { useBoard } from "@/lib/hooks/useBoards"
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface KanbanBoardProps {
  board: Board
  addedThisWeek: number
}

function DroppableColumn({
  column,
  config,
  boardId,
  sortedColumns,
  canDelete,
  onDelete,
  onRename,
}: {
  column: Column
  config: ColConfig
  boardId: string
  sortedColumns: Column[]
  canDelete: boolean
  onDelete: (columnId: string) => Promise<{ error?: string } | undefined>
  onRename: (
    columnId: string,
    name: string,
  ) => Promise<{ error?: string } | undefined>
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(column.name)
  const [renameError, setRenameError] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: {
      type: "column",
      columnId: column._id,
    },
  })

  // sort() mutates, and this array is the caller's props.
  const sortedJobs = [...(column.jobApplications ?? [])].sort(
    (a, b) => a.order - b.order,
  )

  function openRename() {
    setRenameValue(column.name)
    setRenameError("")
    setIsRenaming(true)
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()

    setRenameError("")
    setIsSavingName(true)

    try {
      const result = await onRename(column._id, renameValue)

      if (result?.error) {
        setRenameError(result.error)
        return
      }

      setIsRenaming(false)
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await onDelete(column._id)

      if (result?.error) {
        toast.error("Could not delete the column", {
          description: result.error,
        })
        return
      }

      setIsConfirmingDelete(false)
      toast.success(`Deleted ${column.name}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="min-w-75 max-w-md flex-1 shrink-0 p-0 shadow-md">
        <CardHeader
          className={`${config.header} text-white rounded-t-lg pb-3 pt-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.icon}
              <CardTitle className="text-white text-base font-semibold">
                {column.name}
              </CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openRename}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename Column
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={!canDelete}
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent
          ref={setNodeRef}
          // A ring around the full min-height box read as an oversized
          // placeholder, so only empty columns, which have no gap, get one.
          className={`space-y-2 pt-4 min-h-100 rounded-b-lg transition-colors ${
            isOver ? "bg-accent" : "bg-muted/40"
          } ${isOver && sortedJobs.length === 0 ? "ring-2 ring-inset ring-primary" : ""}`}
        >
          <SortableContext
            items={sortedJobs.map((job) => job._id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedJobs.map((job) => (
              <SortableJobCard
                key={job._id}
                job={{ ...job, columnId: job.columnId || column._id }}
                columns={sortedColumns}
              />
            ))}
          </SortableContext>
          <CreateJobApplicationDialog columnId={column._id} boardId={boardId} />
        </CardContent>
      </Card>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogDescription>
              Jobs in this column are not affected.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRename}>
            {renameError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {renameError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`rename-${column._id}`}>Name *</Label>
              <Input
                id={`rename-${column._id}`}
                required
                maxLength={50}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSavingName}
                onClick={() => setIsRenaming(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingName || !renameValue.trim()}
              >
                {isSavingName ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {column.name}?</DialogTitle>
            <DialogDescription>
              {sortedJobs.length > 0
                ? `This column and its ${sortedJobs.length} job application${
                    sortedJobs.length === 1 ? "" : "s"
                  } will be permanently deleted. This cannot be undone.`
                : "This column will be permanently deleted. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete Column"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SortableJobCard({
  job,
  columns,
}: {
  job: JobAppication
  columns: Column[]
}) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    setNodeRef,
  } = useSortable({
    id: job._id,
    data: {
      type: "job",
      job,
    },
  })

  const style = {
    // Translate, not Transform: the strategy's scale values stretch the card.
    transform: CSS.Translate.toString(transform),
    transition,
    // dnd-kit leaves the source in place when a DragOverlay is mounted, so
    // its slot is the placeholder. Dimming rather than hiding showed both.
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <JobApplicationCard
        job={job}
        columns={columns}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default function KanbanBoard({
  board,
  addedThisWeek,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragSnapshot = useRef<Column[] | null>(null)

  const {
    columns,
    moveJob,
    previewMoveJob,
    restoreColumns,
    createColumn,
    renameColumn,
    deleteColumn,
  } = useBoard(board)

  // Marking the body rather than the overlay: the cursor also travels over the
  // cards and columns underneath, which carry cursors of their own.
  useEffect(() => {
    if (!activeId) return

    document.body.dataset.dragging = "true"

    return () => {
      delete document.body.dataset.dragging
    }
  }, [activeId])

  const sortedColumns = [...(columns ?? [])].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function columnHolding(cols: Column[], jobId: string) {
    return cols.find((col) =>
      col.jobApplications.some((job) => job._id === jobId),
    )
  }

  function jobsOf(column: Column) {
    return [...(column.jobApplications ?? [])].sort((a, b) => a.order - b.order)
  }

  function handleDragStart(event: DragStartEvent) {
    // Rollback target for a cancelled drag or a failed save.
    dragSnapshot.current = columns
    setActiveId(String(event.active.id))
  }

  // dnd-kit only shifts items inside the SortableContext holding the dragged
  // card, so it has to actually enter the hovered column to open a gap there.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event

    if (!over) return

    const activeJobId = String(active.id)
    const overId = String(over.id)

    if (activeJobId === overId) return

    const activeColumn = columnHolding(columns, activeJobId)
    const overColumn =
      columns.find((col) => col._id === overId) ??
      columnHolding(columns, overId)

    if (!activeColumn || !overColumn) return
    // Same-column reordering is already handled by the SortableContext.
    if (activeColumn._id === overColumn._id) return

    const overJobs = jobsOf(overColumn)
    const overIndex = overJobs.findIndex((job) => job._id === overId)

    previewMoveJob(
      activeJobId,
      overColumn._id,
      overIndex === -1 ? overJobs.length : overIndex,
    )
  }

  function handleDragCancel() {
    setActiveId(null)

    if (dragSnapshot.current) restoreColumns(dragSnapshot.current)

    dragSnapshot.current = null
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const snapshot = dragSnapshot.current

    setActiveId(null)
    dragSnapshot.current = null

    if (!over) {
      if (snapshot) restoreColumns(snapshot)
      return
    }

    const activeJobId = String(active.id)
    const overId = String(over.id)

    // handleDragOver already moved the card, so read where it actually is.
    const column = columnHolding(columns, activeJobId)

    if (!column) return

    const jobs = jobsOf(column)
    const oldIndex = jobs.findIndex((job) => job._id === activeJobId)
    const newIndex =
      overId === column._id
        ? jobs.length - 1
        : jobs.findIndex((job) => job._id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    // Dropping a card where it was picked up should not write.
    const origin = snapshot ? columnHolding(snapshot, activeJobId) : undefined
    const originIndex = origin
      ? jobsOf(origin).findIndex((job) => job._id === activeJobId)
      : -1

    if (origin?._id === column._id && originIndex === newIndex) {
      if (snapshot) restoreColumns(snapshot)
      return
    }

    const result = await moveJob(
      activeJobId,
      column._id,
      newIndex,
      snapshot ?? undefined,
    )

    if (result.error) {
      toast.error("Could not move the application", {
        description: result.error,
      })
    }
  }

  const activeJob = sortedColumns
    .flatMap((col) => col.jobApplications || [])
    .find((job) => job._id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <BoardStats columns={columns} addedThisWeek={addedThisWeek} />
        <div className="scrollbar-board flex gap-4 overflow-x-auto pb-4">
          {sortedColumns.map((col, index) => {
            return (
              <DroppableColumn
                key={col._id}
                column={col}
                config={columnConfigAt(index)}
                boardId={board._id}
                sortedColumns={sortedColumns}
                canDelete={columns.length > 1}
                onDelete={deleteColumn}
                onRename={renameColumn}
              />
            )
          })}
          <CreateColumnDialog onCreate={createColumn} />
        </div>
      </div>
      <DragOverlay>
        {activeJob ? (
          <div className="cursor-grabbing shadow-2xl rounded-xl">
            <JobApplicationCard job={activeJob} columns={sortedColumns} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
