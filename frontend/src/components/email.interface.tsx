"use client"

import { Email } from "@/utils/schema"
import { useState } from "react"
import { revalidateMail } from "./actions"
import { MailList } from "./mail-list"
import { MailSidebar } from "./mail-siderbar"
import { MailToolbar } from "./mail-toolbar"
import { MailView } from "./mail-view"

export function EmailInterface({ emails }: { emails: Email[] }) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [view, setView] = useState<"all" | "unread">("all")
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setTimeout(async () => {
      await revalidateMail()
      setIsRefreshing(false)
    }, 3000);
  }

  return (
    <div className="flex h-screen relative">
      <MailSidebar />
      <div className="flex flex-1 flex-col">
        {/* <AISummaryBanner /> */}
        <MailToolbar view={view} onViewChange={setView} isRefreshing={isRefreshing} handleRefresh={handleRefresh} />
        <div className="flex flex-1 overflow-hidden">
          <MailList
            emails={emails}
            selectedEmail={selectedEmail}
            onSelectEmail={setSelectedEmail}
            onPlayAudio={setCurrentAudioUrl}
            view={view}
          />
          <MailView
            isRefreshing={isRefreshing}
            handleRefresh={handleRefresh}
            email={selectedEmail}
          />
        </div>
      </div>

    </div>
  )
}

