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

async function DashboardPage() {
  //  Resolve the session first: querying the board with an empty userId hits
  //  the database on behalf of a request that is about to be redirected away.
  const session = await getSession()

  if (!session?.user) {
    redirect("/sign-in")
  }

  const board = await getBoard(session.user.id)

  //  The board is created by a Better Auth hook on sign-up. If that hook
  //  failed, rendering board.name would throw, so say what happened instead.
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
        <KanbanBoard board={board} />
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
