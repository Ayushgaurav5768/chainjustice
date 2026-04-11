"use client"

import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import { uploadEvidenceFile } from "@/lib/ipfs"
import {
  AlertCircle,
  Brain,
  CheckCircle,
  FileText,
  Loader2,
  Shield,
  Upload,
  X,
} from "lucide-react"

type UploadedEvidence = {
  id: string
  name: string
  mimeType: string
  size: number
  status: "uploading" | "uploaded" | "error"
  ipfsHash?: string
  gatewayUrl?: string
  error?: string
}

type ModelOption = {
  id: string
  name: string
  provider: string
  category: string
}

const MODELS: ModelOption[] = [
  { id: "model-001", name: "SafeAI Core", provider: "SafeAI Labs", category: "Language" },
  { id: "model-002", name: "GPT-Vision Pro", provider: "Vision Labs", category: "Vision" },
  { id: "model-003", name: "CodeAssist Pro", provider: "DevTools Inc", category: "Code" },
  { id: "model-004", name: "VoiceClone X", provider: "AudioAI Systems", category: "Audio" },
]

const CATEGORIES = [
  "Unauthorized Data Collection",
  "Biased Output Generation",
  "Privacy Violation",
  "Security Vulnerability",
  "Misleading Claims",
  "Copyright Infringement",
  "Other",
]

const formatSize = (size: number): string => `${(size / 1024).toFixed(1)} KB`

export default function FileCasePage() {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [modelId, setModelId] = useState("")
  const [provider, setProvider] = useState("")
  const [description, setDescription] = useState("")
  const [evidence, setEvidence] = useState<UploadedEvidence[]>([])
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
    nextCaseId?: string
  }>({ status: "idle", message: "" })

  const selectedModel = useMemo(
    () => MODELS.find((item) => item.id === modelId) || null,
    [modelId]
  )

  const isValid =
    title.trim().length >= 8 &&
    category &&
    modelId &&
    provider.trim().length >= 2 &&
    description.trim().length >= 60 &&
    evidence.length > 0 &&
    evidence.every((item) => item.status === "uploaded")

  const handleSelectModel = (nextModelId: string) => {
    setModelId(nextModelId)
    const nextModel = MODELS.find((item) => item.id === nextModelId)
    if (nextModel) {
      setProvider(nextModel.provider)
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const queue = Array.from(files).map((file) => ({ file, id: crypto.randomUUID() }))

    setEvidence((prev) => [
      ...prev,
      ...queue.map(({ id, file }) => ({
        id,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        status: "uploading" as const,
      })),
    ])

    for (const item of queue) {
      try {
        const result = await uploadEvidenceFile(item.file)
        setEvidence((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "uploaded",
                  ipfsHash: result.data.ipfsHash,
                  gatewayUrl: result.data.gatewayUrl,
                }
              : entry
          )
        )
      } catch (error) {
        setEvidence((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : entry
          )
        )
      }
    }

    event.target.value = ""
  }

  const removeEvidence = (id: string) => {
    setEvidence((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    if (!isValid) return

    setSubmitState({ status: "loading", message: "Submitting case and generating AI briefs..." })

    try {
      const response = await fetch("/api/ai-legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adversarial_council",
          data: {
            mode: "case_analysis",
            title,
            category,
            modelFamily: provider,
            provider,
            description,
            evidence: evidence.map((item) => ({
              name: item.name,
              mimeType: item.mimeType,
              size: item.size,
              ipfsHash: item.ipfsHash,
              gatewayUrl: item.gatewayUrl,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Case submission failed")
      }

      const now = Date.now().toString().slice(-6)
      const nextCaseId = `CJ-2026-${now}`

      setSubmitState({
        status: "success",
        message: "Case filed successfully. Advisory briefs are ready for juror review.",
        nextCaseId,
      })
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to submit case",
      })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="File a Case"
        description="Submit an AI accountability complaint with evidence anchored to IPFS."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-6" glow="cyan">
            <h2 className="text-lg font-semibold">Case Intake</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI briefs are non-binding. Human jurors decide final outcomes.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Case Title</label>
                <Input
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Example: Undisclosed profile inference from private prompts"
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Accused Model</label>
                <select
                  value={modelId}
                  onChange={(e) => handleSelectModel(e.target.value)}
                  className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="">Select model</option>
                  {MODELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Provider / Developer</label>
                <Input
                  value={provider}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProvider(e.target.value)}
                  placeholder="Organization or provider behind the model"
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Complaint Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
                  placeholder="Describe timeline, expected behavior, observed behavior, and user impact."
                />
                <p className="text-xs text-muted-foreground">Minimum 60 characters</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold">Evidence Upload</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload evidence files. Each file gets an IPFS hash and gateway URL.
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-cyan/60">
              <Upload className="h-9 w-9 text-cyan" />
              <p className="mt-3 text-sm font-medium">Drop files or click to upload</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP, GIF, PDF, TXT, DOC, DOCX up to 10MB</p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleUpload}
              />
            </label>

            {evidence.length > 0 && (
              <div className="mt-4 space-y-2">
                {evidence.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
                    <FileText className="h-5 w-5 text-cyan" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.mimeType} • {formatSize(item.size)}
                        {item.ipfsHash ? ` • ${item.ipfsHash.slice(0, 12)}...` : ""}
                      </p>
                      {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                    </div>
                    {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-cyan" />}
                    {item.status === "uploaded" && <CheckCircle className="h-4 w-4 text-success" />}
                    {item.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    <Button variant="ghost" size="sm" onClick={() => removeEvidence(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6" glow="violet">
            <h3 className="text-base font-semibold">Submission Checklist</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{title.trim().length >= 8 ? "OK" : "-"} Title is specific</li>
              <li>{category ? "OK" : "-"} Category selected</li>
              <li>{selectedModel ? "OK" : "-"} Model selected</li>
              <li>{provider.trim().length >= 2 ? "OK" : "-"} Provider named</li>
              <li>{description.trim().length >= 60 ? "OK" : "-"} Description complete</li>
              <li>{evidence.every((item) => item.status === "uploaded") && evidence.length > 0 ? "OK" : "-"} Evidence uploaded</li>
            </ul>

            <Button
              className="mt-6 w-full bg-cyan text-primary-foreground hover:bg-cyan/90"
              disabled={!isValid || submitState.status === "loading"}
              onClick={handleSubmit}
            >
              {submitState.status === "loading" ? "Submitting..." : "Submit Case"}
            </Button>

            {submitState.status !== "idle" && (
              <p className={`mt-3 text-sm ${submitState.status === "success" ? "text-success" : "text-destructive"}`}>
                {submitState.message}
              </p>
            )}

            {submitState.status === "success" && submitState.nextCaseId && (
              <Button variant="outline" className="mt-3 w-full" asChild>
                <Link href={`/case/${submitState.nextCaseId}`}>Open Case Details</Link>
              </Button>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 text-violet" />
              <div>
                <p className="text-sm font-semibold text-violet">Non-Binding AI Analysis</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prosecution, defense, and neutral synthesis briefs help jurors reason faster. AI never issues verdicts.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-cyan" />
              <p className="text-xs text-muted-foreground">
                Final decisions are made exclusively by human jurors. Evidence and outcomes are publicly auditable.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
