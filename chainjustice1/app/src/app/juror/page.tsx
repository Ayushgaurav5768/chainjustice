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
  Coins,
  Scale,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronRight,
  Wallet,
  TrendingUp,
  Award,
} from "lucide-react"

interface AssignedCase {
  id: string
  title: string
  defendant: string
  status: "pending" | "active" | "resolved"
  deadline: string
  reward: string
  aiRecommendation: "in-favor" | "dismiss" | "more-evidence"
  aiConfidence: number
  evidenceCount: number
}

const mockAssignedCases: AssignedCase[] = [
  {
    id: "CJ-2024-001",
    title: "Unauthorized Data Collection",
    defendant: "GPT-Vision Pro",
    status: "active",
    deadline: "2 days",
    reward: "25 SOL",
    aiRecommendation: "in-favor",
    aiConfidence: 87,
    evidenceCount: 5,
  },
  {
    id: "CJ-2024-005",
    title: "Misleading Output Claims",
    defendant: "MarketBot AI",
    status: "active",
    deadline: "4 days",
    reward: "18 SOL",
    aiRecommendation: "more-evidence",
    aiConfidence: 62,
    evidenceCount: 2,
  },
  {
    id: "CJ-2024-008",
    title: "Discriminatory Filtering",
    defendant: "ContentMod Pro",
    status: "pending",
    deadline: "6 days",
    reward: "32 SOL",
    aiRecommendation: "dismiss",
    aiConfidence: 78,
    evidenceCount: 3,
  },
]

const jurorStats = {
  staked: "1,250 SOL",
  earnings: "342 SOL",
  casesJudged: 47,
  accuracy: 94,
}

export default function JurorPortalPage() {
  const [stakeAmount, setStakeAmount] = useState("")
  const [stakeState, setStakeState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })
  const [voteState, setVoteState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
    caseId?: string
  }>({ status: "idle", message: "" })

  const postLegalAction = async (action: string, payload: Record<string, unknown>) => {
    const response = await fetch("/api/ai-legal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, payload }),
    })

    if (!response.ok) {
      throw new Error("Request failed")
    }

    return response.json().catch(() => ({}))
  }

  const handleStakeAction = async (action: "juror.stake" | "juror.unstake" | "juror.claim") => {
    setStakeState({ status: "loading", message: "Submitting..." })

    try {
      await postLegalAction(action, {
        amount: stakeAmount ? Number(stakeAmount) : undefined,
      })

      setStakeState({ status: "success", message: "Action submitted successfully." })
      if (action === "juror.stake") {
        setStakeAmount("")
      }
    } catch (error) {
      setStakeState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit action.",
      })
    }
  }

  const handleVote = async (caseId: string, vote: "in-favor" | "dismiss") => {
    setVoteState({ status: "loading", message: "Submitting vote...", caseId })

    try {
      await postLegalAction("juror.vote", { caseId, vote })
      setVoteState({ status: "success", message: "Vote submitted.", caseId })
    } catch (error) {
      setVoteState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to submit vote.",
        caseId,
      })
    }
  }

  const getRecommendationConfig = (rec: AssignedCase["aiRecommendation"]) => {
    switch (rec) {
      case "in-favor":
        return {
          label: "Rule in Plaintiff's Favor",
          color: "text-success",
          bg: "bg-success/10",
          icon: CheckCircle,
        }
      case "dismiss":
        return {
          label: "Dismiss Case",
          color: "text-muted-foreground",
          bg: "bg-muted",
          icon: XCircle,
        }
      case "more-evidence":
        return {
          label: "Request More Evidence",
          color: "text-warning",
          bg: "bg-warning/10",
          icon: AlertTriangle,
        }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Juror Portal"
        description="Stake SOL, review cases, and earn rewards for fair verdicts"
      />

      {/* Juror Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Staked"
          value={jurorStats.staked}
          icon={Coins}
          iconColor="cyan"
        />
        <StatCard
          label="Total Earnings"
          value={jurorStats.earnings}
          change="+12 SOL this week"
          changeType="positive"
          icon={TrendingUp}
          iconColor="success"
        />
        <StatCard
          label="Cases Judged"
          value={jurorStats.casesJudged}
          icon={Scale}
          iconColor="violet"
        />
        <StatCard
          label="Accuracy Rate"
          value={`${jurorStats.accuracy}%`}
          icon={Award}
          iconColor="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stake Management Card */}
        <div className="space-y-6">
          <GlassCard className="p-6" glow="cyan">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10">
                <Wallet className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Juror Stake</h2>
                <p className="text-sm text-muted-foreground">Manage your stake</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Current Stake</p>
                <p className="mt-1 text-3xl font-bold text-cyan">{jurorStats.staked}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum stake: 100 SOL
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add to Stake</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount in SOL"
                    value={stakeAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStakeAmount(e.target.value)}
                    className="bg-secondary/50"
                  />
                  <Button
                    className="bg-cyan text-primary-foreground hover:bg-cyan/90"
                    disabled={stakeState.status === "loading" || !stakeAmount}
                    onClick={() => handleStakeAction("juror.stake")}
                  >
                    Stake
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  disabled={stakeState.status === "loading"}
                  onClick={() => handleStakeAction("juror.unstake")}
                >
                  Unstake
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  disabled={stakeState.status === "loading"}
                  onClick={() => handleStakeAction("juror.claim")}
                >
                  Claim Rewards
                </Button>
              </div>

              {stakeState.status !== "idle" && (
                <p
                  className={`text-sm ${
                    stakeState.status === "success" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stakeState.status === "loading" ? "Processing..." : stakeState.message}
                </p>
              )}
            </div>
          </GlassCard>

          {/* Juror Tier */}
          <GlassCard className="p-6">
            <h3 className="font-semibold">Juror Tier</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet/10">
                <Award className="h-8 w-8 text-violet" />
              </div>
              <div>
                <p className="text-xl font-bold text-violet">Silver Juror</p>
                <p className="text-sm text-muted-foreground">
                  750 SOL until Gold tier
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-violet">62.5%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-violet"
                  style={{ width: "62.5%" }}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Assigned Cases */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assigned Cases</h2>
              <StatusBadge
                status="active"
                label={`${mockAssignedCases.filter((c) => c.status === "active").length} Active`}
              />
            </div>

            <div className="mt-6 space-y-4">
              {mockAssignedCases.map((caseItem) => {
                const recConfig = getRecommendationConfig(caseItem.aiRecommendation)
                const RecIcon = recConfig.icon

                return (
                  <div
                    key={caseItem.id}
                    className="rounded-lg border border-border/50 bg-secondary/20 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {caseItem.id}
                          </span>
                          <StatusBadge status={caseItem.status} size="sm" />
                        </div>
                        <h3 className="mt-1 font-medium">{caseItem.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          vs. {caseItem.defendant}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {caseItem.deadline} left
                          </div>
                          <div className="flex items-center gap-1 text-cyan">
                            <Coins className="h-4 w-4" />
                            {caseItem.reward}
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendation Panel */}
                      <div className="w-full rounded-lg border border-border/50 bg-card p-3 sm:w-64">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Brain className="h-4 w-4 text-violet" />
                          AI Recommendation
                        </div>
                        <div className={`mt-2 flex items-center gap-2 ${recConfig.color}`}>
                          <div className={`rounded-md p-1 ${recConfig.bg}`}>
                            <RecIcon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{recConfig.label}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className={recConfig.color}>{caseItem.aiConfidence}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full ${
                              caseItem.aiConfidence >= 80
                                ? "bg-success"
                                : caseItem.aiConfidence >= 60
                                  ? "bg-warning"
                                  : "bg-destructive"
                            }`}
                            style={{ width: `${caseItem.aiConfidence}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    {caseItem.status === "active" && (
                      <div className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                          href={`/cases/${caseItem.id}`}
                          className="flex items-center gap-1 text-sm text-cyan hover:underline"
                        >
                          View Evidence ({caseItem.evidenceCount} files)
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={voteState.status === "loading"}
                            onClick={() => handleVote(caseItem.id, "dismiss")}
                            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 sm:flex-none"
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            disabled={voteState.status === "loading"}
                            onClick={() => handleVote(caseItem.id, "in-favor")}
                            className="flex-1 bg-success text-primary-foreground hover:bg-success/90 sm:flex-none"
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            In Favor
                          </Button>
                        </div>
                      </div>
                    )}

                    {voteState.caseId === caseItem.id && voteState.status !== "idle" && (
                      <p
                        className={`mt-3 text-sm ${
                          voteState.status === "success" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {voteState.status === "loading" ? "Submitting vote..." : voteState.message}
                      </p>
                    )}

                    {caseItem.status === "pending" && (
                      <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Waiting for more jurors to be assigned
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Voting History */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold">Recent Voting History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3">Case ID</th>
                <th className="pb-3">Your Vote</th>
                <th className="pb-3">Final Verdict</th>
                <th className="pb-3">Reward</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 font-mono text-sm">CJ-2024-042</td>
                <td className="py-3">
                  <span className="flex items-center gap-1 text-success">
                    <ThumbsUp className="h-4 w-4" /> In Favor
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status="success" label="Plaintiff Won" size="sm" />
                </td>
                <td className="py-3 text-cyan">+18 SOL</td>
                <td className="py-3 text-muted-foreground">Mar 28, 2024</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-sm">CJ-2024-039</td>
                <td className="py-3">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ThumbsDown className="h-4 w-4" /> Dismissed
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status="rejected" label="Dismissed" size="sm" />
                </td>
                <td className="py-3 text-cyan">+12 SOL</td>
                <td className="py-3 text-muted-foreground">Mar 25, 2024</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-sm">CJ-2024-035</td>
                <td className="py-3">
                  <span className="flex items-center gap-1 text-success">
                    <ThumbsUp className="h-4 w-4" /> In Favor
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status="rejected" label="Dismissed" size="sm" />
                </td>
                <td className="py-3 text-muted-foreground">0 SOL</td>
                <td className="py-3 text-muted-foreground">Mar 22, 2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
