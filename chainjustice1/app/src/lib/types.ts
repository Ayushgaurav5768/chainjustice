export type {
  AIModel,
  CaseRecord,
  EvidenceItem,
  JurorProfile,
  VerdictLedgerEntry,
  AIBrief,
} from "@/types"

export type ApiRequestBody = {
  action: string
  data?: Record<string, unknown>
  payload?: Record<string, unknown>
}

export type CaseRecommendation = "in-favor" | "dismiss" | "more-evidence"

export type CaseStatus = "active" | "pending" | "resolved" | "rejected"

export type AdvisoryDisclaimer =
  "AI output is advisory only and has no binding authority. Final decisions are made exclusively by human jurors."
