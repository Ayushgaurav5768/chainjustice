"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Button from "@/components/ui/button"
import GlassCard from "@/components/glass-card"
import PageHeader from "@/components/page-header"
import StatusBadge from "@/components/status-badge"
import TrustScore from "@/components/trust-score"
import { ADVISORY_DISCLAIMER as ADVISORY_ONLY_NOTICE } from "@/lib/constants"
import type { AiLegalCouncilResponse } from "@/lib/types"
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Gavel,
  Shield,
  Users,
} from "lucide-react"

type Brief = {
  thesis: string
  keyArguments: string[]
  citedEvidence: string[]
  legalTheory: string
  vulnerabilities: string[]
  confidence: number
  uncertaintyNotes: string[]
}

type Synthesis = {
  synthesisSummary: string
  strongestProsecutionPoints: string[]
  strongestDefensePoints: string[]
  unresolvedQuestions: string[]
  jurorGuidance: string[]
  confidence: number
  uncertaintyNotes: string[]
}

type CouncilData = {
  prosecutionBrief: Brief
  defenseBrief: Brief
  neutralSynthesis: Synthesis
  evidenceGaps: string[]
  contradictions: string[]
  recommendedQuestionsForJurors: string[]
  confidenceAndUncertaintyNotes: string[]
  aiDisagreementMeter: "low" | "medium" | "high"
}

type EvidenceItem = {
  name: string
  mimeType: string
  size: number
  ipfsHash: string
  gatewayUrl: string
}

const FALLBACK_EVIDENCE: EvidenceItem[] = [
  {
    name: "network-audit-log.pdf",
    mimeType: "application/pdf",
    size: 243000,
    ipfsHash: "bafybeigdyrj6rj2za4kfjz7v6uz6wkq5xi",
    gatewayUrl: "https://gateway.pinata.cloud/ipfs/bafybeigdyrj6rj2za4kfjz7v6uz6wkq5xi",
  },
  {
    name: "policy-snapshot.txt",
    mimeType: "text/plain",
    size: 5100,
    ipfsHash: "bafybeicf7j3t2lzz8tq1n6kqf2zsr7s0eh",
    gatewayUrl: "https://gateway.pinata.cloud/ipfs/bafybeicf7j3t2lzz8tq1n6kqf2zsr7s0eh",
  },
]

const FALLBACK_TIMELINE = [
  { at: "2026-04-10T09:20:00Z", title: "Complaint filed", detail: "Case intake accepted by ChainJustice." },
  { at: "2026-04-10T09:24:00Z", title: "Evidence anchored", detail: "Evidence bundle uploaded to IPFS." },
  { at: "2026-04-10T09:30:00Z", title: "Adversarial AI briefs", detail: "Prosecution/Defense/Synthesis generated." },
  { at: "2026-04-10T10:00:00Z", title: "Juror panel formed", detail: "5 jurors assigned to independent review." },
]

const ADVISORY_DISCLAIMER = ADVISORY_ONLY_NOTICE

const FALLBACK_COUNCIL: CouncilData = {
  prosecutionBrief: {
    thesis: "The complainant presents a plausible harm pathway tied to model behavior and disclosure mismatch.",
    keyArguments: ["Policy-behavior mismatch", "User impact appears concrete"],
    citedEvidence: ["Incident log", "Policy snapshot"],
    legalTheory: "Reliance harm",
    vulnerabilities: ["Requires stronger causation trace"],
    confidence: 70,
    uncertaintyNotes: ["Some telemetry remains incomplete"],
  },
  defenseBrief: {
    thesis: "Alternative integration or operator factors may explain portions of the observed outcome.",
    keyArguments: ["Competing causes remain plausible", "Evidence scope may be incomplete"],
    citedEvidence: ["Deployment context notes"],
    legalTheory: "Insufficient direct causation",
    vulnerabilities: ["Weak if logs conflict with policy claims"],
    confidence: 63,
    uncertaintyNotes: ["Version lineage needs confirmation"],
  },
  neutralSynthesis: {
    synthesisSummary:
      "Jurors should prioritize authenticated logs, deployment version traceability, and direct harm linkage before final vote.",
    strongestProsecutionPoints: ["Behavior-policy mismatch"],
    strongestDefensePoints: ["Alternative causes not excluded"],
    unresolvedQuestions: ["Which exact model version handled each event?"],
    jurorGuidance: ["Weight primary evidence over summaries"],
    confidence: 67,
    uncertaintyNotes: ["Advisory analysis only"],
  },
  evidenceGaps: ["Versioned telemetry export"],
  contradictions: ["Public policy claims versus incident trace"],
  recommendedQuestionsForJurors: [
    "What evidence directly connects the accused model to the alleged harm?",
  ],
  confidenceAndUncertaintyNotes: ["AI analysis is advisory only."],
  aiDisagreementMeter: "medium",
}

const meterClass = (meter: CouncilData["aiDisagreementMeter"]) => {
  if (meter === "high") return "bg-destructive/20 text-destructive border-destructive/30"
  if (meter === "medium") return "bg-warning/20 text-warning border-warning/30"
  return "bg-success/20 text-success border-success/30"
}

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
  const [council, setCouncil] = useState<CouncilData | null>(null)
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error"
    message: string
  }>({ status: "loading", message: "Loading case details..." })

  const caseMeta = useMemo(
    () => ({
      id: params.id,
      title: "Undisclosed Profile Inference from Private Prompts",
      category: "Privacy Violation",
      status: "active" as const,
      plaintiff: "Complainant Wallet 9h3d...kP1",
      model: "GPT-Vision Pro",
      provider: "Vision Labs",
      trustScore: 68,
      insurance: "8,200 SOL",
      summary:
        "Complainant alleges the model inferred and stored sensitive profile attributes from private prompts despite policy claims of ephemeral handling.",
    }),
    [params.id]
  )

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch("/api/ai-legal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adversarial_council",
            data: {
              mode: "case_analysis",
              title: caseMeta.title,
              description: caseMeta.summary,
              evidence: FALLBACK_EVIDENCE,
              provider: caseMeta.provider,
              modelFamily: "gemini",
              category: caseMeta.category,
              precedentContext: "CJ-2024-042, CJ-2023-089",
            },
          }),
        })

        if (!response.ok) {
          throw new Error("Unable to load AI case briefs")
        }

        const result = (await response.json().catch(() => null)) as AiLegalCouncilResponse | null
        if (!active) return

        if (result?.success && result.data) {
          setCouncil(result.data)
          setState({ status: "ready", message: "Loaded" })
          return
        }

        setCouncil(FALLBACK_COUNCIL)
        setState({ status: "error", message: "Advisory briefs are in fallback mode." })
      } catch (error) {
        if (!active) return
        setCouncil(FALLBACK_COUNCIL)
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load case analysis",
        })
      }
    }

    load()

    return () => {
      active = false
    }
  }, [caseMeta])

  return (
    <div className="space-y-8">
      <PageHeader
        title={caseMeta.title}
        description={`Case ${caseMeta.id} • ${caseMeta.category}`}
      >
        <StatusBadge status={caseMeta.status} />
      </PageHeader>

      {state.status === "error" && (
        <GlassCard className="border-warning/40 p-4">
          <p className="text-sm text-warning">{state.message}</p>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-6" glow="cyan">
            <h2 className="text-lg font-semibold">Complaint Summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{caseMeta.summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Plaintiff</p>
                <p className="mt-1 font-medium">{caseMeta.plaintiff}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Accused Model</p>
                <p className="mt-1 font-medium">{caseMeta.model}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Evidence List</h2>
              <span className="text-sm text-muted-foreground">{FALLBACK_EVIDENCE.length} files</span>
            </div>
            <div className="mt-4 space-y-3">
              {FALLBACK_EVIDENCE.map((item) => (
                <div key={item.ipfsHash} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <FileText className="h-4 w-4 text-cyan" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.mimeType} • {(item.size / 1024).toFixed(1)} KB • {item.ipfsHash.slice(0, 12)}...
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.gatewayUrl} target="_blank" rel="noreferrer">Open</a>
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI Case Briefs</h2>
              {council?.aiDisagreementMeter && (
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${meterClass(council.aiDisagreementMeter)}`}>
                  {council.aiDisagreementMeter} disagreement
                </span>
              )}
            </div>

            {!council && (
              <div className="mt-4 space-y-2">
                <div className="h-16 animate-pulse rounded-lg bg-secondary/30" />
                <div className="h-16 animate-pulse rounded-lg bg-secondary/20" />
                <p className="text-sm text-muted-foreground">
                  {state.status === "loading" ? "Generating briefs..." : "Briefs unavailable."}
                </p>
              </div>
            )}

            {council && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">Prosecution Brief</p>
                  <p className="mt-2 text-sm text-muted-foreground">{council.prosecutionBrief.thesis}</p>
                </div>
                <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-4">
                  <p className="text-sm font-semibold text-cyan">Defense Brief</p>
                  <p className="mt-2 text-sm text-muted-foreground">{council.defenseBrief.thesis}</p>
                </div>
                <div className="rounded-lg border border-violet/30 bg-violet/5 p-4">
                  <p className="text-sm font-semibold text-violet">Neutral Synthesis</p>
                  <p className="mt-2 text-sm text-muted-foreground">{council.neutralSynthesis.synthesisSummary}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold">Evidence Gaps</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {council.evidenceGaps.map((item) => (
                        <li key={item} className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 text-cyan" />{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Contradictions</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {council.contradictions.map((item) => (
                        <li key={item} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Recommended Questions for Jurors</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {council.recommendedQuestionsForJurors.map((question) => (
                      <li key={question} className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-cyan" />{question}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6" glow="violet">
            <h3 className="text-base font-semibold">Accused Model</h3>
            <p className="mt-1 text-sm text-muted-foreground">{caseMeta.model} by {caseMeta.provider}</p>
            <div className="mt-5 flex items-center gap-4">
              <TrustScore score={caseMeta.trustScore} size="md" />
              <div className="text-sm">
                <p className="text-muted-foreground">Insurance</p>
                <p className="font-semibold text-cyan">{caseMeta.insurance}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-base font-semibold">Case Timeline</h3>
            <div className="mt-4 space-y-3">
              {FALLBACK_TIMELINE.map((entry) => (
                <div key={entry.at} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">{new Date(entry.at).toLocaleString()}</p>
                  <p className="mt-1 text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="border-cyan/30 bg-cyan/5 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-cyan" />
              <p className="text-xs text-muted-foreground">{ADVISORY_DISCLAIMER}</p>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-success text-primary-foreground hover:bg-success/90" asChild>
              <Link href="/juror">
                <Gavel className="mr-2 h-4 w-4" />Human Juror Vote
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/juror">
                Juror Desk
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
