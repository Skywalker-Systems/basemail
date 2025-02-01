import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Email } from "@/types/email"

interface MailViewProps {
  email: Email | null
  onSendReply: (content: string) => void
}

export function MailView({ email, onSendReply }: MailViewProps) {
  const [replyContent, setReplyContent] = useState("")

  if (!email) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/50 text-muted-foreground">
        Select an email to read
      </div>
    )
  }

  const handleSendReply = () => {
    onSendReply(replyContent)
    setReplyContent("")
  }

  return (
    <ScrollArea className="flex-1 bg-white/50 px-6">
      <div className="mx-auto max-w-3xl py-6">
        <div className="flex items-start gap-4">
          <Avatar className="bg-blue-200">
            <AvatarFallback className="text-blue-900">
              {email.from
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{email.subject}</h2>
            <div className="mt-2">
              <div className="text-sm font-medium">{email.from}</div>
              {email.replyTo && <div className="text-xs text-muted-foreground">Reply-To: {email.replyTo}</div>}
              <div className="text-xs text-muted-foreground">{email.timestamp}</div>
              {email.tags && email.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {email.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-lg bg-blue-100/50 text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 whitespace-pre-wrap text-sm">{email.content || email.preview}</div>
            <div className="mt-8">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleSendReply} className="mt-4">
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

