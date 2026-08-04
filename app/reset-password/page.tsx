import ResetPasswordForm from "@/components/reset-password-form"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = { title: "Reset password" }

export default function Page() {
  // useSearchParams reads the request, so it cannot sit in the static shell.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
