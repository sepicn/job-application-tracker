"use client"
import { useState } from "react"
import { Board, Column, JobAppication } from "../models/models.types"
import { updateJobApplication } from "@/lib/actions/job-applications"
import {
  createColumn as createColumnAction,
  deleteColumn as deleteColumnAction,
  renameColumn as renameColumnAction,
} from "@/lib/actions/columns"

// Pure, so the drag preview and the persisted move stay in step.
export function withJobMoved(
  columns: Column[],
  jobApplicationId: string,
  targetColumnId: string,
  targetIndex: number,
): Column[] {
  const next = columns.map((col) => ({
    ...col,
    jobApplications: [...col.jobApplications],
  }))

  let jobToMove: JobAppication | null = null

  for (const col of next) {
    const jobIndex = col.jobApplications.findIndex(
      (job) => job._id === jobApplicationId,
    )

    if (jobIndex !== -1) {
      jobToMove = col.jobApplications[jobIndex]
      col.jobApplications.splice(jobIndex, 1)
      break
    }
  }

  const targetColumn = next.find((col) => col._id === targetColumnId)

  if (!jobToMove || !targetColumn) return columns

  const insertAt = Math.max(
    0,
    Math.min(targetIndex, targetColumn.jobApplications.length),
  )

  targetColumn.jobApplications.splice(insertAt, 0, {
    ...jobToMove,
    columnId: targetColumnId,
  })

  targetColumn.jobApplications = targetColumn.jobApplications.map(
    (job, index) => ({ ...job, order: index * 100 }),
  )

  return next
}

export type BoardActionResult = { error?: string; success?: boolean }

export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null)
  const [columns, setColumns] = useState<Column[]>(initialBoard?.columns || [])
  const [error, setError] = useState<string | null>(null)

  // Adopted during render, not in an effect, which would paint the stale
  // board first and re-render immediately after.
  const [seenBoard, setSeenBoard] = useState(initialBoard)

  if (initialBoard && initialBoard !== seenBoard) {
    setSeenBoard(initialBoard)
    setBoard(initialBoard)
    setColumns(initialBoard.columns || [])
  }

  // Local only: called on every pointer move across a column boundary.
  function previewMoveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    setColumns((prev) =>
      withJobMoved(prev, jobApplicationId, newColumnId, newOrder),
    )
  }

  function restoreColumns(snapshot: Column[]) {
    setColumns(snapshot)
  }

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
    // `columns` holds the drag preview by now, so callers pass the real origin.
    rollbackTo?: Column[],
  ): Promise<BoardActionResult> {
    const previousColumns = rollbackTo ?? columns

    setError(null)
    setColumns((prev) =>
      withJobMoved(prev, jobApplicationId, newColumnId, newOrder),
    )

    try {
      const result = await updateJobApplication(jobApplicationId, {
        columnId: newColumnId,
        order: newOrder,
      })

      // Refusals come back as a value, so the catch below never sees them.
      if (result.error) {
        setColumns(previousColumns)
        setError(result.error)
        return { error: result.error }
      }

      return { success: true }
    } catch (err) {
      console.error("Error", err)
      setColumns(previousColumns)
      setError("Failed to move job application")
      return { error: "Failed to move job application" }
    }
  }

  // Not optimistic: the server generates the _id everything else keys off.
  async function createColumn(name: string): Promise<BoardActionResult> {
    if (!board?._id) return { error: "No board loaded" }

    setError(null)

    try {
      const result = await createColumnAction({ boardId: board._id, name })

      if (result.error || !result.data) {
        const message = result.error ?? "Failed to create column"
        setError(message)
        return { error: message }
      }

      const created: Column = { ...result.data, jobApplications: [] }

      setColumns((prev) => [...prev, created])

      return { success: true }
    } catch (err) {
      console.error("Error", err)
      setError("Failed to create column")
      return { error: "Failed to create column" }
    }
  }

  async function renameColumn(
    columnId: string,
    name: string,
  ): Promise<BoardActionResult> {
    const previousColumns = columns

    setError(null)
    setColumns((prev) =>
      prev.map((col) => (col._id === columnId ? { ...col, name } : col)),
    )

    try {
      const result = await renameColumnAction({ id: columnId, name })

      if (result.error) {
        setColumns(previousColumns)
        setError(result.error)
        return { error: result.error }
      }

      return { success: true }
    } catch (err) {
      console.error("Error", err)
      setColumns(previousColumns)
      setError("Failed to rename column")
      return { error: "Failed to rename column" }
    }
  }

  async function deleteColumn(columnId: string): Promise<BoardActionResult> {
    const previousColumns = columns

    setError(null)
    setColumns((prev) => prev.filter((col) => col._id !== columnId))

    try {
      const result = await deleteColumnAction(columnId)

      if (result.error) {
        setColumns(previousColumns)
        setError(result.error)
        return { error: result.error }
      }

      return { success: true }
    } catch (err) {
      console.error("Error", err)
      setColumns(previousColumns)
      setError("Failed to delete column")
      return { error: "Failed to delete column" }
    }
  }

  return {
    board,
    columns,
    error,
    moveJob,
    previewMoveJob,
    restoreColumns,
    createColumn,
    renameColumn,
    deleteColumn,
  }
}
