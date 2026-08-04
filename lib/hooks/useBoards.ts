"use client"
import { useState } from "react"
import { Board, Column, JobAppication } from "../models/models.types"
import { updateJobApplication } from "@/lib/actions/job-applications"
import { deleteColumn as deleteColumnAction } from "@/lib/actions/columns"

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

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    const previousColumns = columns

    setError(null)
    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        jobApplications: [...col.jobApplications],
      }))

      //  Find and remove job from the old column

      let jobToMove: JobAppication | null = null
      let oldColumnId: string | null = null

      for (const col of newColumns) {
        const jobIndex = col.jobApplications.findIndex(
          (job) => job._id === jobApplicationId,
        )
        if (jobIndex !== -1 && jobIndex !== undefined) {
          jobToMove = col.jobApplications[jobIndex]
          oldColumnId = col._id
          col.jobApplications = col.jobApplications.filter(
            (job) => job._id !== jobApplicationId,
          )
          break
        }
      }
      if (jobToMove && oldColumnId) {
        const targetColumnIndex = newColumns.findIndex(
          (col) => col._id === newColumnId,
        )
        if (targetColumnIndex !== -1) {
          const targetColumn = newColumns[targetColumnIndex]
          const currentJobs = targetColumn.jobApplications || []

          const updatedJobs = [...currentJobs]

          updatedJobs.splice(newOrder, 0, {
            ...jobToMove,
            columnId: newColumnId,
            order: newOrder * 100,
          })

          const jobsWithUpdatedOrders = updatedJobs.map((job, index) => ({
            ...job,
            order: index * 100,
          }))

          newColumns[targetColumnIndex] = {
            ...targetColumn,
            jobApplications: jobsWithUpdatedOrders,
          }
        }
      }
      return newColumns
    })

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

  async function deleteColumn(columnId: string) {
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

  return { board, columns, error, moveJob, deleteColumn }
}
