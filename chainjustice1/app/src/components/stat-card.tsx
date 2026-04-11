import { cn } from "@/lib/utils"
import GlassCard from "./glass-card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
  iconColor?: "cyan" | "violet" | "success" | "warning"
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "cyan",
}: StatCardProps) {
  const iconColorClasses = {
    cyan: "text-cyan bg-cyan/20 shadow-[0_0_15px_oklch(0.75_0.18_195/0.3)]",
    violet: "text-violet bg-violet/20 shadow-[0_0_15px_oklch(0.65_0.20_300/0.3)]",
    success: "text-success bg-success/20 shadow-[0_0_15px_oklch(0.70_0.15_145/0.3)]",
    warning: "text-warning bg-warning/20 shadow-[0_0_15px_oklch(0.80_0.15_85/0.3)]",
  }

  const changeColorClasses = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  }

  return (
    <GlassCard className="p-5" hover intensity="normal">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn("text-xs font-medium", changeColorClasses[changeType])}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2.5", iconColorClasses[iconColor])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </GlassCard>
  )
}

export default StatCard
