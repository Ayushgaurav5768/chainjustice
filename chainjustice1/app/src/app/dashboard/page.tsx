import Link from "next/link"
import Button from "@/components/ui/button"
import PageHeader from "@/components/page-header"
import StatCard from "@/components/stat-card"
import GlassCard from "@/components/glass-card"
import StatusBadge from "@/components/status-badge"
import TrustScore from "@/components/trust-score"
import WalletButton from "@/components/wallet-button"
import {
  Scale,
  FileText,
  Users,
  Coins,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"

const recentCases = [
  {
    id: "CJ-2024-001",
    title: "Unauthorized Data Collection",
    defendant: "GPT-Vision Pro",
    status: "active" as const,
    filed: "2 hours ago",
  },
  {
    id: "CJ-2024-002",
    title: "Biased Output Generation",
    defendant: "TextGen-3.5",
    status: "pending" as const,
    filed: "5 hours ago",
  },
  {
    id: "CJ-2024-003",
    title: "Copyright Infringement",
    defendant: "ImageMaker AI",
    status: "resolved" as const,
    filed: "1 day ago",
  },
  {
    id: "CJ-2024-004",
    title: "Privacy Violation",
    defendant: "VoiceClone X",
    status: "rejected" as const,
    filed: "2 days ago",
  },
]

const topModels = [
  { name: "SafeAI Core", score: 94, cases: 2, insurance: "12,500 SOL" },
  { name: "EthicalLLM", score: 87, cases: 5, insurance: "8,200 SOL" },
  { name: "TransparentGPT", score: 76, cases: 8, insurance: "6,800 SOL" },
]

const verdictStats = {
  total: 847,
  inFavor: 423,
  dismissed: 312,
  pending: 112,
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of the ChainJustice ecosystem"
      >
        <WalletButton />
        <Button className="bg-cyan text-primary-foreground hover:bg-cyan/90" asChild>
          <Link href="/cases/file">
            File New Case
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Cases"
          value="47"
          change="+12% from last week"
          changeType="positive"
          icon={FileText}
          iconColor="cyan"
        />
        <StatCard
          label="Registered Models"
          value="1,234"
          change="+8% from last month"
          changeType="positive"
          icon={Scale}
          iconColor="violet"
        />
        <StatCard
          label="Active Jurors"
          value="892"
          change="-3% from last week"
          changeType="negative"
          icon={Users}
          iconColor="cyan"
        />
        <StatCard
          label="Total Insurance Staked"
          value="$4.2M"
          change="+15% from last month"
          changeType="positive"
          icon={Coins}
          iconColor="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Cases</h2>
              <Button variant="ghost" size="sm" className="text-cyan" asChild>
                <Link href="/precedents">View All</Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {caseItem.id}
                      </span>
                      <StatusBadge status={caseItem.status} size="sm" />
                    </div>
                    <p className="mt-1 truncate font-medium">{caseItem.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      vs. {caseItem.defendant}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {caseItem.filed}
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Verdict Summary */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold">Verdict Summary</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm">In Plaintiff&apos;s Favor</span>
                </div>
                <span className="font-semibold text-success">{verdictStats.inFavor}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Dismissed</span>
                </div>
                <span className="font-semibold text-muted-foreground">{verdictStats.dismissed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold text-warning">{verdictStats.pending}</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Cases</span>
                  <span className="text-lg font-bold text-cyan">{verdictStats.total}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Top Models */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top Trusted Models</h2>
              <Button variant="ghost" size="sm" className="text-cyan" asChild>
                <Link href="/registry">View All</Link>
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {topModels.map((model, index) => (
                <div
                  key={model.name}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/10 text-sm font-bold text-cyan">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{model.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {model.cases} cases · {model.insurance}
                    </p>
                  </div>
                  <TrustScore score={model.score} size="sm" showLabel={false} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/registry">
          <GlassCard className="p-5 transition-all hover:border-cyan/30" hover>
            <Scale className="h-8 w-8 text-cyan" />
            <h3 className="mt-3 font-semibold">Model Registry</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse registered AI models and their trust scores
            </p>
          </GlassCard>
        </Link>
        <Link href="/juror">
          <GlassCard className="p-5 transition-all hover:border-violet/30" hover>
            <Users className="h-8 w-8 text-violet" />
            <h3 className="mt-3 font-semibold">Juror Portal</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Stake SOL and participate in case verdicts
            </p>
          </GlassCard>
        </Link>
        <Link href="/cases/file">
          <GlassCard className="p-5 transition-all hover:border-cyan/30" hover>
            <FileText className="h-8 w-8 text-cyan" />
            <h3 className="mt-3 font-semibold">File a Case</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit evidence and file a case against an AI model
            </p>
          </GlassCard>
        </Link>
        <Link href="/precedents">
          <GlassCard className="p-5 transition-all hover:border-violet/30" hover>
            <TrendingUp className="h-8 w-8 text-violet" />
            <h3 className="mt-3 font-semibold">Precedents</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review past cases and their verdicts
            </p>
          </GlassCard>
        </Link>
      </div>
    </div>
  )
}
