import connectDB from "./db";
import { Board, Column } from "./models"

const DEFAULT_COLUMNS = [
  {
    name: "Wish List",
    order: 0,
  },
  {
    name: "Applied",
    order: 1,
  },
  {
    name: "Interviewing",
    order: 2,
  },
  {
    name: "Offer",
    order: 3,
  },
  {
    name: "Rejected",
    order: 4,
  },
]

export async function initializeUserBoard(userId: string) {
  try {

    await connectDB()

    // If the board already exists with its columns
    const existingBoard = await Board.findOne({ userId, name: "Job Hunt" })

    if (existingBoard?.columns.length) {
      return existingBoard
    }

    // Reuse a board left behind by a failed column creation, otherwise create one
    const board =
      existingBoard ??
      (await Board.create({
        name: "Job Hunt",
        userId,
        columns: [],
      }))

    // Create default columns

    const columns = await Promise.all(
      DEFAULT_COLUMNS.map((column) =>
        Column.create({
          name: column.name,
          order: column.order,
          boardId: board._id,
          jobApplications: [],
        })))

    board.columns = columns.map((col) => col._id)
    await board.save()

    return board

  } catch (err) {
    throw err
  }
}