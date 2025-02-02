import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RefreshCw } from 'lucide-react'
import ComposeButton from "./compose-button"

interface MailToolbarProps {
  view: "all" | "unread"
  onViewChange: (view: "all" | "unread") => void
  isRefreshing: boolean
  handleRefresh: () => void
}

export function MailToolbar({ view, onViewChange, isRefreshing, handleRefresh }: MailToolbarProps) {

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
        <ComposeButton />
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh Mailbox
        </Button>
      </div>
    </div>
  )
}

