"use client"

import GlassCard from "@/components/glass-card"

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-border/50" />
        <div className="h-3 w-24 rounded bg-border/30" />
      </div>
      <div className="h-8 w-16 rounded bg-border/50" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="space-y-3">
        <div className="h-6 w-40 rounded bg-border/50" />
        <div className="h-4 w-full rounded bg-border/30" />
        <div className="h-4 w-3/4 rounded bg-border/30" />
      </div>
    </GlassCard>
  )
}

export function ChartSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="h-64 rounded-lg bg-gradient-to-b from-border/30 to-border/10" />
    </GlassCard>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  )
}
