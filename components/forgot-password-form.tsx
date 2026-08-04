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
import { useState } from "react"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })

      // Same result either way, so this cannot be used to probe for accounts.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-foreground">
            Forgot your password?
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {sent
              ? "Check your inbox."
              : "We will send you a link to choose a new one."}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, a reset link is
              on its way. The link expires in an hour.
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardContent className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                placeholder="johndoe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-primary hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
