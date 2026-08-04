"use client"

import { authClient } from "@/lib/auth/auth-client"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import ThemeToggle from "./theme-toggle"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface SettingsSectionsProps {
  name: string
  email: string
}

export default function SettingsSections({
  name: initialName,
  email: initialEmail,
}: SettingsSectionsProps) {
  const router = useRouter()

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)

    try {
      const result = await authClient.updateUser({ name: name.trim() })

      if (result.error) {
        toast.error("Could not update your name", {
          description: result.error.message,
        })
        return
      }

      toast.success("Name updated")
      router.refresh()
    } finally {
      setSavingName(false)
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)

    try {
      const result = await authClient.changeEmail({
        newEmail: email.trim(),
      })

      if (result.error) {
        toast.error("Could not change your email", {
          description: result.error.message,
        })
        return
      }

      toast.success("Email updated")
      router.refresh()
    } finally {
      setSavingEmail(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setSavingPassword(true)

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        // Anyone holding an older session no longer has the password that
        // created it, so those sessions should not survive the change.
        revokeOtherSessions: true,
      })

      if (result.error) {
        toast.error("Could not change your password", {
          description: result.error.message,
        })
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      toast.success("Password changed")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>The name shown on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleName}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={savingName || !name.trim() || name === initialName}
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            The address you sign in with. Changing it takes effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleEmail}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={savingEmail || !email.trim() || email === initialEmail}
            >
              {savingEmail ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Changing your password signs out every other device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                savingPassword || !currentPassword || newPassword.length < 8
              }
            >
              {savingPassword ? "Changing..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            System follows whatever your device is set to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  )
}
