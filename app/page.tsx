import ImageTabs from "@/components/image-tabs"
import SiteFooter from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Columns3,
  FileText,
  LayoutGrid,
  MousePointerClick,
  PieChart,
  Tags,
} from "lucide-react"
import Link from "next/link"

const STEPS = [
  {
    title: "Add the role",
    body: "Company, position, salary, a link back to the posting, and whatever notes you want to remember.",
  },
  {
    title: "Move it as it moves",
    body: "Drag the card from Wish List to Applied to Interviewing. The board is the status.",
  },
  {
    title: "See where you stand",
    body: "A running count per stage tells you whether you are applying enough or waiting too long.",
  },
]

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Drag and drop that behaves",
    body: "Cards open a gap where they will land, and a move that fails to save puts the card back instead of lying to you.",
  },
  {
    icon: Columns3,
    title: "Columns you define",
    body: "Rename the defaults or add your own. A take-home stage, a recruiter-screen stage, whatever your search actually looks like.",
  },
  {
    icon: Tags,
    title: "Tags",
    body: "Label roles by stack, seniority, or how much you want them, then find them again.",
  },
  {
    icon: FileText,
    title: "Notes and salary",
    body: "Keep the recruiter's name, the take-home brief, and the number in the same place as the application.",
  },
  {
    icon: PieChart,
    title: "A read on your pipeline",
    body: "Totals per stage and a count of what you added this week, so a quiet fortnight is visible.",
  },
  {
    icon: LayoutGrid,
    title: "One board, no setup",
    body: "Sign up and the board is already there, with five sensible stages waiting.",
  },
]

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. There is no paid tier, no trial timer, and no card required to sign up.",
  },
  {
    q: "Who can see my applications?",
    a: "Only you. Every board is scoped to the account that created it, and nothing is shared or published.",
  },
  {
    q: "Do I have to use the default stages?",
    a: "No. Rename them, delete the ones you do not need, or add your own. The board only requires that one column remains.",
  },
  {
    q: "What happens if I delete a column?",
    a: "The applications in it are deleted with it. You are told how many before it happens.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-24 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              Free forever, no card required
            </p>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance text-foreground sm:text-6xl">
              A better way to track your job applications.
            </h1>
            <p className="mb-10 text-xl text-pretty text-muted-foreground">
              A spreadsheet forgets which of the eleven roles you already heard
              back from. A board does not. Capture, organise, and move your
              search forward in one place.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base font-medium">
                  Start for free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-medium"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ImageTabs />

        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Three steps, then it stays out of your way
              </h2>
              <p className="text-lg text-muted-foreground">
                The point of a tracker is that maintaining it costs less than
                forgetting.
              </p>
            </div>
            <ol className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything the search actually needs
              </h2>
              <p className="text-lg text-muted-foreground">
                And nothing it does not.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl bg-card p-6 ring-1 ring-foreground/10"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Questions
              </h2>
              <dl className="divide-y divide-border">
                {FAQ.map((item) => (
                  <div key={item.q} className="py-6">
                    <dt className="mb-2 font-semibold text-foreground">
                      {item.q}
                    </dt>
                    <dd className="text-muted-foreground">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-14 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance text-primary-foreground sm:text-4xl">
                Your next application deserves better than a spreadsheet
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
                Sign up and your board is ready before you finish reading this.
              </p>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-8 text-base font-medium"
                >
                  Start for free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
