"use client"

import Image from "next/image"
import { Button } from "./ui/button"
import { useState } from "react"

const TABS = [
  {
    id: "organize",
    label: "Organize Applications",
    src: "/hero-images/hero1.png",
  },
  { id: "hired", label: "Get Hired", src: "/hero-images/hero2.png" },
  { id: "boards", label: "Manage Boards", src: "/hero-images/hero3.png" },
]

export default function ImageTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <section className="pb-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div
            role="tablist"
            aria-label="Product screenshots"
            className="mb-8 flex flex-wrap justify-center gap-2"
          >
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={tab.id === activeTab}
                variant={tab.id === activeTab ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="rounded-lg px-5 text-sm font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl shadow-xl ring-1 ring-foreground/10">
            <Image
              src={active.src}
              alt={active.label}
              width={1200}
              height={800}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
