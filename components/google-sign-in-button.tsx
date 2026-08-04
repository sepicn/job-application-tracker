"use client"

import { authClient } from "@/lib/auth/auth-client"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner"

export default function GoogleSignInButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    try {
      // Redirects on success, so there is no result to branch on.
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      console.error("Google sign in failed", err)
      toast.error("Could not reach Google")
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={handleClick}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.06 12.25c0-.82-.07-1.6-.21-2.36H12v4.47h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.49Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.1 0 5.7-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.75H1.7v2.98A11.5 11.5 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.55 14.67a6.9 6.9 0 0 1 0-4.4V7.29H1.7a11.5 11.5 0 0 0 0 10.36l3.85-2.98Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.28 15.09 0 12 0 7.5 0 3.62 2.57 1.7 6.32l3.85 2.98C6.46 6.57 9 4.75 12 4.75Z"
        />
      </svg>
      {loading ? "Redirecting..." : label}
    </Button>
  )
}
