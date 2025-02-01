import { Archive, Clock, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface MailToolbarProps {
  view: "all" | "unread"
  onViewChange: (view: "all" | "unread") => void
}

export function MailToolbar({ view, onViewChange }: MailToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">Inbox</h1>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => onViewChange(v as "all" | "unread")}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem
            value="all"
            aria-label="All mail"
            className="rounded-md px-3 text-sm data-[state=on]:bg-background"
          >
            All mail
          </ToggleGroupItem>
          <ToggleGroupItem
            value="unread"
            aria-label="Unread"
            className="rounded-md px-3 text-sm data-[state=on]:bg-background"
          >
            Unread
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-2">
        {[Archive, Clock, Trash].map((Icon, i) => (
          <Button key={i} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  )
}

