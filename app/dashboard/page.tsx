import KanbanBoard from "@/components/kaban-board"
import { getSession } from "@/lib/auth/auth"
import connectDB from "@/lib/db"
import { Board as BoardModel } from "@/lib/models"
import type { Board } from "@/lib/models/models.types"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function getBoard(userId: string) {
  "use cache"

  await connectDB()

  const boardDoc = await BoardModel.findOne({
    userId: userId,
    name: "Job Hunt",
  }).populate({
    path: "columns",
    populate: {
      path: "jobApplications",
    },
  })

  if (!boardDoc) return null

  const board: Board = JSON.parse(JSON.stringify(boardDoc))

  return board
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Counted here rather than in the client component: reading the clock during
// render is impure, and server and browser clocks would disagree anyway.
function countAddedThisWeek(board: Board) {
  const cutoff = Date.now() - WEEK_MS

  return board.columns
    .flatMap((col) => col.jobApplications ?? [])
    .filter(
      (job) => job.createdAt && new Date(job.createdAt).getTime() >= cutoff,
    ).length
}

async function DashboardPage() {
  // Before getBoard, which would otherwise query with an empty userId.
  const session = await getSession()

  if (!session?.user) {
    redirect("/sign-in")
  }

  const board = await getBoard(session.user.id)

  // Created by a Better Auth hook on sign-up; absent if that hook failed.
  if (!board) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold text-black">No board yet</h1>
          <p className="text-gray-600">
            We could not find a board for your account. Try reloading the page,
            or sign out and back in to have it created.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">{board.name}</h1>
          <p className="text-gray-600">Track your job applications</p>
        </div>
        <KanbanBoard board={board} addedThisWeek={countAddedThisWeek(board)} />
      </div>
    </div>
  )
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <DashboardPage />
    </Suspense>
  )
}
