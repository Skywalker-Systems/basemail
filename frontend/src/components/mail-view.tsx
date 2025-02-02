import { AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useWebSocket } from "@/hooks/use-websocket"
import { Email } from "@/utils/schema"
import { useUser } from "@clerk/nextjs"
import { Avatar, useName } from '@coinbase/onchainkit/identity'
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { base } from "wagmi/chains"
import { sendReply } from "./actions"

const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

interface MailViewProps {
  email: Email | null
  isRefreshing: boolean
  handleRefresh: () => void
}

export function MailView({ email, isRefreshing, handleRefresh }: MailViewProps) {
  const [replyContent, setReplyContent] = useState("")
  const { address } = useAccount()
  const [localEmail, setLocalEmail] = useState<Email | null>(null)
  const [base64Name, setBase64Name] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'summary' | 'full' | 'html'>('summary')
  const { isSignedIn, user } = useUser()
  const { data: name, isLoading: isLoadingName } = useName({
    address: address as `0x${string}`,
    chain: base,
  });

  useEffect(() => {
    if (name) {
      const base64Name = Buffer.from(name.replace('.base.eth', '')).toString('base64')
      setBase64Name(base64Name)
    }
  }, [name])

  const websocketUrl = isSignedIn && user && base64Name ? `${wsUrl}?userId=${base64Name}` : ''
  const { status: wsStatus } = useWebSocket({
    url: websocketUrl,
    enabled: isSignedIn && !!websocketUrl && !!base64Name,
    onMessage: async (data: any) => {
      console.log('onMessage', data)
      handleRefresh()
    },
    onConnect: () => console.log(`Connected to host`),
    onDisconnect: () => console.log(`Disconnected from host`)
  });

  useEffect(() => {
    setLocalEmail(email)
  }, [email]);

  const getEmailContent = () => {
    switch (viewMode) {
      case 'summary':
        return localEmail?.summarizedEmail || localEmail?.body
      case 'html':
        return localEmail?.html ? (
          <div dangerouslySetInnerHTML={{ __html: localEmail.html }} />
        ) : localEmail?.body
      case 'full':
        return localEmail?.body
    }
  }

  if (!localEmail) {
    return (
      <div className="flex flex-1 items-center justify-center bg-card text-muted-foreground">
        Select an email to read
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-screen">
      <ScrollArea className="flex-1 bg-card px-6 pb-24">
        <div className="mx-auto max-w-3xl py-6">
          <div className="flex items-start gap-4">
            {localEmail.wallet && (
              <Avatar className="bg-primary" address={localEmail.wallet}>
                <AvatarFallback className="text-primary-foreground">
                  {localEmail.from
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  {localEmail.subject}
                </h2>
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-foreground">
                  {localEmail.from.replace('@basemail.me', '.base.eth')}
                </div>
                {localEmail.from && (
                  <div className="text-xs text-muted-foreground">
                    Reply-To: {localEmail.from.replace('@basemail.me', '.base.eth')}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {localEmail.date}
                </div>
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
              <div className="relative flex-1 overflow-auto pb-20 mt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`text-sm text-foreground ${viewMode === 'full' ? 'whitespace-pre-wrap' : ''}`}
                  >
                    {getEmailContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {localEmail.replies?.map((reply, index) => (
                <div key={index} className="mt-4 border-l-2 border-primary pl-4">
                  <div className="text-xs text-muted-foreground">
                    {reply.from} - {new Date(reply.date).toLocaleString()}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {reply.body}
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
                        body: replyContent,
                        date: new Date().toISOString(),
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
      </ScrollArea>

      {/* Fixed footer with refresh and view mode buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card z-10 p-2 shadow-inner">
        <div className="flex justify-between items-center">
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.05 11a9 9 0 0114.142-5.657M9.172 4.93A9 9 0 0111 12v1m6 6a9 9 0 01-14.14 0M12 11V4" />
            </svg>
          </Button>

          {/* Existing View Mode Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'summary' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('summary')}
              className="flex items-center gap-2"
            >
              Summary
            </Button>
            <Button
              variant={viewMode === 'full' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('full')}
              className="flex items-center gap-2"
            >
              Full Text
            </Button>
            <Button
              variant={viewMode === 'html' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('html')}
              className="flex items-center gap-2"
            >
              HTML
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

