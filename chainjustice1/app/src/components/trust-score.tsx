import { cn } from "@/lib/utils"

interface TrustScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function TrustScore({ score, size = "md", showLabel = true }: TrustScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-success", bg: "bg-success", glow: "shadow-success/30" }
    if (score >= 60) return { text: "text-cyan", bg: "bg-cyan", glow: "shadow-cyan/30" }
    if (score >= 40) return { text: "text-warning", bg: "bg-warning", glow: "shadow-warning/30" }
    return { text: "text-destructive", bg: "bg-destructive", glow: "shadow-destructive/30" }
  }

  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  const sizeClasses = {
    sm: { container: "h-12 w-12", text: "text-sm", label: "text-[10px]" },
    md: { container: "h-16 w-16", text: "text-lg", label: "text-xs" },
    lg: { container: "h-24 w-24", text: "text-2xl", label: "text-sm" },
  }

  return (
    <div className={cn("relative", sizeClasses[size].container)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(colors.text, "transition-all duration-500")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", sizeClasses[size].text, colors.text)}>{score}</span>
        {showLabel && (
          <span className={cn("text-muted-foreground", sizeClasses[size].label)}>Trust</span>
        )}
      </div>
    </div>
  )
}

export default TrustScore
