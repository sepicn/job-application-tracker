"use client"
import { Column, JobAppication } from "@/lib/models/models.types"
import { Card, CardContent } from "./ui/card"
import {
  ExternalLink,
  MapPin,
  MoreVertical,
  Trash2,
  Wallet,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import {
  deleteJobApplication,
  updateJobApplication,
} from "@/lib/actions/job-applications"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import React, { useRef, useState } from "react"
import { toast } from "sonner"

interface JobAppicationCardProps {
  job: JobAppication
  columns: Column[]
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

// The card is also the drag handle, so a release after a drag still fires a
// click. Compare against where the pointer went down to tell the two apart.
const CLICK_SLOP = 6

export default function JobApplicationCard({
  job,
  columns,
  dragHandleProps,
}: JobAppicationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null)

  const [formData, setFormData] = useState({
    company: job.company,
    position: job.position,
    location: job.location || "",
    notes: job.notes || "",
    salary: job.salary || "",
    jobUrl: job.jobUrl || "",
    columnId: job.columnId || "",
    tags: job.tags?.join(", ") || "",
    description: job.description || "",
  })

  function openEditor() {
    setFormData({
      company: job.company,
      position: job.position,
      location: job.location || "",
      notes: job.notes || "",
      salary: job.salary || "",
      jobUrl: job.jobUrl || "",
      columnId: job.columnId || "",
      tags: job.tags?.join(", ") || "",
      description: job.description || "",
    })
    setIsConfirmingDelete(false)
    setIsEditing(true)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLElement>) {
    pointerDownAt.current = { x: e.clientX, y: e.clientY }
    dragHandleProps?.onPointerDown?.(e)
  }

  function handleClick(e: React.MouseEvent) {
    const start = pointerDownAt.current
    pointerDownAt.current = null

    if (!start) return

    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y)

    if (moved <= CLICK_SLOP) openEditor()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await updateJobApplication(job._id, {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      })

      if (result.error) {
        toast.error("Could not save your changes", {
          description: result.error,
        })
        return
      }

      setIsEditing(false)
      toast.success("Application updated")
    } catch (err) {
      console.error("Failed to edit job application", err)
      toast.error("Could not save your changes")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteJobApplication(job._id)

      if (result.error) {
        toast.error("Could not delete the application", {
          description: result.error,
        })
        return
      }

      setIsEditing(false)
      toast.success(`Deleted ${job.position}`)
    } catch (err) {
      console.error("Failed to delete job application", err)
      toast.error("Could not delete the application")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleMove(newColumnId: string) {
    try {
      const result = await updateJobApplication(job._id, {
        columnId: newColumnId,
      })

      if (result.error) {
        toast.error("Could not move the application", {
          description: result.error,
        })
      }
    } catch (err) {
      console.error("Failed to move job application", err)
      toast.error("Could not move the application")
    }
  }

  const hasMeta = Boolean(job.location || job.salary || job.jobUrl)
  const moveTargets = columns.filter((c) => c._id !== job.columnId)

  return (
    <>
      <Card
        {...dragHandleProps}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${job.position} at ${job.company}`}
        onKeyDown={(e) => {
          dragHandleProps?.onKeyDown?.(e)

          if (e.defaultPrevented) return

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openEditor()
          }
        }}
        className="cursor-pointer gap-0 py-0 shadow-sm transition-shadow outline-none select-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-md active:cursor-grabbing"
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm leading-snug font-semibold text-foreground">
                {job.position}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {job.company}
              </p>
            </div>
            {/* Keyboard-reachable equivalent of dragging the card. */}
            {moveTargets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mt-1 -mr-1 h-7 w-7 shrink-0 text-muted-foreground"
                      aria-label="Move this application"
                    />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moveTargets.map((column) => (
                    <DropdownMenuItem
                      key={column._id}
                      onClick={() => handleMove(column._id)}
                    >
                      Move to {column.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {job.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          )}

          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag, key) => (
                <span
                  key={key}
                  className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {hasMeta && (
            <div className="flex items-center gap-3 border-t pt-2.5 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
              )}
              {job.salary && (
                <span className="flex min-w-0 items-center gap-1">
                  <Wallet className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.salary}</span>
                </span>
              )}
              {job.jobUrl && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={job.jobUrl}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Open the job posting"
                  className="ml-auto shrink-0 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job Application</DialogTitle>
            <DialogDescription>
              Update the details of this application
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdate}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    required
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    placeholder="e.g., $100k - $150k"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job URL</Label>
                <Input
                  id="jobUrl"
                  placeholder="https://..."
                  value={formData.jobUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, jobUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="React, Tailwind, High Pay"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description of the role..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Your notes about the job..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Confirming inline rather than in a nested dialog, which would
                stack two modals and steal focus from this form. */}
            {/* The confirmation replaces the footer rather than joining it:
                four buttons in one row overflowed, and a Cancel sitting beside
                a delete prompt does not say what it cancels. */}
            <DialogFooter className="sm:items-center sm:justify-between">
              {isConfirmingDelete ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Delete this application permanently?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isDeleting}
                      onClick={() => setIsConfirmingDelete(false)}
                    >
                      Keep it
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={handleDelete}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isSaving}
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
