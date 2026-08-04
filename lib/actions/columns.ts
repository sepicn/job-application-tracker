"use server"

import { getSession } from "../auth/auth"
import connectDB from "../db"
import { Board, Column, JobApplication } from "../models"
import { revalidatePath } from "next/cache"
import { formatIssues, objectIdSchema } from "../validation/common"
import {
  CreateColumnInput,
  RenameColumnInput,
  createColumnSchema,
  renameColumnSchema,
} from "../validation/columns"

//  Board ownership is the only authorisation boundary here: a column is
//  reachable exactly when the board it belongs to is the caller's.
async function findOwnedColumn(id: string, userId: string) {
  const column = await Column.findById(id)

  if (!column) return { error: "Column not found" as const }

  const board = await Board.findOne({ _id: column.boardId, userId })

  if (!board) return { error: "Unauthorized" as const }

  return { column }
}

export async function createColumn(data: CreateColumnInput) {
  const session = await getSession()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  await connectDB()

  const parsed = createColumnSchema.safeParse(data)

  if (!parsed.success) {
    return { error: formatIssues(parsed.error) }
  }

  const { boardId, name } = parsed.data

  const board = await Board.findOne({ _id: boardId, userId: session.user.id })

  if (!board) {
    return { error: "Board not found" }
  }

  //  Append to the end. deleteColumn renumbers on removal, so the count is the
  //  next free position rather than something that can collide.
  const order = await Column.countDocuments({ boardId })

  const column = await Column.create({
    name,
    boardId,
    order,
    jobApplications: [],
  })

  await Board.findByIdAndUpdate(boardId, { $push: { columns: column._id } })

  revalidatePath("/dashboard")

  return { data: JSON.parse(JSON.stringify(column)) }
}

export async function renameColumn(data: RenameColumnInput) {
  const session = await getSession()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  await connectDB()

  const parsed = renameColumnSchema.safeParse(data)

  if (!parsed.success) {
    return { error: formatIssues(parsed.error) }
  }

  const { id, name } = parsed.data

  const owned = await findOwnedColumn(id, session.user.id)

  if ("error" in owned) return { error: owned.error }

  await Column.findByIdAndUpdate(id, { $set: { name } })

  revalidatePath("/dashboard")

  return { success: true }
}

export async function deleteColumn(id: string) {
  const session = await getSession()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  await connectDB()

  const parsedId = objectIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "Invalid column id" }
  }

  const owned = await findOwnedColumn(parsedId.data, session.user.id)

  if ("error" in owned) return { error: owned.error }

  const { column } = owned

  //  A board needs at least one column to stay usable
  const columnCount = await Column.countDocuments({ boardId: column.boardId })

  if (columnCount <= 1) {
    return { error: "Cannot delete the last column" }
  }

  await JobApplication.deleteMany({ columnId: id })

  await Board.findByIdAndUpdate(column.boardId, {
    $pull: { columns: id },
  })

  await Column.findByIdAndDelete(id)

  //  Close the gap in ordering left by the deleted column
  const remaining = await Column.find({ boardId: column.boardId })
    .sort({ order: 1 })
    .lean()

  for (const [index, col] of remaining.entries()) {
    if (col.order !== index) {
      await Column.findByIdAndUpdate(col._id, { $set: { order: index } })
    }
  }

  revalidatePath("/dashboard")

  return { success: true }
}
