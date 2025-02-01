"use client"

import { useState, useEffect } from "react"
import { MailSidebar } from "./sidebar/mail-sidebar"
import { MailList } from "./mail-list"
import { MailView } from "./mail-view"
import { MailToolbar } from "./mail-toolbar"
import { AISummaryBanner } from "./ai-summary-banner"
import type { Email } from "@/types/email"

export function EmailInterface() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [view, setView] = useState<"all" | "unread">("all")

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
    } catch (error) {
      console.error("Failed to summarize email:", error)
    }
  }

  return (
    <div className="flex h-screen">
      <MailSidebar />
      <div className="flex flex-1 flex-col">
        <AISummaryBanner onSummarize={() => selectedEmail && summarizeEmail(selectedEmail)} />
        <MailToolbar view={view} onViewChange={setView} />
        <div className="flex flex-1 overflow-hidden">
          <MailList emails={emails} selectedEmail={selectedEmail} onSelectEmail={setSelectedEmail} view={view} />
          <MailView
            email={selectedEmail}
            onSendReply={(replyContent) =>
              sendEmail({
                to: selectedEmail?.from,
                from: "user@example.com", // Assuming the current user's email
                subject: `Re: ${selectedEmail?.subject}`,
                content: replyContent,
                preview: replyContent.substring(0, 100), // First 100 characters as preview
                timestamp: new Date().toISOString(),
                read: true,
                tags: ["sent"],
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

