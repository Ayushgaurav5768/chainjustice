"use client"

import type { ChangeEvent } from "react"
import { useState } from "react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import PageHeader from "@/components/page-header"
import GlassCard from "@/components/glass-card"
import TrustScore from "@/components/trust-score"
import StatusBadge from "@/components/status-badge"
import WalletButton from "@/components/wallet-button"
import {
  Search,
  Plus,
  ExternalLink,
  Shield,
  AlertTriangle,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react"

interface AIModel {
  id: string
  name: string
  developer: string
  trustScore: number
  insuranceDeposit: string
  violations: number
  registeredAt: string
  status: "active" | "warning" | "suspended"
  category: string
}

const mockModels: AIModel[] = [
  {
    id: "model-001",
    name: "SafeAI Core",
    developer: "SafeAI Labs",
    trustScore: 94,
    insuranceDeposit: "12,500 SOL",
    violations: 0,
    registeredAt: "2024-01-15",
    status: "active",
    category: "Language Model",
  },
  {
    id: "model-002",
    name: "EthicalLLM",
    developer: "Ethics First Inc",
    trustScore: 87,
    insuranceDeposit: "8,200 SOL",
    violations: 2,
    registeredAt: "2024-02-20",
    status: "active",
    category: "Language Model",
  },
  {
    id: "model-003",
    name: "TransparentGPT",
    developer: "OpenTransparency",
    trustScore: 76,
    insuranceDeposit: "6,800 SOL",
    violations: 5,
    registeredAt: "2024-03-10",
    status: "warning",
    category: "Language Model",
  },
  {
    id: "model-004",
    name: "ImageMaker AI",
    developer: "VisualTech Corp",
    trustScore: 62,
    insuranceDeposit: "4,500 SOL",
    violations: 8,
    registeredAt: "2024-01-28",
    status: "warning",
    category: "Image Generation",
  },
  {
    id: "model-005",
    name: "VoiceClone X",
    developer: "AudioAI Systems",
    trustScore: 45,
    insuranceDeposit: "2,100 SOL",
    violations: 12,
    registeredAt: "2024-02-05",
    status: "suspended",
    category: "Audio Generation",
  },
  {
    id: "model-006",
    name: "CodeAssist Pro",
    developer: "DevTools Inc",
    trustScore: 91,
    insuranceDeposit: "10,000 SOL",
    violations: 1,
    registeredAt: "2024-03-01",
    status: "active",
    category: "Code Generation",
  },
]

export default function RegistryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [registerState, setRegisterState] = useState<{
    status: "idle" | "loading" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })
  const [modelName, setModelName] = useState("")
  const [developerName, setDeveloperName] = useState("")
  const [category, setCategory] = useState("Language Model")
  const [insuranceDeposit, setInsuranceDeposit] = useState("")
  const [documentationUrl, setDocumentationUrl] = useState("")
  const [apiEndpoint, setApiEndpoint] = useState("")

  const resetForm = () => {
    setModelName("")
    setDeveloperName("")
    setCategory("Language Model")
    setInsuranceDeposit("")
    setDocumentationUrl("")
    setApiEndpoint("")
    setRegisterState({ status: "idle", message: "" })
  }

  const closeModal = () => {
    setShowRegisterModal(false)
    resetForm()
  }

  const handleRegisterModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!modelName || !developerName || !insuranceDeposit || !documentationUrl) {
      setRegisterState({
        status: "error",
        message: "Please fill in all required fields.",
      })
      return
    }

    setRegisterState({ status: "loading", message: "Submitting model registration..." })

    try {
      const response = await fetch("/api/ai-legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "registry.register_model",
          payload: {
            modelName,
            developer: developerName,
            category,
            insuranceDeposit,
            documentationUrl,
            apiEndpoint,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Registration request failed")
      }

      setRegisterState({ status: "success", message: "Model registration submitted." })
    } catch (error) {
      setRegisterState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to register model.",
      })
    }
  }

  const filteredModels = mockModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.developer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !filterStatus || model.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: mockModels.length,
    active: mockModels.filter((m) => m.status === "active").length,
    warning: mockModels.filter((m) => m.status === "warning").length,
    suspended: mockModels.filter((m) => m.status === "suspended").length,
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Model Registry"
        description="Browse and register AI models with insurance deposits"
      >
        <WalletButton />
        <Button
          className="bg-cyan text-primary-foreground hover:bg-cyan/90"
          onClick={() => setShowRegisterModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Register Model
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <GlassCard className="p-4 text-center" hover>
          <p className="text-2xl font-bold text-cyan">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Models</p>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover>
          <p className="text-2xl font-bold text-warning">{stats.warning}</p>
          <p className="text-sm text-muted-foreground">Under Review</p>
        </GlassCard>
        <GlassCard className="p-4 text-center" hover>
          <p className="text-2xl font-bold text-destructive">{stats.suspended}</p>
          <p className="text-sm text-muted-foreground">Suspended</p>
        </GlassCard>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models or developers..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="bg-secondary/50 pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
            className={filterStatus === null ? "bg-cyan text-primary-foreground" : ""}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
            className={filterStatus === "active" ? "bg-success text-primary-foreground" : ""}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("warning")}
            className={filterStatus === "warning" ? "bg-warning text-primary-foreground" : ""}
          >
            Warning
          </Button>
          <Button
            variant={filterStatus === "suspended" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("suspended")}
            className={filterStatus === "suspended" ? "bg-destructive text-primary-foreground" : ""}
          >
            Suspended
          </Button>
        </div>
      </div>

      {/* Models Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trust Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Insurance
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Violations
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredModels.map((model) => (
                <tr key={model.id} className="bg-card transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-muted-foreground">{model.developer}</p>
                      <p className="text-xs text-muted-foreground">{model.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <TrustScore score={model.trustScore} size="sm" showLabel={false} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan" />
                      <span className="font-mono text-sm">{model.insuranceDeposit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {model.violations > 0 ? (
                        <>
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              model.violations > 5 ? "text-destructive" : "text-warning"
                            }`}
                          />
                          <span
                            className={
                              model.violations > 5 ? "text-destructive" : "text-warning"
                            }
                          >
                            {model.violations}
                          </span>
                        </>
                      ) : (
                        <span className="text-success">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={model.status === "suspended" ? "rejected" : model.status}
                      label={model.status === "suspended" ? "Suspended" : undefined}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredModels.length === 0 && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No models found matching your criteria
          </div>
        )}
      </GlassCard>

      {/* Register Model Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <GlassCard className="mx-4 w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Register New Model</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleRegisterModel}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model Name</label>
                <Input
                  placeholder="Enter model name"
                  className="bg-secondary/50"
                  value={modelName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setModelName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Developer / Organization</label>
                <Input
                  placeholder="Enter developer name"
                  className="bg-secondary/50"
                  value={developerName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDeveloperName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Language Model</option>
                    <option>Image Generation</option>
                    <option>Audio Generation</option>
                    <option>Code Generation</option>
                    <option>Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Insurance Deposit (SOL)</label>
                <Input
                  type="number"
                  placeholder="Minimum 1,000 SOL"
                  className="bg-secondary/50"
                  value={insuranceDeposit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInsuranceDeposit(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Higher deposits increase trust score and unlock premium registry features
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Model Documentation URL</label>
                <Input
                  placeholder="https://..."
                  className="bg-secondary/50"
                  value={documentationUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDocumentationUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Endpoint (Optional)</label>
                <Input
                  placeholder="https://api.example.com/v1"
                  className="bg-secondary/50"
                  value={apiEndpoint}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setApiEndpoint(e.target.value)}
                />
              </div>

              {registerState.status !== "idle" && (
                <p
                  className={`text-sm ${
                    registerState.status === "success" ? "text-success" : "text-destructive"
                  }`}
                >
                  {registerState.message}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerState.status === "loading"}
                  className="flex-1 bg-cyan text-primary-foreground hover:bg-cyan/90"
                >
                  {registerState.status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Model"
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
