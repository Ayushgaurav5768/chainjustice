"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts"
import GlassCard from "@/components/glass-card"
import PageHeader from "@/components/page-header"
import Input from "@/components/ui/input"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { fetchVerdictLedger } from "@/lib/solana"
import { mockModels } from "@/lib/mock-data"
import { ADVISORY_DISCLAIMER } from "@/lib/constants"
import type { ModelAccountabilityRecord, RiskLevel, VerdictLedgerEntry } from "@/types"
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  Gavel,
  Scale,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"

const chartConfig = {
  trust: { label: "Trust", color: "oklch(0.7 0.16 195)" },
  disagreement: { label: "Disagreement", color: "oklch(0.72 0.18 78)" },
}

const fallbackLedgerModels: ModelAccountabilityRecord[] = [
  {
    modelId: "model-007",
    modelName: "GPT-Vision Pro",
    provider: "Vision Labs",
    category: "Multimodal",
    trustScore: 72,
    trustTrend: "down",
    insurancePoolBalance: "8,500 SOL",
    caseCount: 9,
    upheldComplaints: 4,
    dismissedComplaints: 3,
    pendingCases: 2,
    lastVerdict: "plaintiff",
    riskBadge: "medium",
    trustHistory: [
      { label: "Jan", score: 84 },
      { label: "Feb", score: 80 },
      { label: "Mar", score: 76 },
      { label: "Apr", score: 72 },
    ],
    timeline: [
      { caseId: "CJ-2024-001", verdict: "plaintiff", trustDelta: -6, recordedAt: "2024-03-30T17:31:00Z" },
      { caseId: "CJ-2024-042", verdict: "plaintiff", trustDelta: -4, recordedAt: "2024-03-28T14:22:00Z" },
      { caseId: "CJ-2024-039", verdict: "defendant", trustDelta: 1, recordedAt: "2024-03-25T09:10:00Z" },
    ],
    precedentLinks: ["CJ-2024-001", "CJ-2024-042", "CJ-2024-035"],
    humanOverrideScore: 34,
    aiDisagreementHistory: [
      { label: "W1", value: 45 },
      { label: "W2", value: 52 },
      { label: "W3", value: 40 },
      { label: "W4", value: 56 },
      { label: "W5", value: 48 },
    ],
    evidenceCredibilitySummary: { averageScore: 78, weakEvidenceShare: 19 },
    recurringHarmPatterns: [
      { pattern: "Privacy leakage", count: 3 },
      { pattern: "Undisclosed retention", count: 2 },
    ],
  },
  {
    modelId: "model-006",
    modelName: "CodeAssist Pro",
    provider: "DevTools Inc",
    category: "Code Generation",
    trustScore: 91,
    trustTrend: "up",
    insurancePoolBalance: "10,000 SOL",
    caseCount: 6,
    upheldComplaints: 1,
    dismissedComplaints: 4,
    pendingCases: 1,
    lastVerdict: "defendant",
    riskBadge: "low",
    trustHistory: [
      { label: "Jan", score: 88 },
      { label: "Feb", score: 89 },
      { label: "Mar", score: 90 },
      { label: "Apr", score: 91 },
    ],
    timeline: [
      { caseId: "CJ-2024-018", verdict: "defendant", trustDelta: 2, recordedAt: "2024-03-01T11:00:00Z" },
      { caseId: "CJ-2024-028", verdict: "split", trustDelta: 1, recordedAt: "2024-03-15T08:30:00Z" },
    ],
    precedentLinks: ["CJ-2024-018", "CJ-2024-028"],
    humanOverrideScore: 21,
    aiDisagreementHistory: [
      { label: "W1", value: 20 },
      { label: "W2", value: 23 },
      { label: "W3", value: 18 },
      { label: "W4", value: 26 },
      { label: "W5", value: 19 },
    ],
    evidenceCredibilitySummary: { averageScore: 86, weakEvidenceShare: 8 },
    recurringHarmPatterns: [{ pattern: "Spec ambiguity", count: 1 }],
  },
]

const riskColor: Record<RiskLevel, string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-white border-destructive/70",
}

const verdictLabel = {
  plaintiff: "Complaint Upheld",
  defendant: "Complaint Dismissed",
  split: "Split Outcome",
}

const formatShortDate = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

const parseSol = (value: string): number => Number(value.replace(/[^0-9.]/g, ""))

const trustDelta = (history: ModelAccountabilityRecord["trustHistory"]): number => {
  if (history.length < 2) return 0
  return history[history.length - 1].score - history[history.length - 2].score
}

const buildFromLedger = (entries: VerdictLedgerEntry[]): ModelAccountabilityRecord[] => {
  const modelLookup = new Map(mockModels.map((model) => [model.id, model]))

  const grouped = new Map<string, VerdictLedgerEntry[]>()
  for (const entry of entries) {
    const key = entry.modelId || entry.modelName
    const next = grouped.get(key) || []
    next.push(entry)
    grouped.set(key, next)
  }

  const output: ModelAccountabilityRecord[] = []

  grouped.forEach((modelEntries, key) => {
    const sorted = [...modelEntries].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    const latest = sorted[sorted.length - 1]
    const modelMeta = modelLookup.get(latest.modelId)
    const trustHistory = sorted.map((item, idx) => ({
      label: `V${idx + 1}`,
      score: item.trustScoreAfter,
    }))

    const upheld = sorted.filter((item) => item.verdict === "plaintiff").length
    const dismissed = sorted.filter((item) => item.verdict === "defendant").length
    const trustScore = latest.trustScoreAfter
    const trendDirection =
      trustHistory.length > 1
        ? trustHistory[trustHistory.length - 1].score > trustHistory[trustHistory.length - 2].score
          ? "up"
          : trustHistory[trustHistory.length - 1].score < trustHistory[trustHistory.length - 2].score
            ? "down"
            : "flat"
        : "flat"

    const riskBadge: RiskLevel =
      trustScore >= 85 ? "low" : trustScore >= 65 ? "medium" : trustScore >= 45 ? "high" : "critical"

    const seed = key.length
    const disagreementBase = 20 + (seed % 35)

    output.push({
      modelId: latest.modelId,
      modelName: latest.modelName,
      provider: modelMeta?.developer || "Unknown provider",
      category: modelMeta?.category || "General",
      trustScore,
      trustTrend: trendDirection,
      insurancePoolBalance: latest.insurancePoolAfter,
      caseCount: sorted.length,
      upheldComplaints: upheld,
      dismissedComplaints: dismissed,
      pendingCases: Math.max(0, Math.round(sorted.length * 0.3) - 1),
      lastVerdict: latest.verdict,
      riskBadge,
      trustHistory,
      timeline: sorted
        .slice()
        .reverse()
        .map((item) => ({
          caseId: item.caseId,
          verdict: item.verdict,
          trustDelta: item.trustDelta,
          recordedAt: item.recordedAt,
        })),
      precedentLinks: sorted.slice(-3).map((item) => item.caseId),
      humanOverrideScore: 25 + (seed % 45),
      aiDisagreementHistory: Array.from({ length: 6 }).map((_, idx) => ({
        label: `W${idx + 1}`,
        value: Math.min(95, disagreementBase + ((idx % 2 === 0 ? -1 : 1) * (idx + 2))),
      })),
      evidenceCredibilitySummary: {
        averageScore: Math.max(45, 90 - upheld * 4),
        weakEvidenceShare: Math.min(60, 8 + upheld * 6),
      },
      recurringHarmPatterns: [
        { pattern: "Privacy or consent ambiguity", count: Math.max(1, upheld) },
        { pattern: "Safety policy mismatch", count: Math.max(1, Math.floor(upheld / 2) + 1) },
      ],
    })
  })

  return output.length > 0 ? output : fallbackLedgerModels
}

export default function VerdictLedgerPage() {
  const [records, setRecords] = useState<ModelAccountabilityRecord[]>(fallbackLedgerModels)
  const [query, setQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all")
  const [verdictFilter, setVerdictFilter] = useState<"all" | ModelAccountabilityRecord["lastVerdict"]>("all")
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [source, setSource] = useState<"anchor" | "mock">("mock")
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetchVerdictLedger()
        if (!mounted) return

        setRecords(buildFromLedger(response.data))
        setSource(response.source)
        setState(response.success ? "ready" : "error")
      } catch {
        if (!mounted) return
        setRecords(fallbackLedgerModels)
        setSource("mock")
        setState("error")
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((item) => {
      const hit =
        !q ||
        item.modelName.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      const riskHit = riskFilter === "all" || item.riskBadge === riskFilter
      const verdictHit = verdictFilter === "all" || item.lastVerdict === verdictFilter
      return hit && riskHit && verdictHit
    })
  }, [query, records, riskFilter, verdictFilter])

  const selected = useMemo(
    () => records.find((item) => item.modelId === selectedModelId) || null,
    [records, selectedModelId]
  )

  const headlineStats = useMemo(() => {
    const totalModels = filtered.length
    const avgTrust =
      totalModels > 0
        ? Math.round(filtered.reduce((sum, item) => sum + item.trustScore, 0) / totalModels)
        : 0
    const totalCases = filtered.reduce((sum, item) => sum + item.caseCount + item.pendingCases, 0)
    const totalInsurance = filtered.reduce((sum, item) => sum + parseSol(item.insurancePoolBalance), 0)
    const totalUpheld = filtered.reduce((sum, item) => sum + item.upheldComplaints, 0)

    return { totalModels, avgTrust, totalCases, totalInsurance, totalUpheld }
  }, [filtered])

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-8 sm:p-10">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute right-10 top-0 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-56 w-56 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative space-y-6">
          <Badge variant="outline" className="border-cyan/40 bg-cyan/10 text-cyan">
            Public AI Accountability Registry
          </Badge>

          <div>
            <h1 className="text-pretty text-3xl font-bold tracking-tight sm:text-5xl">
              Verdict Ledger / AI Credit Bureau
            </h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
              A serious, public-facing accountability index that tracks model trust, complaint outcomes,
              insurance resilience, and juror-led enforcement history.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <GlassCard className="p-4" glow="cyan">
              <p className="text-xs text-muted-foreground">Models Tracked</p>
              <p className="mt-1 text-2xl font-bold text-cyan">{headlineStats.totalModels}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground">Average Trust Score</p>
              <p className="mt-1 text-2xl font-bold">{headlineStats.avgTrust}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground">Cases Indexed</p>
              <p className="mt-1 text-2xl font-bold">{headlineStats.totalCases}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground">Upheld Complaints</p>
              <p className="mt-1 text-2xl font-bold text-warning">{headlineStats.totalUpheld}</p>
            </GlassCard>
            <GlassCard className="p-4" glow="violet">
              <p className="text-xs text-muted-foreground">Insurance Coverage</p>
              <p className="mt-1 text-2xl font-bold text-violet">{headlineStats.totalInsurance.toLocaleString()} SOL</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <PageHeader
        title="Model Accountability Index"
        description="Search, filter, and inspect trust and enforcement records with juror-final authority."
      >
        <Badge
          variant="outline"
          className={source === "anchor" ? "border-success/40 text-success" : "border-warning/40 text-warning"}
        >
          {source === "anchor" ? "Live on-chain source" : "Fallback demo source"}
        </Badge>
      </PageHeader>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search model, provider, or category"
              className="bg-secondary/50 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "low", "medium", "high", "critical"] as const).map((risk) => (
              <Button
                key={risk}
                size="sm"
                variant={riskFilter === risk ? "default" : "outline"}
                onClick={() => setRiskFilter(risk)}
                className={riskFilter === risk ? "bg-cyan text-primary-foreground" : ""}
              >
                {risk === "all" ? "All risk" : risk}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "plaintiff", "defendant", "split"] as const).map((verdict) => (
              <Button
                key={verdict}
                size="sm"
                variant={verdictFilter === verdict ? "default" : "outline"}
                onClick={() => setVerdictFilter(verdict)}
                className={verdictFilter === verdict ? "bg-violet text-primary-foreground" : ""}
              >
                {verdict === "all" ? "All verdicts" : verdictLabel[verdict]}
              </Button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {state === "loading" ? (
          <div className="space-y-3 p-6">
            <div className="h-12 animate-pulse rounded bg-border/30" />
            <div className="h-12 animate-pulse rounded bg-border/30" />
            <div className="h-12 animate-pulse rounded bg-border/30" />
            <div className="h-12 animate-pulse rounded bg-border/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No models match current filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("")
                setRiskFilter("all")
                setVerdictFilter("all")
              }}
              className="mt-3"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Upheld</TableHead>
                <TableHead>Dismissed</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Last Verdict</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const delta = trustDelta(item.trustHistory)
                return (
                  <TableRow
                    key={item.modelId}
                    className="cursor-pointer"
                    onClick={() => setSelectedModelId(item.modelId)}
                  >
                    <TableCell>
                      <p className="font-medium">{item.modelName}</p>
                      <p className="text-xs text-muted-foreground">{item.provider} / {item.category}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{item.trustScore}</span>
                    </TableCell>
                    <TableCell>
                      {item.trustTrend === "up" && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          +{Math.max(0, delta)}
                        </span>
                      )}
                      {item.trustTrend === "down" && (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <TrendingDown className="h-4 w-4" />
                          {Math.min(0, delta)}
                        </span>
                      )}
                      {item.trustTrend === "flat" && <span className="text-muted-foreground">0</span>}
                    </TableCell>
                    <TableCell className="text-cyan">{item.insurancePoolBalance}</TableCell>
                    <TableCell>{item.caseCount}</TableCell>
                    <TableCell>{item.upheldComplaints}</TableCell>
                    <TableCell>{item.dismissedComplaints}</TableCell>
                    <TableCell>{item.pendingCases}</TableCell>
                    <TableCell>{verdictLabel[item.lastVerdict]}</TableCell>
                    <TableCell>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${riskColor[item.riskBadge]}`}>
                        {item.riskBadge}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      {state === "error" && (
        <GlassCard className="border-warning/40 p-4">
          <p className="text-sm text-warning">
            Live on-chain fetch was unavailable. Showing demo accountability data so the registry stays fully usable.
          </p>
        </GlassCard>
      )}

      <GlassCard className="border-violet/30 bg-violet/5 p-4">
        <p className="text-xs text-muted-foreground">
          {ADVISORY_DISCLAIMER} Human jurors make final decisions, and this registry records those outcomes as public accountability signals.
        </p>
      </GlassCard>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 sm:p-4" onClick={() => setSelectedModelId(null)}>
          <motion.aside
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full overflow-y-auto border-l border-border/40 bg-background p-5 sm:max-w-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{selected.modelName}</h3>
                <p className="text-sm text-muted-foreground">{selected.provider} / {selected.category}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedModelId(null)}>
                <X className="mr-1 h-4 w-4" />Close
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Case Count</p>
                <p className="mt-1 text-xl font-bold">{selected.caseCount}</p>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Upheld Complaints</p>
                <p className="mt-1 text-xl font-bold text-warning">{selected.upheldComplaints}</p>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Pending Cases</p>
                <p className="mt-1 text-xl font-bold text-cyan">{selected.pendingCases}</p>
              </GlassCard>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Human Override Score</p>
                <p className="mt-1 text-xl font-bold text-violet">{selected.humanOverrideScore ?? 0}%</p>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Evidence Credibility</p>
                <p className="mt-1 text-xl font-bold text-cyan">{selected.evidenceCredibilitySummary?.averageScore ?? 0}</p>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs text-muted-foreground">Weak Evidence Share</p>
                <p className="mt-1 text-xl font-bold text-warning">{selected.evidenceCredibilitySummary?.weakEvidenceShare ?? 0}%</p>
              </GlassCard>
            </div>

            <GlassCard className="mt-4 p-4" glow="cyan">
              <p className="text-sm font-semibold">Insurance Pool Status</p>
              <p className="mt-2 text-2xl font-bold text-cyan">{selected.insurancePoolBalance}</p>
              <p className="text-xs text-muted-foreground">Coverage adequacy vs complaint pressure</p>
              <Progress value={Math.max(10, Math.min(95, selected.trustScore))} className="mt-3" />
            </GlassCard>

            <GlassCard className="mt-4 p-4">
              <p className="text-sm font-semibold">Trust Score Change</p>
              <ChartContainer config={chartConfig} className="mt-3 h-52 w-full">
                <LineChart data={selected.trustHistory}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-trust)" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartContainer>
            </GlassCard>

            {selected.aiDisagreementHistory && selected.aiDisagreementHistory.length > 0 && (
              <GlassCard className="mt-4 p-4">
                <p className="text-sm font-semibold">Juror / AI Disagreement Insight</p>
                <ChartContainer config={chartConfig} className="mt-3 h-44 w-full">
                  <AreaChart data={selected.aiDisagreementHistory}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="value" stroke="var(--color-disagreement)" fill="var(--color-disagreement)" fillOpacity={0.25} />
                  </AreaChart>
                </ChartContainer>
              </GlassCard>
            )}

            <GlassCard className="mt-4 p-4">
              <p className="text-sm font-semibold">Timeline / Verdict History</p>
              <div className="mt-3 space-y-3">
                {selected.timeline.map((item) => (
                  <div key={`${item.caseId}-${item.recordedAt}`} className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/20 p-3">
                    <Scale className="mt-0.5 h-4 w-4 text-cyan" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.caseId} / {verdictLabel[item.verdict]}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(item.recordedAt)} / Trust delta {item.trustDelta > 0 ? `+${item.trustDelta}` : item.trustDelta}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/case/${item.caseId}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {selected.recurringHarmPatterns && selected.recurringHarmPatterns.length > 0 && (
              <GlassCard className="mt-4 p-4">
                <p className="text-sm font-semibold">Recurring Harm Patterns</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.recurringHarmPatterns.map((item) => (
                    <span key={item.pattern} className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs text-warning">
                      {item.pattern} ({item.count})
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard className="mt-4 p-4">
              <p className="text-sm font-semibold">Precedent Links</p>
              <div className="mt-2 space-y-1">
                {selected.precedentLinks.map((caseId) => (
                  <Link key={caseId} href={`/case/${caseId}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm text-cyan hover:bg-cyan/10">
                    {caseId}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </GlassCard>
          </motion.aside>
        </div>
      )}

      <GlassCard className="border-cyan/30 bg-cyan/5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-cyan">Public Accountability Commitment</p>
            <p className="text-xs text-muted-foreground">
              This registry is designed to make model behavior legible to courts, regulators, builders, and the public.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-cyan" />Transparent</span>
            <span className="inline-flex items-center gap-1"><Gavel className="h-3.5 w-3.5 text-violet" />Juror-governed</span>
            <span className="inline-flex items-center gap-1"><Bot className="h-3.5 w-3.5 text-warning" />AI-advisory only</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
