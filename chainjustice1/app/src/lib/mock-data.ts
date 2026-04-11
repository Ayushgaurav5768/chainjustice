import { ADVISORY_DISCLAIMER } from "@/lib/constants"
import type { AIModel, CaseRecord, JurorProfile, VerdictLedgerEntry } from "@/types"

export const mockModels: AIModel[] = [
  {
    id: "model-007",
    name: "GPT-Vision Pro",
    developer: "Vision Labs",
    modelFamily: "Vision-GPT",
    category: "Multimodal",
    trustScore: 72,
    insuranceDeposit: "8,500 SOL",
    violations: 3,
    status: "warning",
    registeredAt: "2024-02-12",
  },
]

export const mockCases: CaseRecord[] = [
  {
    id: "CJ-2024-001",
    title: "Unauthorized Data Collection",
    category: "Privacy Violation",
    status: "active",
    filedAt: "March 28, 2024",
    plaintiff: "Anonymous User #4821",
    defendant: {
      modelId: "model-007",
      name: "GPT-Vision Pro",
      developer: "Vision Labs",
    },
    description:
      "Model telemetry indicated undisclosed retention of user prompt metadata and transfer to non-documented endpoints.",
    evidence: [
      {
        id: "ev-001",
        name: "network_logs_march_2024.pdf",
        type: "PDF",
        size: "2.4 MB",
        ipfsHash: "QmX7b2yF3hNkL9sWc8Z1dA",
        uploadedAt: "March 28, 2024",
      },
    ],
    aiBrief: {
      recommendation: "in-favor",
      confidence: 87,
      summary:
        "Evidence suggests strong support for the plaintiff claim, with endpoint mismatch and retention policy inconsistency.",
      keyFindings: [
        "Transmission to undocumented endpoints appears repeatable",
        "Retention terms do not clearly disclose observed behavior",
      ],
      legalPrecedents: ["CJ-2024-012", "CJ-2023-089"],
      advisoryOnly: true,
      disclaimer: ADVISORY_DISCLAIMER,
    },
    jurorVoting: {
      total: 5,
      voted: 3,
      inFavor: 2,
      dismissed: 1,
      pending: 2,
      deadline: "2 days remaining",
    },
    verdict: null,
  },
]

export const mockJurorProfile: JurorProfile = {
  walletAddress: "DemoWallet111111111111111111111111111111111",
  displayName: "Demo Juror",
  stakedAmount: "1,250 SOL",
  earnings: "342 SOL",
  casesJudged: 47,
  accuracyRate: 94,
  tier: "Silver",
  activeAssignments: 3,
}

export const mockVerdictLedger: VerdictLedgerEntry[] = [
  {
    entryId: "ledger-001",
    caseId: "CJ-2024-001",
    modelId: "model-007",
    modelName: "GPT-Vision Pro",
    verdict: "plaintiff",
    trustScoreBefore: 78,
    trustScoreAfter: 72,
    trustDelta: -6,
    insurancePoolBefore: "9,100 SOL",
    insurancePoolAfter: "8,500 SOL",
    recordedAt: "2024-03-30T17:31:00Z",
    txSignature: "5NQhT3fDemoTxSig111111111111111111111111111111",
  },
]
