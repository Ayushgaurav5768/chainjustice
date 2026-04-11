import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: "cyan" | "violet" | "none"
  intensity?: "subtle" | "normal" | "intense"
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = "none",
  intensity = "normal"
}: GlassCardProps) {
  const intensityClass = {
    subtle: "glass-subtle",
    normal: "glass-card",
    intense: "glass-intense glass-border-glow"
  }[intensity]

  return (
    <div
      className={cn(
        "rounded-xl relative overflow-hidden",
        intensityClass,
        hover && "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        glow === "cyan" && "glow-cyan",
        glow === "violet" && "glow-violet",
        className
      )}
    >
      {/* Inner highlight gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-glass-highlight via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default GlassCard
