export interface EvidenceItem {
  id: string
  name: string
  type: string
  size: string
  ipfsHash: string
  uploadedAt: string
  url?: string
}

export interface AIBrief {
  recommendation: "in-favor" | "dismiss" | "more-evidence"
  confidence: number
  summary: string
  keyFindings: string[]
  legalPrecedents: string[]
  advisoryOnly: true
  disclaimer: "AI output is advisory only and has no binding authority. Final decisions are made exclusively by human jurors."
}

export interface AIModel {
  id: string
  name: string
  developer: string
  modelFamily?: string
  category: string
  trustScore: number
  insuranceDeposit: string
  violations: number
  status: "active" | "warning" | "suspended"
  registeredAt: string
}

export interface JurorProfile {
  walletAddress: string
  displayName: string
  stakedAmount: string
  earnings: string
  casesJudged: number
  accuracyRate: number
  tier: "Bronze" | "Silver" | "Gold"
  activeAssignments: number
}

export interface CaseRecord {
  id: string
  title: string
  category: string
  status: "active" | "pending" | "resolved" | "rejected"
  filedAt: string
  plaintiff: string
  defendant: {
    modelId: string
    name: string
    developer: string
  }
  description: string
  evidence: EvidenceItem[]
  aiBrief: AIBrief
  jurorVoting: {
    total: number
    voted: number
    inFavor: number
    dismissed: number
    pending: number
    deadline: string
  }
  verdict: "plaintiff" | "defendant" | "split" | null
}

export interface VerdictLedgerEntry {
  entryId: string
  caseId: string
  modelId: string
  modelName: string
  verdict: "plaintiff" | "defendant" | "split"
  trustScoreBefore: number
  trustScoreAfter: number
  trustDelta: number
  insurancePoolBefore: string
  insurancePoolAfter: string
  recordedAt: string
  txSignature: string
}
