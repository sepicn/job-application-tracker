"use server"

import { getSession } from "../auth/auth"
import connectDB from "../db"
import { Board, Column, JobApplication } from "../models"
import { revalidatePath } from "next/cache"
import {
  CreateJobApplicationInput,
  UpdateJobApplicationInput,
  createJobApplicationSchema,
  formatIssues,
  objectIdSchema,
  updateJobApplicationSchema,
} from "../validation/job-applications"

export async function createJobApplication(data: CreateJobApplicationInput) {
  const session = await getSession()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  await connectDB()

  const parsed = createJobApplicationSchema.safeParse(data)

  if (!parsed.success) {
    return { error: formatIssues(parsed.error) }
  }

  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description,
  } = parsed.data

  //  Verify board ownership
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  })

  if (!board) {
    return { error: "Board not found" }
  }

  // Verify column ownership

  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId,
  })

  if (!column) {
    return { error: "Column not found" }
  }

  const maxOrder =
    ((await JobApplication.findOne({ columnId })
      .sort({ order: -1 })
      .select("order")
      .lean()) as { order: number }) || null

  const jobApplication = await JobApplication.create({
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    userId: session.user.id,
    tags: tags || [],
    description,
    status: "applied",
    order: maxOrder ? maxOrder.order + 1 : 0,
  })

  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  })

  revalidatePath("/dashboard")

  return { data: JSON.parse(JSON.stringify(jobApplication)) }
}

export async function updateJobApplication(
  id: string,
  updates: UpdateJobApplicationInput,
) {
  const session = await getSession()

  if (!session?.user) return { error: "Unauthorized" }

  await connectDB()

  const parsedId = objectIdSchema.safeParse(id)

  if (!parsedId.success) return { error: "Invalid job application id" }

  const parsed = updateJobApplicationSchema.safeParse(updates)

  if (!parsed.success) return { error: formatIssues(parsed.error) }

  const jobApplication = await JobApplication.findById(parsedId.data)

  if (!jobApplication) return { error: "Job application not found" }

  if (jobApplication.userId !== session.user.id)
    return { error: "Unauthorized" }

  const { columnId, order, ...otherUpdates } = parsed.data

  //  The job itself belongs to this user, but the destination column is
  //  caller-supplied. Without this check a crafted request could push the job
  //  into another user's column, where it would render on their board.
  if (columnId) {
    const targetColumn = await Column.findOne({
      _id: columnId,
      boardId: jobApplication.boardId,
    })

    if (!targetColumn) return { error: "Column not found" }
  }

  const updatesToApply: Partial<{
    company: string
    position: string
    location: string
    notes: string
    salary: string
    jobUrl: string
    columnId: string
    order: number
    tags: string[]
    description: string
  }> = otherUpdates

  const currentColumnId = jobApplication.columnId.toString()
  const newColumnId = columnId?.toString()

  const isMovingToDifferentColumn =
    newColumnId && newColumnId !== currentColumnId

  if (isMovingToDifferentColumn) {
    await Column.findByIdAndUpdate(currentColumnId, {
      $pull: { jobApplications: id },
    })

    const jobsInTargetColumn = await JobApplication.find({
      columnId: newColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean()

    let newOrderValue: number

    if (order !== undefined && order !== null) {
      newOrderValue = order * 100

      const jobsThatNeedToShift = jobsInTargetColumn.slice(order)
      for (const job of jobsThatNeedToShift) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        })
      }
    } else {
      if (jobsInTargetColumn.length > 0) {
        const lastJobOrder =
          jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0
        newOrderValue = lastJobOrder + 100
      } else {
        newOrderValue = 0
      }
    }

    updatesToApply.columnId = newColumnId
    updatesToApply.order = newOrderValue

    await Column.findByIdAndUpdate(newColumnId, {
      $push: { jobApplications: id },
    })
  } else if (order !== undefined && order !== null) {
    const otherJobsInColumn = await JobApplication.find({
      columnId: currentColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean()

    const currentJobOrder = jobApplication.order || 0
    const currentPositionIndex = otherJobsInColumn.findIndex(
      (job) => job.order > currentJobOrder,
    )
    const oldPositionIndex =
      currentPositionIndex === -1
        ? otherJobsInColumn.length
        : currentPositionIndex

    const newOrderValue = order * 100

    if (order < oldPositionIndex) {
      const jobsToShiftDown = otherJobsInColumn.slice(order, oldPositionIndex)

      for (const job of jobsToShiftDown) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        })
      }
    } else if (order > oldPositionIndex) {
      const jobsToShiftUp = otherJobsInColumn.slice(oldPositionIndex, order)

      for (const job of jobsToShiftUp) {
        const newOrder = Math.max(0, job.order - 100)
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: newOrder },
        })
      }
    }

    updatesToApply.order = newOrderValue
  }

  const updated = await JobApplication.findByIdAndUpdate(id, updatesToApply, {
    new: true,
  })

  revalidatePath("/dashboard")

  return { data: JSON.parse(JSON.stringify(updated)) }
}

export async function deleteJobApplication(id: string) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  await connectDB()

  const parsedId = objectIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "Invalid job application id" }
  }

  const jobApplication = await JobApplication.findById(parsedId.data)

  if (!jobApplication) {
    return { error: "Job application not found" }
  }

  if (jobApplication.userId !== session.user.id) {
    return { error: "Unauthorized" }
  }

  await Column.findByIdAndUpdate(jobApplication.columnId, {
    $pull: { jobApplications: id },
  })

  await JobApplication.findByIdAndDelete({ _id: id })

  revalidatePath("/dashboard")

  return { success: true }
}
