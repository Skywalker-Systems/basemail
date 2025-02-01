import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import type { Email } from "@/types/email"

interface MailListProps {
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  onPlayAudio: (audioUrl: string) => void
  view: "all" | "unread"
}

export function MailList({ emails, selectedEmail, onSelectEmail, onPlayAudio, view }: MailListProps) {
  const filteredEmails = view === "unread" ? emails.filter((email) => !email.read) : emails

  return (
    <ScrollArea className="w-[400px] flex-shrink-0 border-r border-border bg-card">
      <div className="flex flex-col">
        {filteredEmails.map((email) => (
          <div
            key={email.id}
            className={`flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent ${
              selectedEmail?.id === email.id ? "bg-primary" : ""
            }`}
          >
            <button onClick={() => onSelectEmail(email)} className="flex-1 text-left">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-foreground">{email.from}</span>
                <span className="text-xs text-muted-foreground">{email.timestamp}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">{email.subject}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{email.preview}</span>
              </div>
              {email.tags && email.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {email.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-lg bg-secondary text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
            {email.audioSummaryUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 flex-shrink-0"
                onClick={() => onPlayAudio(email.audioSummaryUrl!)}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

