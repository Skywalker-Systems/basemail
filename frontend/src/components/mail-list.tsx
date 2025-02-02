import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Email } from "@/utils/schema"
// import type { Email } from "@/types/email"
import { AudioControls } from "./audio-controls"

const formatEmailTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface MailListProps {
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  onPlayAudio: (audioUrl: string) => void
  view: "all" | "unread"
}

export function MailList({ emails, selectedEmail, onSelectEmail, onPlayAudio, view }: MailListProps) {
  const filteredEmails = view === "unread" ? emails.filter((email) => !email.read) : emails
  const sortedEmailsByCreatedAt = filteredEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <ScrollArea className="w-[400px] flex-shrink-0 border-r border-border bg-card">
      <div className="flex flex-col">
        {sortedEmailsByCreatedAt.map((email) => (
          <div
            key={email.sk}
            className={`flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent ${selectedEmail?.sk === email.sk ? "bg-primary/10" : ""
              }`}
          >
            <button onClick={() => onSelectEmail(email)} className="flex-1 text-left">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-foreground">{email.from.replace('@basemail.me', '.base.eth')}</span>
                <span className="text-xs text-muted-foreground">{formatEmailTime(email.date)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">{email.subject}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{email.summarizedEmail}</span>
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
            {(
              <AudioControls email={email} />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

