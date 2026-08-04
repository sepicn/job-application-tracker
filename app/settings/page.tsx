import SettingsSections from "@/components/settings-sections"
import { getSession } from "@/lib/auth/auth"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Settings",
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and how the app looks.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

async function SettingsContent() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <SettingsSections name={session.user.name} email={session.user.email} />
  )
}

export default function SettingsPage() {
  return (
    <SettingsShell>
      {/* The session is per-request, so it cannot be part of the static shell. */}
      <Suspense
        fallback={
          <div className="space-y-6" aria-hidden>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </SettingsShell>
  )
}
