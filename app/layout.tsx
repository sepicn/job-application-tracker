import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import ThemedToaster from "@/components/themed-toaster"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Job tracker — a better way to track job applications",
    template: "%s · Job tracker",
  },
  description:
    "Track every application on one board: capture roles, move them through your own stages, and see where your search actually stands.",
  openGraph: {
    title: "Job tracker",
    description:
      "Track every application on one board, from wish list to offer.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // next-themes sets the class on <html> before paint, which the server
    // render cannot know about.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
