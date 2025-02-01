"use client"

import { Email } from "@/utils/schema"
import { useState } from "react"
import { FloatingAudioPlayer } from "./floating-audio-player"
import { MailList } from "./mail-list"
import { MailSidebar } from "./mail-siderbar"
import { MailToolbar } from "./mail-toolbar"
import { MailView } from "./mail-view"

export function EmailInterface({ emails }: { emails: Email[] }) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [view, setView] = useState<"all" | "unread">("all")
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      <MailSidebar />
      <div className="flex flex-1 flex-col">
        {/* <AISummaryBanner /> */}
        <MailToolbar view={view} onViewChange={setView} />
        <div className="flex flex-1 overflow-hidden">
          <MailList
            emails={emails}
            selectedEmail={selectedEmail}
            onSelectEmail={setSelectedEmail}
            onPlayAudio={setCurrentAudioUrl}
            view={view}
          />
          <MailView
            email={selectedEmail}
          // onSendReply={(replyContent) =>
          //   sendEmail({
          //     to: selectedEmail?.from,
          //     from: "user@example.com",
          //     subject: `Re: ${selectedEmail?.subject}`,
          //     content: replyContent,
          //     preview: replyContent.substring(0, 100),
          //     timestamp: new Date().toISOString(),
          //     read: true,
          //     tags: ["sent"],
          //   })
          //   }
          // onSummarize={() => selectedEmail && summarizeEmail(selectedEmail)}
          />
        </div>
      </div>
      <FloatingAudioPlayer audioUrl={currentAudioUrl} onClose={() => setCurrentAudioUrl(null)} />
    </div>
  )
}

