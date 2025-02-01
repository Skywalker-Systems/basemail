import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItemProps {
  icon: LucideIcon
  label: string
  count?: number | null
  isActive?: boolean
  onClick?: () => void
}

export function NavItem({ icon: Icon, label, count, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive ? "bg-primary text-foreground" : "text-muted-foreground hover:bg-secondary",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== null && count !== undefined && <span className="text-xs">{count}</span>}
    </button>
  )
}

