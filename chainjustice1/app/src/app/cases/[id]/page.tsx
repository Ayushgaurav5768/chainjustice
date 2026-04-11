"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Button from "@/components/ui/button"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import StatusBadge from "@/components/status-badge"
import TrustScore from "@/components/trust-score"
import {
  FileText,
  ExternalLink,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Scale,
  AlertTriangle,
  Download,
  Calendar,
  User,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Gavel,
} from "lucide-react"

type CaseStatus = "active" | "pending" | "resolved" | "rejected"
type Recommendation = "in-favor" | "dismiss" | "more-evidence"
type TimelineIconKey = "file" | "analysis" | "jurors" | "vote"

interface CaseEvidence {
  id: string
  name: string
  type: string
  size: string
  ipfsHash: string
  uploadedAt: string
}

interface CaseAnalysis {
  recommendation: Recommendation
  confidence: number
  summary: string
  keyFindings: string[]
  legalPrecedents: string[]
}

interface TimelineEntry {
  date: string
  event: string
  icon: TimelineIconKey
}

interface CaseData {
  id: string
  title: string
  category: string
  status: CaseStatus
  filedAt: string
  plaintiff: string
  defendant: {
    name: string
    developer: string
    trustScore: number
    insuranceDeposit: string
  }
  description: string
  evidence: CaseEvidence[]
  aiAnalysis: CaseAnalysis
  timeline: TimelineEntry[]
  jurorVoting: {
    total: number
    voted: number
    inFavor: number
    dismissed: number
    pending: number
    deadline: string
  }
  verdict: string | null
}

const timelineIconMap = {
  file: FileText,
  analysis: Brain,
  jurors: Users,
  vote: Scale,
} as const

// Placeholder values are intentionally isolated here for quick replacement once
// full on-chain/API reads are finalized.
const PLACEHOLDER_CASE_TEMPLATE: Omit<CaseData, "id"> = {
  title: "Unauthorized Data Collection",
  category: "Privacy Violation",
  status: "active",
  filedAt: "March 28, 2024",
  plaintiff: "Anonymous User #4821",
  defendant: {
    name: "GPT-Vision Pro",
    developer: "Vision Labs",
    trustScore: 72,
    insuranceDeposit: "8,500 SOL",
  },
  description:
    "The AI model was observed collecting and storing user interaction data without explicit consent, violating the stated privacy policy and terms of service. Multiple instances of data exfiltration were detected through network monitoring tools. The model appears to be transmitting user prompts and responses to external servers not disclosed in the privacy documentation.",
  evidence: [
    {
      id: "ev-001",
      name: "network_logs_march_2024.pdf",
      type: "PDF",
      size: "2.4 MB",
      ipfsHash: "QmX7b2yF3hNkL9sWc8Z1dA...",
      uploadedAt: "March 28, 2024",
    },
    {
      id: "ev-002",
      name: "screenshot_data_transfer.png",
      type: "PNG",
      size: "845 KB",
      ipfsHash: "QmY8c3zG4iOlM0tXd9B2eB...",
      uploadedAt: "March 28, 2024",
    },
  ],
  aiAnalysis: {
    recommendation: "in-favor",
    confidence: 87,
    summary:
      "Based on the submitted evidence, there appears to be strong support for the plaintiff's claims. Network logs clearly show data transmission to undisclosed endpoints, and the terms of service comparison reveals inconsistencies between stated and actual data handling practices.",
    keyFindings: [
      "Network logs confirm data transmission to undisclosed external endpoints",
      "Privacy policy does not mention the observed data collection behavior",
    ],
    legalPrecedents: [
      "CJ-2024-012: Similar data collection case - Ruled in favor of plaintiff",
      "CJ-2023-089: Privacy violation precedent - Established data transparency requirements",
    ],
  },
  timeline: [
    { date: "March 28, 2024 - 10:32 AM", event: "Case filed", icon: "file" },
    { date: "March 28, 2024 - 10:35 AM", event: "Evidence uploaded to IPFS", icon: "file" },
    { date: "March 28, 2024 - 11:00 AM", event: "AI analysis completed", icon: "analysis" },
    { date: "March 28, 2024 - 2:00 PM", event: "Jurors assigned (5/5)", icon: "jurors" },
    { date: "March 30, 2024 - 3:00 PM", event: "Voting period begins", icon: "vote" },
  ],
  jurorVoting: {
    total: 5,
    voted: 3,
    inFavor: 2,
    dismissed: 1,
    pending: 2,
    deadline: "2 days remaining",
  },
  verdict: null,
}

const buildPlaceholderCase = (id: string): CaseData => ({
  ...PLACEHOLDER_CASE_TEMPLATE,
  id,
})

const coerceRecommendation = (value: unknown): Recommendation => {
  if (value === "dismiss" || value === "more-evidence" || value === "in-favor") {
    return value
  }
  return "in-favor"
}

const coerceTimelineIcon = (value: unknown): TimelineIconKey => {
  if (value === "analysis" || value === "jurors" || value === "vote" || value === "file") {
    return value
  }
  return "file"
}

const normalizeCaseData = (incoming: unknown, fallbackId: string): CaseData => {
  const safeFallback = buildPlaceholderCase(fallbackId)

  if (!incoming || typeof incoming !== "object") {
    return safeFallback
  }

  const data = incoming as Partial<CaseData> & {
    aiAnalysis?: Partial<CaseAnalysis>
    timeline?: Array<Partial<TimelineEntry>>
  }

  return {
    ...safeFallback,
    ...data,
    id: typeof data.id === "string" && data.id ? data.id : fallbackId,
    status: ["active", "pending", "resolved", "rejected"].includes(String(data.status))
      ? (data.status as CaseStatus)
      : safeFallback.status,
    defendant: {
      ...safeFallback.defendant,
      ...(data.defendant || {}),
    },
    evidence: Array.isArray(data.evidence) && data.evidence.length > 0
      ? data.evidence.map((item, index) => ({
          id: item.id || `ev-${index + 1}`,
          name: item.name || `Evidence ${index + 1}`,
          type: item.type || "FILE",
          size: item.size || "-",
          ipfsHash: item.ipfsHash || "Pending",
          uploadedAt: item.uploadedAt || safeFallback.filedAt,
        }))
      : safeFallback.evidence,
    aiAnalysis: {
      recommendation: coerceRecommendation(data.aiAnalysis?.recommendation),
      confidence: Number(data.aiAnalysis?.confidence ?? safeFallback.aiAnalysis.confidence),
      summary: data.aiAnalysis?.summary || safeFallback.aiAnalysis.summary,
      keyFindings:
        Array.isArray(data.aiAnalysis?.keyFindings) && data.aiAnalysis.keyFindings.length > 0
          ? data.aiAnalysis.keyFindings
          : safeFallback.aiAnalysis.keyFindings,
      legalPrecedents:
        Array.isArray(data.aiAnalysis?.legalPrecedents) &&
        data.aiAnalysis.legalPrecedents.length > 0
          ? data.aiAnalysis.legalPrecedents
          : safeFallback.aiAnalysis.legalPrecedents,
    },
    timeline:
      Array.isArray(data.timeline) && data.timeline.length > 0
        ? data.timeline.map((item) => ({
            date: item.date || safeFallback.filedAt,
            event: item.event || "Case updated",
            icon: coerceTimelineIcon(item.icon),
          }))
        : safeFallback.timeline,
    jurorVoting: {
      ...safeFallback.jurorVoting,
      ...(data.jurorVoting || {}),
    },
  }
}

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [caseData, setCaseData] = useState<CaseData>(() => buildPlaceholderCase(id || "unknown"))
  const [caseLoadState, setCaseLoadState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
    source: "live" | "placeholder"
  }>({
    status: "loading",
    message: "Loading case details...",
    source: "placeholder",
  })
  const [analysisState, setAnalysisState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })
  const [analysisOverride, setAnalysisOverride] = useState<CaseAnalysis | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadCase = async () => {
      setCaseLoadState({
        status: "loading",
        message: "Loading case details...",
        source: "placeholder",
      })

      try {
        const response = await fetch("/api/ai-legal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "cases.get_details",
            payload: { caseId: id },
          }),
        })

        if (!response.ok) {
          throw new Error("Could not load case details")
        }

        const result = await response.json().catch(() => ({}))
        const resolvedCase = normalizeCaseData(result?.case || result?.data || result, id)

        if (isMounted) {
          setCaseData(resolvedCase)
          setCaseLoadState({
            status: "success",
            message: "Live case data loaded.",
            source: "live",
          })
        }
      } catch (error) {
        if (isMounted) {
          setCaseData(buildPlaceholderCase(id))
          setCaseLoadState({
            status: "error",
            message:
              error instanceof Error
                ? `${error.message}. Showing placeholder case data.`
                : "Showing placeholder case data.",
            source: "placeholder",
          })
        }
      }
    }

    loadCase()

    return () => {
      isMounted = false
    }
  }, [id])

  const activeAnalysis = analysisOverride ?? caseData.aiAnalysis

  const getRecommendationConfig = (rec: "in-favor" | "dismiss" | "more-evidence") => {
    switch (rec) {
      case "in-favor":
        return {
          label: "Rule in Plaintiff's Favor",
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/30",
          icon: CheckCircle,
        }
      case "dismiss":
        return {
          label: "Recommend Dismissal",
          color: "text-muted-foreground",
          bg: "bg-muted",
          border: "border-border",
          icon: XCircle,
        }
      case "more-evidence":
        return {
          label: "Request More Evidence",
          color: "text-warning",
          bg: "bg-warning/10",
          border: "border-warning/30",
          icon: AlertTriangle,
        }
    }
  }

  const handleRefreshAnalysis = async () => {
    setAnalysisState({ status: "loading", message: "Refreshing analysis..." })

    try {
      const response = await fetch("/api/ai-legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cases.analyze",
          payload: {
            caseId: caseData.id,
            title: caseData.title,
            category: caseData.category,
            description: caseData.description,
            evidence: caseData.evidence.map((item) => ({
              name: item.name,
              type: item.type,
              ipfsHash: item.ipfsHash,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to refresh analysis")
      }

      const result = await response.json().catch(() => ({}))
      const nextAnalysis = result?.analysis || {}

      setAnalysisOverride({
        recommendation: nextAnalysis.recommendation || activeAnalysis.recommendation,
        confidence: Number(nextAnalysis.confidence ?? activeAnalysis.confidence),
        summary: nextAnalysis.summary || activeAnalysis.summary,
        keyFindings: Array.isArray(nextAnalysis.keyFindings)
          ? nextAnalysis.keyFindings
          : activeAnalysis.keyFindings,
        legalPrecedents: Array.isArray(nextAnalysis.legalPrecedents)
          ? nextAnalysis.legalPrecedents
          : activeAnalysis.legalPrecedents,
      })
      setAnalysisState({ status: "success", message: "Analysis updated." })
    } catch (error) {
      setAnalysisState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to refresh analysis.",
      })
    }
  }

  const recConfig = getRecommendationConfig(activeAnalysis.recommendation)
  const RecIcon = recConfig.icon

  return (
    <div className="space-y-8">
      {caseLoadState.status !== "idle" && caseLoadState.status !== "success" && (
        <GlassCard className="p-3">
          <p className={`text-sm ${caseLoadState.status === "error" ? "text-warning" : "text-muted-foreground"}`}>
            {caseLoadState.message}
          </p>
        </GlassCard>
      )}

      <PageHeader
        title={caseData.title}
        description={`Case ${caseData.id} • Filed ${caseData.filedAt}`}
      >
        <StatusBadge status={caseData.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Case Overview */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold">Case Overview</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cyan/10 p-2">
                  <User className="h-4 w-4 text-cyan" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plaintiff</p>
                  <p className="text-sm font-medium">{caseData.plaintiff}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet/10 p-2">
                  <Shield className="h-4 w-4 text-violet" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Defendant</p>
                  <p className="text-sm font-medium">{caseData.defendant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    by {caseData.defendant.developer}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium">{caseData.category}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Filed Date</p>
                  <p className="text-sm font-medium">{caseData.filedAt}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {caseData.description}
              </p>
            </div>
          </GlassCard>

          {/* Evidence List */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Evidence</h2>
              <span className="text-sm text-muted-foreground">
                {caseData.evidence.length} files
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {caseData.evidence.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/20 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan/10">
                    <FileText className="h-6 w-6 text-cyan" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5">{file.type}</span>
                      <span>{file.size}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan">{file.ipfsHash}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Analysis Card */}
          <GlassCard className={`border ${recConfig.border} p-6`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10">
                <Brain className="h-6 w-6 text-violet" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">AI Legal Analysis</h2>
                    <span className="text-xs text-muted-foreground">Powered by xAI</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshAnalysis}
                    disabled={analysisState.status === "loading"}
                  >
                    {analysisState.status === "loading" ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                {analysisState.status !== "idle" && (
                  <p
                    className={`mt-2 text-sm ${
                      analysisState.status === "success" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {analysisState.message}
                  </p>
                )}

                <div className={`mt-4 flex items-center gap-3 ${recConfig.bg} rounded-lg p-3`}>
                  <div className={`rounded-lg p-2 ${recConfig.bg}`}>
                    <RecIcon className={`h-5 w-5 ${recConfig.color}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${recConfig.color}`}>{recConfig.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {activeAnalysis.confidence}%
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {activeAnalysis.summary}
                </p>

                <div className="mt-4">
                  <h4 className="text-sm font-medium">Key Findings</h4>
                  <ul className="mt-2 space-y-2">
                    {activeAnalysis.keyFindings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium">Legal Precedents</h4>
                  <div className="mt-2 space-y-2">
                    {activeAnalysis.legalPrecedents.map((precedent, i) => (
                      <Link
                        key={i}
                        href="/precedents"
                        className="flex items-center gap-2 text-sm text-cyan hover:underline"
                      >
                        <Scale className="h-4 w-4" />
                        {precedent}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Timeline */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold">Case Timeline</h2>
            <div className="mt-4">
              <div className="space-y-4">
                {caseData.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      {(() => {
                        const TimelineIcon = timelineIconMap[item.icon]
                        return (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                            <TimelineIcon className="h-4 w-4 text-cyan" />
                          </div>
                        )
                      })()}
                      {i < caseData.timeline.length - 1 && (
                        <div className="absolute top-8 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                      <p className="text-sm font-medium">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Defendant Info */}
          <GlassCard className="p-6">
            <h3 className="font-semibold">Defendant Model</h3>
            <div className="mt-4 flex items-center gap-4">
              <TrustScore score={caseData.defendant.trustScore} size="md" />
              <div>
                <p className="font-medium">{caseData.defendant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {caseData.defendant.developer}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-secondary/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Insurance Deposit</span>
                <span className="font-mono text-cyan">{caseData.defendant.insuranceDeposit}</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/registry">View in Registry</Link>
            </Button>
          </GlassCard>

          {/* Juror Voting Status */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Juror Voting</h3>
              <StatusBadge status="active" label={caseData.jurorVoting.deadline} size="sm" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Jurors</span>
                <span className="font-medium">{caseData.jurorVoting.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4 text-success" />
                  In Favor
                </span>
                <span className="font-medium text-success">{caseData.jurorVoting.inFavor}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ThumbsDown className="h-4 w-4" />
                  Dismissed
                </span>
                <span className="font-medium">{caseData.jurorVoting.dismissed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-warning" />
                  Pending
                </span>
                <span className="font-medium text-warning">{caseData.jurorVoting.pending}</span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Voting Progress</span>
                  <span>
                    {caseData.jurorVoting.voted}/{caseData.jurorVoting.total}
                  </span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="bg-success"
                    style={{
                      width: `${(caseData.jurorVoting.inFavor / caseData.jurorVoting.total) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-muted-foreground"
                    style={{
                      width: `${(caseData.jurorVoting.dismissed / caseData.jurorVoting.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Final Verdict Area */}
          <GlassCard className="border-dashed p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Gavel className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Final Verdict</h3>
                <p className="text-sm text-muted-foreground">Awaiting jury decision</p>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              The final verdict will be recorded on-chain once all jurors have voted or the
              voting period ends.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
