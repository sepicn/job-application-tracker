"use client"

import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("The two passwords do not match")
      return
    }

    if (!token) {
      setError("This link is missing its token. Request a new one.")
      return
    }

    setLoading(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setError(result.error.message ?? "Could not reset your password")
        return
      }

      toast.success("Password changed")
      router.push("/sign-in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-foreground">
            Choose a new password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            At least 8 characters.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Repeat password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || password.length < 8}
            >
              {loading ? "Saving..." : "Set new password"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Request a new link
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
