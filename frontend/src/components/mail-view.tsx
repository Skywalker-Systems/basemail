import { AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Email } from "@/utils/schema"
import { Avatar } from '@coinbase/onchainkit/identity'
import { useEffect, useState } from "react"
import { sendReply } from "./actions"

interface MailViewProps {
  email: Email | null
}

export function MailView({ email }: MailViewProps) {
  const [replyContent, setReplyContent] = useState("")
  const [localEmail, setLocalEmail] = useState<Email | null>(null)

  useEffect(() => {
    setLocalEmail(email)
  }, [email])

  if (!localEmail) {
    return (
      <div className="flex flex-1 items-center justify-center bg-card text-muted-foreground">
        Select an email to read
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 bg-card px-6">
      <div className="mx-auto max-w-3xl py-6">
        <div className="flex items-start gap-4">
          {localEmail.wallet && <Avatar className="bg-primary" address={localEmail.wallet}>
            <AvatarFallback className="text-primary-foreground">
              {localEmail.from
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          }
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">{localEmail.subject}</h2>
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium text-foreground">{localEmail.from}</div>
              {localEmail.from && <div className="text-xs text-muted-foreground">Reply-To: {localEmail.from}</div>}
              <div className="text-xs text-muted-foreground">{localEmail.date}</div>
              {localEmail.tags && localEmail.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {localEmail.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-lg bg-secondary text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 space-y-6">
              <div className="whitespace-pre-wrap text-sm text-foreground">{localEmail.summarizedEmail}</div>

              {localEmail.replies?.map((reply, index) => (
                <div key={index} className="mt-4 border-l-2 border-primary pl-4">
                  <div className="text-xs text-muted-foreground">
                    {reply.from} - {new Date(reply.timestamp).toLocaleString()}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {reply.content}
                  </div>
                </div>
              ))}

              <div className="mt-8">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={async () => {
                    await sendReply(localEmail.sk, replyContent);
                    setLocalEmail(prev => prev ? {
                      ...prev,
                      replies: [...(prev.replies || []), {
                        content: replyContent,
                        timestamp: new Date().toISOString(),
                        from: "You"
                      }]
                    } : null);
                    setReplyContent("");
                  }}
                  className="mt-4"
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

