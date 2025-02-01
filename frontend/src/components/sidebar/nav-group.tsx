import type { ReactNode } from "react"

interface NavGroupProps {
  title?: string
  children: ReactNode
}

export function NavGroup({ title, children }: NavGroupProps) {
  return (
    <div className="space-y-1">
      {title && <h3 className="px-2 text-xs font-medium text-muted-foreground">{title}</h3>}
      {children}
    </div>
  )
}

