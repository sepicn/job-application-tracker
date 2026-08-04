"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          The page could not be loaded. Nothing was lost, so trying again is
          usually enough.
        </p>
        {/* The digest is how a server-side stack trace is found in the logs. */}
        {error.digest && (
          <p className="mb-8 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
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
