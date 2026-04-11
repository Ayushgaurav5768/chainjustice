"use client"

import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"
import GlassCard from "@/components/glass-card"
import Input from "@/components/ui/input"
import PageHeader from "@/components/page-header"
import StatusBadge from "@/components/status-badge"
import TrustScore from "@/components/trust-score"
import { Search, Shield } from "lucide-react"

type ModelRecord = {
  id: string
  name: string
  provider: string
  category: string
  trustScore: number
  insuranceDeposit: string
  violations: number
  status: "active" | "warning" | "suspended"
}

const models: ModelRecord[] = [
  {
    id: "mdl-001",
    name: "SafeAI Core",
    provider: "SafeAI Labs",
    category: "Language",
    trustScore: 94,
    insuranceDeposit: "12,500 SOL",
    violations: 0,
    status: "active",
  },
  {
    id: "mdl-002",
    name: "GPT-Vision Pro",
    provider: "Vision Labs",
    category: "Vision",
    trustScore: 68,
    insuranceDeposit: "8,200 SOL",
    violations: 4,
    status: "warning",
  },
  {
    id: "mdl-003",
    name: "VoiceClone X",
    provider: "AudioAI Systems",
    category: "Audio",
    trustScore: 43,
    insuranceDeposit: "3,400 SOL",
    violations: 11,
    status: "suspended",
  },
  {
    id: "mdl-004",
    name: "CodeAssist Pro",
    provider: "DevTools Inc",
    category: "Code",
    trustScore: 91,
    insuranceDeposit: "9,900 SOL",
    violations: 1,
    status: "active",
  },
]

const statusMap = {
  active: "active" as const,
  warning: "warning" as const,
  suspended: "rejected" as const,
}

export default function RegistryPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ModelRecord["status"]>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all")

  const categories = useMemo(() => ["all", ...Array.from(new Set(models.map((item) => item.category)))], [])

  const filtered = useMemo(
    () =>
      models.filter((item) => {
        const q = query.trim().toLowerCase()
        const hit =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        const hitStatus = statusFilter === "all" || item.status === statusFilter
        const hitCategory = categoryFilter === "all" || item.category === categoryFilter
        return hit && hitStatus && hitCategory
      }),
    [categoryFilter, query, statusFilter]
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Registry"
        description="Browse registered AI models by provider, trust, insurance, and incident history."
      />

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="bg-secondary/50 pl-9"
              placeholder="Search model, provider, or ID"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {filtered.map((item) => (
          <GlassCard key={item.id} className="p-5" hover>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] lg:items-center">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
                <p className="mt-1 text-base font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.provider} • {item.category}</p>
              </div>

              <div className="flex items-center gap-3">
                <TrustScore score={item.trustScore} size="sm" showLabel={false} />
                <div>
                  <p className="text-xs text-muted-foreground">Trust score</p>
                  <p className="font-semibold">{item.trustScore}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                  <Shield className="h-3.5 w-3.5" />{item.insuranceDeposit}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Violations</p>
                <p className={`mt-1 text-sm font-semibold ${item.violations > 7 ? "text-destructive" : item.violations > 2 ? "text-warning" : "text-success"}`}>
                  {item.violations}
                </p>
              </div>

              <div>
                <StatusBadge status={statusMap[item.status]} label={item.status === "suspended" ? "Suspended" : undefined} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No models match the current filters.</p>
        </GlassCard>
      )}
    </div>
  )
}
