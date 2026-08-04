"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { useState } from "react"

interface CreateColumnDialogProps {
  onCreate: (name: string) => Promise<{ error?: string } | undefined>
}

export default function CreateColumnDialog({
  onCreate,
}: CreateColumnDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError("")
    setSaving(true)

    try {
      const result = await onCreate(name)

      if (result?.error) {
        setError(result.error)
        return
      }

      setName("")
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-w-60 h-12 shrink-0 justify-start border-dashed border-2 text-muted-foreground"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Column
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Column</DialogTitle>
            <DialogDescription>
              Add a stage to your board, such as Screening or Take-home.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="column-name">Name *</Label>
              <Input
                id="column-name"
                required
                maxLength={50}
                autoFocus
                placeholder="e.g. Screening"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Adding..." : "Add Column"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
