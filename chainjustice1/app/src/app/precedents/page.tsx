"use client"

import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import Input from "@/components/ui/input"
import StatusBadge from "@/components/status-badge"
import { BookOpenText, Scale, Search } from "lucide-react"

type Precedent = {
  id: string
  title: string
  category: string
  defendant: string
  verdict: "plaintiff" | "defendant" | "split"
  resolvedAt: string
  summary: string
}

const precedents: Precedent[] = [
  {
    id: "CJ-2024-042",
    title: "Unauthorized Data Collection",
    category: "Privacy Violation",
    defendant: "DataScraper AI",
    verdict: "plaintiff",
    resolvedAt: "2024-03-28",
    summary:
      "Model behavior exceeded declared data policy boundaries. Compensation granted and trust score reduced.",
  },
  {
    id: "CJ-2024-035",
    title: "Biased Output Generation",
    category: "Discrimination",
    defendant: "HireBot AI",
    verdict: "plaintiff",
    resolvedAt: "2024-03-22",
    summary:
      "Systematic bias pattern was verified across representative prompts and adverse outcomes.",
  },
  {
    id: "CJ-2024-018",
    title: "Deepfake Generation Policy Ambiguity",
    category: "Terms of Service",
    defendant: "FaceSwap AI",
    verdict: "defendant",
    resolvedAt: "2024-03-01",
    summary:
      "Policy language ambiguity prevented direct liability, but mitigation requirements were imposed.",
  },
  {
    id: "CJ-2024-012",
    title: "Data Exfiltration via Plugin Channel",
    category: "Security",
    defendant: "SecureBot",
    verdict: "plaintiff",
    resolvedAt: "2024-02-25",
    summary:
      "Security telemetry linked plugin path to unauthorized data transfer and user harm.",
  },
]

const verdictToStatus = {
  plaintiff: "success" as const,
  defendant: "rejected" as const,
  split: "warning" as const,
}

export default function PrecedentsPage() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return precedents.filter((item) => {
      if (!q) return true
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.defendant.toLowerCase().includes(q)
      )
    })
  }, [query])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Precedents"
        description="Search prior rulings to compare fact patterns, standards, and outcomes."
      />

      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="bg-secondary/50 pl-9"
            placeholder="Search by case ID, category, defendant, or title"
          />
        </div>
      </GlassCard>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Link key={item.id} href={`/case/${item.id}`}>
            <GlassCard className="p-5 transition-all hover:border-cyan/40" hover>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                      {item.category}
                    </span>
                    <StatusBadge
                      status={verdictToStatus[item.verdict]}
                      label={item.verdict === "plaintiff" ? "Plaintiff" : item.verdict === "defendant" ? "Defendant" : "Split"}
                      size="sm"
                    />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">vs. {item.defendant}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground sm:flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    {item.resolvedAt}
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan">
                    <BookOpenText className="h-3.5 w-3.5" />
                    Open case
                  </span>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No precedents found for your search.</p>
        </GlassCard>
      )}
    </div>
  )
}
