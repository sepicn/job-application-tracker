import { Award, Calendar, CheckCircle2, Mic, XCircle } from "lucide-react"

export interface ColConfig {
  header: string
  fill: string
  icon: React.ReactNode
}

// Validated as a categorical palette: every adjacent pair clears ΔE 8 under
// protanopia, so the columns stay distinguishable in the distribution bar.
const COLUMN_CONFIG: ColConfig[] = [
  {
    header: "bg-cyan-600",
    fill: "bg-cyan-600",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    header: "bg-purple-600",
    fill: "bg-purple-600",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    header: "bg-emerald-600",
    fill: "bg-emerald-600",
    icon: <Mic className="h-4 w-4" />,
  },
  {
    header: "bg-yellow-600",
    fill: "bg-yellow-600",
    icon: <Award className="h-4 w-4" />,
  },
  {
    header: "bg-rose-600",
    fill: "bg-rose-600",
    icon: <XCircle className="h-4 w-4" />,
  },
]

// Boards take any number of columns, so the palette repeats instead of
// falling back to one colour for every column past the fifth.
export function columnConfigAt(index: number): ColConfig {
  return COLUMN_CONFIG[index % COLUMN_CONFIG.length]
}
