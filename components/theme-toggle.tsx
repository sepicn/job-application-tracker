"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export default function ThemeToggle({
  compact = false,
}: {
  compact?: boolean
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`inline-flex rounded-lg bg-muted p-1 ${
        compact ? "w-full gap-0.5" : "gap-1"
      }`}
    >
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          role="radio"
          aria-checked={theme === option.value}
          variant={theme === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(option.value)}
          className={compact ? "flex-1 px-0" : undefined}
          title={compact ? option.label : undefined}
        >
          <option.icon className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          {compact ? (
            <span className="sr-only">{option.label}</span>
          ) : (
            option.label
          )}
        </Button>
      ))}
    </div>
  )
}
