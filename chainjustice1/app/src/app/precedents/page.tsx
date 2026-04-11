"use client"

import type { ChangeEvent } from "react"
import { useState } from "react"
import Link from "next/link"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import StatCard from "@/components/stat-card"
import StatusBadge from "@/components/status-badge"
import {
  Search,
  Filter,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Calendar,
  Coins,
  FileText,
  ArrowUpDown,
} from "lucide-react"

interface Precedent {
  id: string
  title: string
  category: string
  defendant: string
  verdict: "plaintiff" | "dismissed" | "pending"
  filedAt: string
  resolvedAt: string | null
  compensation: string | null
  jurorCount: number
  summary: string
}

const mockPrecedents: Precedent[] = [
  {
    id: "CJ-2024-042",
    title: "Unauthorized Data Collection",
    category: "Privacy Violation",
    defendant: "DataScraper AI",
    verdict: "plaintiff",
    filedAt: "Mar 15, 2024",
    resolvedAt: "Mar 28, 2024",
    compensation: "2,500 SOL",
    jurorCount: 5,
    summary:
      "AI model found guilty of collecting user data without consent. Insurance payout awarded to plaintiff.",
  },
  {
    id: "CJ-2024-039",
    title: "Copyright Infringement",
    category: "Intellectual Property",
    defendant: "ArtGen Pro",
    verdict: "dismissed",
    filedAt: "Mar 10, 2024",
    resolvedAt: "Mar 25, 2024",
    compensation: null,
    jurorCount: 5,
    summary:
      "Insufficient evidence to prove the AI model directly copied copyrighted material. Case dismissed.",
  },
  {
    id: "CJ-2024-035",
    title: "Biased Output Generation",
    category: "Discrimination",
    defendant: "HireBot AI",
    verdict: "plaintiff",
    filedAt: "Mar 5, 2024",
    resolvedAt: "Mar 22, 2024",
    compensation: "1,800 SOL",
    jurorCount: 7,
    summary:
      "Model showed systematic bias against certain demographic groups. Trust score reduced and compensation awarded.",
  },
  {
    id: "CJ-2024-028",
    title: "Misleading Financial Advice",
    category: "Misleading Claims",
    defendant: "FinanceGPT",
    verdict: "plaintiff",
    filedAt: "Feb 28, 2024",
    resolvedAt: "Mar 15, 2024",
    compensation: "5,200 SOL",
    jurorCount: 5,
    summary:
      "AI provided investment advice without proper disclaimers, leading to financial losses for users.",
  },
  {
    id: "CJ-2024-022",
    title: "Voice Cloning Without Consent",
    category: "Privacy Violation",
    defendant: "VoiceClone X",
    verdict: "plaintiff",
    filedAt: "Feb 20, 2024",
    resolvedAt: "Mar 8, 2024",
    compensation: "3,100 SOL",
    jurorCount: 5,
    summary:
      "Model used voice samples without obtaining proper consent from the original speakers.",
  },
  {
    id: "CJ-2024-018",
    title: "Deepfake Generation",
    category: "Terms of Service Violation",
    defendant: "FaceSwap AI",
    verdict: "dismissed",
    filedAt: "Feb 15, 2024",
    resolvedAt: "Mar 1, 2024",
    compensation: null,
    jurorCount: 5,
    summary:
      "Terms of service were ambiguous about deepfake generation. Model updated policies following the case.",
  },
  {
    id: "CJ-2024-012",
    title: "Data Exfiltration",
    category: "Security Vulnerability",
    defendant: "SecureBot",
    verdict: "plaintiff",
    filedAt: "Feb 8, 2024",
    resolvedAt: "Feb 25, 2024",
    compensation: "4,500 SOL",
    jurorCount: 7,
    summary:
      "Security audit revealed the model was transmitting sensitive data to unauthorized servers.",
  },
  {
    id: "CJ-2024-001",
    title: "Harmful Content Generation",
    category: "Terms of Service Violation",
    defendant: "UnfilteredGPT",
    verdict: "plaintiff",
    filedAt: "Jan 28, 2024",
    resolvedAt: "Feb 15, 2024",
    compensation: "6,000 SOL",
    jurorCount: 5,
    summary:
      "Model consistently bypassed safety filters to generate harmful content. Model suspended from registry.",
  },
]

const categories = [
  "All Categories",
  "Privacy Violation",
  "Intellectual Property",
  "Discrimination",
  "Misleading Claims",
  "Terms of Service Violation",
  "Security Vulnerability",
]

export default function PrecedentsPage() {
  const [precedents, setPrecedents] = useState<Precedent[]>(mockPrecedents)
  const [searchQuery, setSearchQuery] = useState("")
  const [verdictFilter, setVerdictFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreState, setLoadMoreState] = useState<{
    type: "idle" | "success" | "error"
    message: string
  }>({ type: "idle", message: "" })

  const filteredPrecedents = precedents
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.defendant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesVerdict = !verdictFilter || p.verdict === verdictFilter
      const matchesCategory =
        categoryFilter === "All Categories" || p.category === categoryFilter
      return matchesSearch && matchesVerdict && matchesCategory
    })
    .sort((a, b) => {
      const dateA = new Date(a.filedAt).getTime()
      const dateB = new Date(b.filedAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

  const stats = {
    total: precedents.length,
    plaintiffWins: precedents.filter((p) => p.verdict === "plaintiff").length,
    dismissed: precedents.filter((p) => p.verdict === "dismissed").length,
    totalCompensation: precedents
      .filter((p) => p.compensation)
      .reduce((sum, p) => sum + parseFloat(p.compensation!.replace(/[^0-9.]/g, "")), 0),
  }

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    setLoadMoreState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/ai-legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "precedents.load_more",
          offset: precedents.length,
          limit: 10,
        }),
      })

      if (!response.ok) {
        throw new Error("Unable to load more precedents")
      }

      const result = await response.json().catch(() => ({}))
      const incomingPrecedents = Array.isArray(result?.precedents)
        ? (result.precedents as Precedent[])
        : []

      if (incomingPrecedents.length > 0) {
        setPrecedents((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const deduped = incomingPrecedents.filter((item) => !existingIds.has(item.id))
          return [...prev, ...deduped]
        })
        setLoadMoreState({ type: "success", message: "More precedents loaded." })
      } else {
        setLoadMoreState({ type: "success", message: "No more precedents available." })
      }
    } catch (error) {
      setLoadMoreState({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load precedents.",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  const getVerdictConfig = (verdict: Precedent["verdict"]) => {
    switch (verdict) {
      case "plaintiff":
        return {
          label: "Plaintiff Won",
          status: "success" as const,
          icon: CheckCircle,
          color: "text-success",
        }
      case "dismissed":
        return {
          label: "Dismissed",
          status: "rejected" as const,
          icon: XCircle,
          color: "text-muted-foreground",
        }
      case "pending":
        return {
          label: "Pending",
          status: "pending" as const,
          icon: Clock,
          color: "text-warning",
        }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Legal Precedents"
        description="Browse past cases and their verdicts to understand ChainJustice rulings"
      />

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Cases"
          value={stats.total}
          icon={FileText}
          iconColor="cyan"
        />
        <StatCard
          label="Plaintiff Victories"
          value={stats.plaintiffWins}
          change={`${Math.round((stats.plaintiffWins / stats.total) * 100)}% win rate`}
          changeType="positive"
          icon={CheckCircle}
          iconColor="success"
        />
        <StatCard
          label="Cases Dismissed"
          value={stats.dismissed}
          icon={XCircle}
          iconColor="warning"
        />
        <StatCard
          label="Total Compensation"
          value={`${stats.totalCompensation.toLocaleString()} SOL`}
          icon={Coins}
          iconColor="violet"
        />
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by case ID, title, or defendant..."
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="bg-secondary/50 pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Verdict Filter */}
          <div className="flex gap-2">
            <Button
              variant={verdictFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setVerdictFilter(null)}
              className={verdictFilter === null ? "bg-cyan text-primary-foreground" : ""}
            >
              All
            </Button>
            <Button
              variant={verdictFilter === "plaintiff" ? "default" : "outline"}
              size="sm"
              onClick={() => setVerdictFilter("plaintiff")}
              className={
                verdictFilter === "plaintiff" ? "bg-success text-primary-foreground" : ""
              }
            >
              Plaintiff Won
            </Button>
            <Button
              variant={verdictFilter === "dismissed" ? "default" : "outline"}
              size="sm"
              onClick={() => setVerdictFilter("dismissed")}
            >
              Dismissed
            </Button>
          </div>

          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>
      </GlassCard>

      {/* Precedent Cards */}
      <div className="space-y-4">
        {filteredPrecedents.map((precedent) => {
          const verdictConfig = getVerdictConfig(precedent.verdict)
          const VerdictIcon = verdictConfig.icon

          return (
            <Link key={precedent.id} href={`/cases/${precedent.id}`}>
              <GlassCard className="p-5 transition-all hover:border-cyan/30" hover>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {precedent.id}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                        {precedent.category}
                      </span>
                      <StatusBadge
                        status={verdictConfig.status}
                        label={verdictConfig.label}
                        size="sm"
                      />
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{precedent.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      vs. {precedent.defendant}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {precedent.summary}
                    </p>
                  </div>

                  <div className="flex flex-row items-center gap-6 sm:flex-col sm:items-end">
                    {/* Verdict Icon */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        precedent.verdict === "plaintiff"
                          ? "bg-success/10"
                          : "bg-muted"
                      }`}
                    >
                      <VerdictIcon
                        className={`h-6 w-6 ${verdictConfig.color}`}
                      />
                    </div>

                    {/* Compensation */}
                    {precedent.compensation && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Compensation</p>
                        <p className="font-mono text-sm font-semibold text-cyan">
                          {precedent.compensation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Filed: {precedent.filedAt}
                    </div>
                    {precedent.resolvedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolved: {precedent.resolvedAt}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5" />
                      {precedent.jurorCount} Jurors
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-cyan">
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          )
        })}

        {filteredPrecedents.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No precedents found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </GlassCard>
        )}
      </div>

      {/* Load More */}
      {filteredPrecedents.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load More Precedents"}
          </Button>
          {loadMoreState.type !== "idle" && (
            <p
              className={`mt-2 text-sm ${
                loadMoreState.type === "success" ? "text-success" : "text-destructive"
              }`}
            >
              {loadMoreState.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
