"use client"

import { useState, useEffect } from "react"
import { MailSidebar } from "./sidebar/mail-sidebar"
import { MailList } from "./mail-list"
import { MailView } from "./mail-view"
import { MailToolbar } from "./mail-toolbar"
import { AISummaryBanner } from "./ai-summary-banner"
import { FloatingAudioPlayer } from "./floating-audio-player"
import type { Email } from "@/types/email"

export function EmailInterface() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [view, setView] = useState<"all" | "unread">("all")
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/fetch-emails")
      const data = await response.json()
      setEmails(data)
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    }
  }

  const sendEmail = async (email: Partial<Email>) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email),
      })
      const data = await response.json()
      console.log(data.message)
      fetchEmails()
    } catch (error) {
      console.error("Failed to send email:", error)
    }
  }

  const summarizeEmail = async (email: Email) => {
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email),
      })
      const data = await response.json()
      console.log("Email summary:", data.summary)
      // In a real application, you would update the email with the new audio summary URL
      // For now, we'll just simulate it
      setCurrentAudioUrl(`/api/audio-summary/${email.id}`)
    } catch (error) {
      console.error("Failed to summarize email:", error)
    }
  }

  const summarizeInbox = async () => {
    try {
      const response = await fetch("/api/summarize-inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      })
      const data = await response.json()
      console.log("Inbox summary:", data.summary)
      // In a real application, you would get the audio URL from the API
      // For now, we'll just simulate it
      setCurrentAudioUrl("/api/audio-summary/inbox")
    } catch (error) {
      console.error("Failed to summarize inbox:", error)
    }
  }

  return (
    <div className="flex h-screen">
      <MailSidebar onSummarizeAll={summarizeInbox} isAudioPlaying={false} onPlayAudio={() => {}} onPauseAudio={() => {}} onStopAudio={() => {}} isSummarizing={false} />
      <div className="flex flex-1 flex-col">
        <AISummaryBanner onSummarize={summarizeInbox} />
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
            onSendReply={(replyContent) =>
              sendEmail({
                to: selectedEmail?.from,
                from: "user@example.com",
                subject: `Re: ${selectedEmail?.subject}`,
                content: replyContent,
                preview: replyContent.substring(0, 100),
                timestamp: new Date().toISOString(),
                read: true,
                tags: ["sent"],
              })
            }
            onSummarize={() => selectedEmail && summarizeEmail(selectedEmail)}
          />
        </div>
      </div>
      <FloatingAudioPlayer audioUrl={currentAudioUrl} onClose={() => setCurrentAudioUrl(null)} />
    </div>
  )
}

