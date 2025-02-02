"use client"

import { Email } from "@/utils/schema"
import { useState } from "react"
import { FloatingAudioPlayer } from "./floating-audio-player"
import { MailList } from "./mail-list"
import { MailSidebar } from "./mail-siderbar"
import { MailToolbar } from "./mail-toolbar"
import { MailView } from "./mail-view"
import { AudioControls } from "./audio-controls"

export function EmailInterface({ emails }: { emails: Email[] }) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [view, setView] = useState<"all" | "unread">("all")
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)

  return (
    <div className="flex h-screen relative">
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
          />
        </div>
      </div>
      <AudioControls />
    </div>
  )
}

