import { Briefcase } from "lucide-react"
import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Briefcase className="h-5 w-5 text-primary" />
          Job tracker
        </Link>
        <p className="text-sm text-muted-foreground">
          Built to make a job search feel less like guesswork.
        </p>
      </div>
    </footer>
  )
}
