"use client"

import type { ChangeEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import {
  Upload,
  FileText,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Scale,
  Brain,
  Shield,
} from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  size: string
  type: string
  status: "uploading" | "uploaded" | "error"
  ipfsHash?: string
  error?: string
}

const mockModels = [
  { id: "model-001", name: "SafeAI Core", developer: "SafeAI Labs" },
  { id: "model-002", name: "EthicalLLM", developer: "Ethics First Inc" },
  { id: "model-003", name: "TransparentGPT", developer: "OpenTransparency" },
  { id: "model-004", name: "ImageMaker AI", developer: "VisualTech Corp" },
  { id: "model-005", name: "VoiceClone X", developer: "AudioAI Systems" },
  { id: "model-006", name: "CodeAssist Pro", developer: "DevTools Inc" },
  { id: "model-007", name: "GPT-Vision Pro", developer: "Vision Labs" },
  { id: "model-008", name: "TextGen-3.5", developer: "TextGen Inc" },
]

const caseCategories = [
  "Unauthorized Data Collection",
  "Biased Output Generation",
  "Copyright Infringement",
  "Privacy Violation",
  "Misleading Claims",
  "Discriminatory Filtering",
  "Security Vulnerability",
  "Terms of Service Violation",
  "Other",
]

export default function FileCasePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionState, setSubmissionState] = useState<{
    status: "idle" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })

  // Form state
  const [caseTitle, setCaseTitle] = useState("")
  const [caseCategory, setCaseCategory] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const filesToUpload = Array.from(files).map((file) => ({
      file,
      id: crypto.randomUUID(),
    }))

    filesToUpload.forEach(({ file, id }) => {

      const newFile: UploadedFile = {
        id,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.split("/")[1]?.toUpperCase() || "FILE",
        status: "uploading",
      }

      setUploadedFiles((prev) => [...prev, newFile])
    })

    for (const { file, id } of filesToUpload) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/ipfs", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const result = await response.json().catch(() => ({}))
        const ipfsHash = result?.ipfsHash || result?.cid || result?.hash || "Uploaded"

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "uploaded",
                  ipfsHash,
                  error: undefined,
                }
              : f
          )
        )
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        )
      }
    }

    e.target.value = ""
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionState({ status: "idle", message: "" })

    try {
      const response = await fetch("/api/ai-legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cases.submit",
          payload: {
            caseTitle,
            caseCategory,
            selectedModel,
            description,
            evidence: uploadedFiles.map((file) => ({
              name: file.name,
              type: file.type,
              size: file.size,
              ipfsHash: file.ipfsHash,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Case submission failed")
      }

      const result = await response.json().catch(() => ({}))
      const nextCaseId = result?.caseId || "CJ-2024-NEW"

      setSubmissionState({ status: "success", message: "Case submitted successfully." })
      router.push(`/cases/${nextCaseId}`)
    } catch (error) {
      setSubmissionState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit case.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = caseTitle && caseCategory && selectedModel
  const canProceedToStep3 = description.length >= 50
  const canSubmit = uploadedFiles.length > 0 && uploadedFiles.every((f) => f.status === "uploaded")

  return (
    <div className="space-y-8">
      <PageHeader
        title="File a Case"
        description="Submit evidence and file a case against an AI model"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { num: 1, label: "Details" },
          { num: 2, label: "Description" },
          { num: 3, label: "Evidence" },
          { num: 4, label: "Review" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                step >= s.num
                  ? "border-cyan bg-cyan text-primary-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
            </div>
            <span
              className={`hidden text-sm sm:block ${
                step >= s.num ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < 3 && (
              <div
                className={`h-px w-8 sm:w-16 ${
                  step > s.num ? "bg-cyan" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Step 1: Case Details */}
        {step === 1 && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold">Case Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide basic information about your case
            </p>

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Case Title</label>
                <Input
                  placeholder="Brief title describing the violation"
                  value={caseTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCaseTitle(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="relative">
                  <select
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value)}
                    className="w-full appearance-none rounded-md border border-input bg-blue-600 text-white px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-blue-600 text-white">Select a category</option>
                    {caseCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-blue-600 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Defendant Model</label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none rounded-md border border-input bg-blue-600 text-white px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-blue-600 text-white">Select a model</option>
                    {mockModels.map((model) => (
                      <option key={model.id} value={model.id} className="bg-blue-600 text-white">
                        {model.name} - {model.developer}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only registered models can be named as defendants
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="bg-cyan text-primary-foreground hover:bg-cyan/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold">Case Description</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe the violation in detail
            </p>

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the AI model's violation in detail. Include specific instances, dates, and any relevant context that supports your case..."
                  rows={8}
                  className="w-full resize-none rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Minimum 50 characters required
                  </span>
                  <span
                    className={
                      description.length >= 50 ? "text-success" : "text-muted-foreground"
                    }
                  >
                    {description.length} / 50
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-cyan" />
                  <div className="text-sm">
                    <p className="font-medium text-cyan">Writing Tips</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>Be specific about dates and times of incidents</li>
                      <li>Describe the expected vs actual behavior</li>
                      <li>Explain the harm or damage caused</li>
                      <li>Reference any terms of service violations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="bg-cyan text-primary-foreground hover:bg-cyan/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 3: Evidence Upload */}
        {step === 3 && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold">Upload Evidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Files will be stored on IPFS for immutable record-keeping
            </p>

            <div className="mt-6 space-y-6">
              {/* Upload Area */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/20 p-8 transition-colors hover:border-cyan/50 hover:bg-secondary/30">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports images, PDFs, and text files (max 10MB each)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Uploaded Files</p>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10">
                        <FileText className="h-5 w-5 text-cyan" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{file.type}</span>
                          <span>•</span>
                          <span>{file.size}</span>
                          {file.ipfsHash && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-cyan">
                                {file.ipfsHash.slice(0, 8)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {file.status === "uploading" && (
                        <Loader2 className="h-5 w-5 animate-spin text-cyan" />
                      )}
                      {file.status === "uploaded" && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {uploadedFiles.some((file) => file.status === "error") && (
                    <p className="text-sm text-destructive">
                      One or more files failed to upload. Remove and retry.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canSubmit}
                  className="bg-cyan text-primary-foreground hover:bg-cyan/90"
                >
                  Review Case
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold">Review Your Case</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please review all details before submitting
              </p>

              <div className="mt-6 space-y-6">
                <div className="space-y-4 rounded-lg border border-border/50 bg-secondary/20 p-4">
                  <div className="flex items-start gap-3">
                    <Scale className="mt-1 h-5 w-5 text-cyan" />
                    <div>
                      <p className="text-xs text-muted-foreground">Case Title</p>
                      <p className="font-medium">{caseTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-1 h-5 w-5 text-violet" />
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{caseCategory}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-5 w-5 text-warning" />
                    <div>
                      <p className="text-xs text-muted-foreground">Defendant</p>
                      <p className="font-medium">
                        {mockModels.find((m) => m.id === selectedModel)?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{description}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Evidence ({uploadedFiles.length} files)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* AI Analysis Notice */}
            <GlassCard className="border-violet/30 bg-violet/5 p-4">
              <div className="flex items-start gap-3">
                <Brain className="mt-0.5 h-5 w-5 text-violet" />
                <div className="text-sm">
                  <p className="font-medium text-violet">AI Legal Analysis</p>
                  <p className="mt-1 text-muted-foreground">
                    After submission, our xAI-powered legal engine will analyze your case
                    and evidence, providing structured recommendations for jurors.
                  </p>
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <div className="text-right">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-cyan text-primary-foreground hover:bg-cyan/90 glow-cyan"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Case"
                  )}
                </Button>
                {submissionState.status !== "idle" && (
                  <p
                    className={`mt-2 text-sm ${
                      submissionState.status === "success" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {submissionState.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
