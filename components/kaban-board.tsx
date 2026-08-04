"use client"

import { Board, Column, JobAppication } from "@/lib/models/models.types"
import {
  Award,
  Calendar,
  CheckCircle2,
  Mic,
  MoreVertical,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react"
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
import { useRef, useState } from "react"
import { toast } from "sonner"

interface KanbanBoardProps {
  board: Board
}

interface ColConfig {
  color: string
  icon: React.ReactNode
}

const COLUMN_CONFIG: Array<ColConfig> = [
  {
    color: "bg-cyan-500",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    color: "bg-purple-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    color: "bg-green-500",
    icon: <Mic className="h-4 w-4" />,
  },
  {
    color: "bg-yellow-500",
    icon: <Award className="h-4 w-4" />,
  },
  {
    color: "bg-red-500",
    icon: <XCircle className="h-4 w-4" />,
  },
]

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

  //  Array.sort mutates in place, so copy first: sorting column.jobApplications
  //  directly would reorder the caller's props during render.
  const sortedJobs = [...(column.jobApplications ?? [])].sort(
    (a, b) => a.order - b.order,
  )

  function openRename() {
    //  Seed from the current name each time, so a cancelled edit is discarded.
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
      <Card className="min-w-75 shrink-0 shadow-md p-0">
        <CardHeader
          className={`${config.color} text-white rounded-t-lg pb-3 pt-3`}
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
          //  The ring used to outline the whole 400px content box, so the empty
          //  area below the cards looked like a second, oversized placeholder.
          //  A tint says "droppable" without competing with the card-sized gap;
          //  the ring is kept only for empty columns, which have no gap to show.
          className={`space-y-2 pt-4 min-h-100 rounded-b-lg transition-colors ${
            isOver ? "bg-blue-50/60" : "bg-gray-50/50"
          } ${isOver && sortedJobs.length === 0 ? "ring-2 ring-inset ring-blue-400" : ""}`}
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
    //  Translate rather than Transform: the sorting strategy also returns
    //  scaleX/scaleY, and applying those stretches the card while it shifts.
    transform: CSS.Translate.toString(transform),
    transition,
    //  A DragOverlay already draws this card under the cursor, and dnd-kit
    //  deliberately leaves the source in place so its slot can act as the drop
    //  placeholder (see shouldDisplaceDragSource in @dnd-kit/sortable). Dimming
    //  it to 0.5 instead of hiding it showed both copies, which read as the
    //  placeholder being two cards tall.
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

export default function KanbanBoard({ board }: KanbanBoardProps) {
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

  //  Same reason as in DroppableColumn: sorting `columns` in place mutates the
  //  array held in useBoard state.
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
    //  Kept so the move can be undone if the drag is cancelled, and so a failed
    //  save rolls back to where the card actually started rather than to the
    //  last preview position.
    dragSnapshot.current = columns
    setActiveId(String(event.active.id))
  }

  //  Each column is its own SortableContext, and dnd-kit only shifts items
  //  inside the context holding the dragged item. Moving the job into the
  //  hovered column as it passes over is what makes that column open a gap.
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
    //  Reordering within one column is already handled by its SortableContext.
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

    //  handleDragOver has already moved the job into the hovered column, so the
    //  destination is read from current state, not from where the drag began.
    const column = columnHolding(columns, activeJobId)

    if (!column) return

    const jobs = jobsOf(column)
    const oldIndex = jobs.findIndex((job) => job._id === activeJobId)
    const newIndex =
      overId === column._id
        ? jobs.length - 1
        : jobs.findIndex((job) => job._id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    //  Picking a card up and dropping it back where it was should not write.
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

    //  The card has already snapped back at this point, which on its own looks
    //  like the drag simply did not take.
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedColumns.map((col, index) => {
            const config = COLUMN_CONFIG[index] || {
              color: "bg-cyan-500",
              icon: <Calendar className="h-4 w-4" />,
            }
            return (
              <DroppableColumn
                key={col._id}
                column={col}
                config={config}
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
          //  Solid and lifted: this is the card in hand, the placeholder in the
          //  list is what shows where it will land.
          <div className="cursor-grabbing shadow-2xl rounded-xl">
            <JobApplicationCard job={activeJob} columns={sortedColumns} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
