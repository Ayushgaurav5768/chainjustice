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
  Award,
  Coins,
  Gavel,
  Scale,
  Timer,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  Wallet,
} from "lucide-react"

type AssignedCase = {
  id: string
  title: string
  defendant: string
  reward: string
  deadline: string
  status: "active" | "pending"
  evidenceCount: number
}

const assignedCases: AssignedCase[] = [
  {
    id: "CJ-2026-401",
    title: "Undisclosed profile inference from private prompts",
    defendant: "GPT-Vision Pro",
    reward: "26 SOL",
    deadline: "42h",
    status: "active",
    evidenceCount: 4,
  },
  {
    id: "CJ-2026-389",
    title: "Unauthorized transcript retention",
    defendant: "VoiceClone X",
    reward: "18 SOL",
    deadline: "65h",
    status: "active",
    evidenceCount: 3,
  },
  {
    id: "CJ-2026-377",
    title: "Misleading safety claims in policy docs",
    defendant: "TextGen 3.5",
    reward: "31 SOL",
    deadline: "3d",
    status: "pending",
    evidenceCount: 5,
  },
]

export default function JurorPage() {
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

  const jurorStats = {
    staked: "1,240 SOL",
    rewards: "338 SOL",
    judged: 47,
    agreement: "82%",
  }

  const postAction = async (action: string, data: Record<string, unknown>) => {
    const response = await fetch("/api/ai-legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
    })

    if (!response.ok) {
      throw new Error("Juror action failed")
    }
  }

  const handleStake = async () => {
    setStakeState({ status: "loading", message: "Submitting stake..." })
    try {
      await postAction("juror.stake", { amount: Number(stakeAmount || 0) })
      setStakeState({ status: "success", message: "Stake action submitted." })
      setStakeAmount("")
    } catch (error) {
      setStakeState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to stake",
      })
    }
  }

  const handleVote = async (caseId: string, vote: "plaintiff" | "defendant") => {
    setVoteState({ status: "loading", message: "Submitting vote...", caseId })
    try {
      await postAction("juror.vote", { caseId, vote })
      setVoteState({ status: "success", message: "Vote recorded.", caseId })
    } catch (error) {
      setVoteState({
        status: "error",
        message: error instanceof Error ? error.message : "Vote failed",
        caseId,
      })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Juror Governance"
        description="Independent human verdicts with transparent rewards and on-chain accountability."
      />

      <GlassCard className="border-violet/30 bg-violet/5 p-4">
        <div className="flex gap-3">
          <Gavel className="h-5 w-5 flex-shrink-0 text-violet" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Human Authority:</span> AI briefs are advisory only. Your vote is the final decision. You choose the outcome, not the AI.
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stake" value={jurorStats.staked} icon={Coins} iconColor="cyan" />
        <StatCard label="Rewards" value={jurorStats.rewards} icon={Award} iconColor="success" />
        <StatCard label="Cases Judged" value={jurorStats.judged} icon={Scale} iconColor="violet" />
        <StatCard label="Panel Agreement" value={jurorStats.agreement} icon={UserCheck} iconColor="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <GlassCard className="p-6" glow="cyan">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-cyan" />
              <h2 className="text-lg font-semibold">Juror Staking</h2>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-sm font-medium">Add Stake (SOL)</label>
              <Input
                type="number"
                min={0}
                value={stakeAmount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStakeAmount(e.target.value)}
                className="bg-secondary/50"
                placeholder="Minimum 100 SOL"
              />
              <Button
                className="w-full bg-cyan text-primary-foreground hover:bg-cyan/90"
                disabled={stakeState.status === "loading" || !stakeAmount}
                onClick={handleStake}
              >
                {stakeState.status === "loading" ? "Processing..." : "Stake"}
              </Button>
              {stakeState.status !== "idle" && (
                <p className={`text-xs ${stakeState.status === "success" ? "text-success" : "text-destructive"}`}>
                  {stakeState.message}
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="border-violet/30 bg-violet/5 p-5">
            <div className="flex items-start gap-3">
              <Gavel className="mt-0.5 h-5 w-5 text-violet" />
              <p className="text-xs text-muted-foreground">
                AI briefs may inform your review, but they do not decide outcomes. Jurors hold final authority.
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {assignedCases.map((item) => (
            <GlassCard key={item.id} className="p-5" hover>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">vs. {item.defendant}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{item.deadline}</span>
                    <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-cyan" />{item.reward}</span>
                    <span>{item.evidenceCount} evidence files</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/case/${item.id}`}>Open Case</Link>
                  </Button>
                  {item.status === "active" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        disabled={voteState.status === "loading"}
                        onClick={() => handleVote(item.id, "defendant")}
                      >
                        <ThumbsDown className="mr-1 h-3.5 w-3.5" />Defendant
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success text-primary-foreground hover:bg-success/90"
                        disabled={voteState.status === "loading"}
                        onClick={() => handleVote(item.id, "plaintiff")}
                      >
                        <ThumbsUp className="mr-1 h-3.5 w-3.5" />Plaintiff
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {voteState.caseId === item.id && voteState.status !== "idle" && (
                <p className={`mt-3 text-xs ${voteState.status === "success" ? "text-success" : voteState.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {voteState.message}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
