import { cn } from "@/lib/utils"

type StatusType = "pending" | "active" | "resolved" | "rejected" | "warning" | "success"

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: "sm" | "md"
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  pending: {
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
    defaultLabel: "Pending",
  },
  active: {
    bg: "bg-cyan/10",
    text: "text-cyan",
    dot: "bg-cyan",
    defaultLabel: "Active",
  },
  resolved: {
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
    defaultLabel: "Resolved",
  },
  rejected: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
    defaultLabel: "Rejected",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
    defaultLabel: "Warning",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
    defaultLabel: "Success",
  },
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {label || config.defaultLabel}
    </span>
  )
}

export default StatusBadge
