import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <SearchX className="h-7 w-7 text-accent-foreground" />
        </div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          This page does not exist
        </h1>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          The link may be out of date, or the page may have been removed. Your
          board is still where you left it.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg">Go to your board</Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline">
              Back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
