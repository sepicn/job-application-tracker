"use server"

import { getSession } from "../auth/auth"
import connectDB from "../db"
import { Board, Column, JobApplication } from "../models"
import { revalidatePath } from "next/cache"
import { objectIdSchema } from "../validation/job-applications"

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

  const column = await Column.findById(parsedId.data)

  if (!column) {
    return { error: "Column not found" }
  }

  //  Verify board ownership
  const board = await Board.findOne({
    _id: column.boardId,
    userId: session.user.id,
  })

  if (!board) {
    return { error: "Unauthorized" }
  }

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
