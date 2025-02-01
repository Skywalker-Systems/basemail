import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Email } from "@/types/email"

interface MailListProps {
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  view: "all" | "unread"
}

export function MailList({ emails, selectedEmail, onSelectEmail, view }: MailListProps) {
  const filteredEmails = view === "unread" ? emails.filter((email) => !email.read) : emails

  return (
    <ScrollArea className="w-[400px] flex-shrink-0 border-r border-border bg-white/50">
      <div className="flex flex-col">
        {filteredEmails.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={`flex flex-col gap-2 border-b border-border/50 p-4 text-left transition-colors hover:bg-blue-100/50 ${
              selectedEmail?.id === email.id ? "bg-blue-200/50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-foreground">{email.from}</span>
              <span className="text-xs text-muted-foreground">{email.timestamp}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">{email.subject}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{email.preview}</span>
            </div>
            {email.tags && email.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {email.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-lg bg-blue-100/50 text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

