import { Archive, File, Inbox, MessageSquare, ShoppingCart, Trash, Send, Clock, Tags } from "lucide-react"
import { NavGroup } from "@/components/sidebar/nav-group"
import { NavItem } from "@/components/sidebar/nav-item"
import { UserSwitcher } from "@/components/sidebar/user-switcher"

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

export function MailSidebar() {
  return (
    <div className="flex w-[280px] flex-col gap-6 border-r border-border bg-card p-4">
      <UserSwitcher />
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
    </div>
  )
}

