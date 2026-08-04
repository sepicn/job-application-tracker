"use client"
import { useState } from "react"
import { Board, Column, JobAppication } from "../models/models.types"
import { updateJobApplication } from "@/lib/actions/job-applications"
import {
  createColumn as createColumnAction,
  deleteColumn as deleteColumnAction,
  renameColumn as renameColumnAction,
} from "@/lib/actions/columns"

//  Removes the job from whichever column holds it and re-inserts it into the
//  target at `targetIndex`, renumbering that column so `order` stays in step
//  with the rendered sequence. Pure, so it can drive both the live drag preview
//  and the persisted move.
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

//  Every mutation reports the same way, so callers can check `error` without
//  narrowing a union per call site.
export type BoardActionResult = { error?: string; success?: boolean }

export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null)
  const [columns, setColumns] = useState<Column[]>(initialBoard?.columns || [])
  const [error, setError] = useState<string | null>(null)

  //  The server re-renders this page after each mutation and hands down a new
  //  board object. Adopting it during render rather than from an effect lets
  //  React finish in a single pass, instead of painting the stale board and
  //  then immediately re-rendering.
  //  https://react.dev/learn/you-might-not-need-an-effect
  const [seenBoard, setSeenBoard] = useState(initialBoard)

  if (initialBoard && initialBoard !== seenBoard) {
    setSeenBoard(initialBoard)
    setBoard(initialBoard)
    setColumns(initialBoard.columns || [])
  }

  //  Applies a move to local state only. Called repeatedly while a card is
  //  dragged over another column, so the target column opens a gap for it.
  function previewMoveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    setColumns((prev) =>
      withJobMoved(prev, jobApplicationId, newColumnId, newOrder),
    )
  }

  //  Puts the board back to a snapshot taken before a drag started.
  function restoreColumns(snapshot: Column[]) {
    setColumns(snapshot)
  }

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
    //  During a drag, `columns` already holds the preview, so the caller passes
    //  the pre-drag snapshot to roll back to instead.
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

      //  The action reports refusals in its return value rather than by
      //  throwing, so the catch below never sees them.
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

  //  Not optimistic: the column's _id is generated server-side and every child
  //  keys off it, so there is nothing meaningful to render until it comes back.
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
