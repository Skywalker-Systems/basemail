import { Archive, File, Inbox, MessageSquare, ShoppingCart, Trash, Send, Clock, Tags, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavGroup } from "./nav-group"
import { NavItem } from "./nav-item"

import { AudioControls } from "../audio-controls"

const mainNavigation = [
  { icon: Inbox, label: "Inbox", count: 128 },
  { icon: File, label: "Drafts", count: 9 },
  { icon: Send, label: "Sent", count: null },
  { icon: Trash, label: "Junk", count: 23 },
  { icon: Trash, label: "Trash", count: null },
  { icon: Archive, label: "Archive", count: null },
]

const categories = [
  { icon: MessageSquare, label: "Social", count: 972 },
  { icon: Clock, label: "Updates", count: 342 },
  { icon: MessageSquare, label: "Forums", count: 128 },
  { icon: ShoppingCart, label: "Shopping", count: 8 },
  { icon: Tags, label: "Promotions", count: 21 },
]

interface MailSidebarProps {
  onSummarizeAll: () => void
  isAudioPlaying: boolean
  onPlayAudio: () => void
  onPauseAudio: () => void
  onStopAudio: () => void
  isSummarizing: boolean
}

export function MailSidebar({
  onSummarizeAll,
  isAudioPlaying,
  onPlayAudio,
  onPauseAudio,
  onStopAudio,
  isSummarizing,
}: MailSidebarProps) {
  return (
    <div className="flex w-[280px] flex-col gap-6 bg-card p-4">
      
      <nav className="flex flex-1 flex-col gap-4">
        <NavGroup>
          {mainNavigation.map((item) => (
            <NavItem key={item.label} {...item} isActive={item.label === "Inbox"} />
          ))}
        </NavGroup>
        <NavGroup title="Categories">
          {categories.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </NavGroup>
      </nav>
      <div className="mt-auto">
        {isAudioPlaying ? (
          <AudioControls isPlaying={isAudioPlaying} onPlay={onPlayAudio} onPause={onPauseAudio} onStop={onStopAudio} />
        ) : (
          <Button variant="outline" className="w-full justify-start" onClick={onSummarizeAll} disabled={isSummarizing}>
            <Headphones className="mr-2 h-4 w-4" />
            {isSummarizing ? "Summarizing..." : "Summarize All Mail"}
          </Button>
        )}
      </div>
    </div>
  )
}

