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

export type ApiErrorResponse = {
  success: false
  error: {
    code:
      | "BAD_REQUEST"
      | "INVALID_CONTENT_TYPE"
      | "MISSING_FILE"
      | "INVALID_FILE_TYPE"
      | "FILE_TOO_LARGE"
      | "AI_PROVIDER_ERROR"
      | "PINATA_UPLOAD_FAILED"
      | "INTERNAL_ERROR"
    message: string
    details?: Record<string, unknown>
  }
}

export type AiLegalCouncilResponse = {
  success: true
  model: string
  fallbackMode: boolean
  source: "mock" | "live"
  advisory: AdvisoryDisclaimer
  data: {
    schemaVersion: "1.0.0"
    label: "AI Case Brief"
    analysisType: "Non-Binding AI Analysis"
    actionMode:
      | "case_analysis"
      | "evidence_analysis"
      | "juror_guidance"
      | "precedent_search"
      | "model_risk_analysis"
    advisoryOnly: true
    humanAuthority: "Human jurors remain final authority"
    prosecutionBrief: {
      label: "AI Case Brief"
      analysisType: "Non-Binding AI Analysis"
      thesis: string
      keyArguments: string[]
      citedEvidence: string[]
      legalTheory: string
      vulnerabilities: string[]
      confidence: number
      uncertaintyNotes: string[]
    }
    defenseBrief: {
      label: "AI Case Brief"
      analysisType: "Non-Binding AI Analysis"
      thesis: string
      keyArguments: string[]
      citedEvidence: string[]
      legalTheory: string
      vulnerabilities: string[]
      confidence: number
      uncertaintyNotes: string[]
    }
    neutralSynthesis: {
      label: "AI Case Brief"
      analysisType: "Non-Binding AI Analysis"
      synthesisSummary: string
      strongestProsecutionPoints: string[]
      strongestDefensePoints: string[]
      unresolvedQuestions: string[]
      jurorGuidance: string[]
      confidence: number
      uncertaintyNotes: string[]
    }
    evidenceGaps: string[]
    contradictions: string[]
    confidenceAndUncertaintyNotes: string[]
    recommendedQuestionsForJurors: string[]
    aiDisagreementMeter: "low" | "medium" | "high"
    conflictFirewall: {
      accusedProvider: string
      assistingModelFamily: string
      conflictDetected: boolean
      routedProvider: string | null
      fallbackModeFlagged: boolean
      notes: string[]
    }
    advisoryDisclaimer: AdvisoryDisclaimer
  }
}

export type IpfsUploadResponse = {
  success: true
  fallbackMode: boolean
  source: "pinata" | "mock"
  data: {
    cid: string
    url: string
    filename: string
    mimeType: string
    size: number
    // Backward-compatible aliases for existing UI.
    ipfsHash: string
    gatewayUrl: string
    originalFilename: string
    uploadedAt: string
  }
}
