import { Archive, File, Inbox, MessageSquare, ShoppingCart, Trash, Send, Clock, Tags } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const navigation = [
  { icon: Inbox, label: "Inbox", count: 128 },
  { icon: File, label: "Drafts", count: 9 },
  { icon: Send, label: "Sent", count: null },
  { icon: Trash, label: "Junk", count: 23 },
  { icon: Trash, label: "Trash", count: null },
  { icon: Archive, label: "Archive", count: null },
  { icon: MessageSquare, label: "Social", count: 972 },
  { icon: Clock, label: "Updates", count: 342 },
  { icon: MessageSquare, label: "Forums", count: 128 },
  { icon: ShoppingCart, label: "Shopping", count: 8 },
  { icon: Tags, label: "Promotions", count: 21 },
]

export function MailSidebar() {
  return (
    <div className="flex w-[280px] flex-col border-r border-border bg-background/50 p-4">
      <Select defaultValue="alicia">
        <SelectTrigger className="w-full bg-white">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 bg-primary">
              <AvatarFallback className="bg-primary text-foreground">AK</AvatarFallback>
            </Avatar>
            <SelectValue placeholder="Select account" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alicia">Alicia Koch</SelectItem>
          <SelectItem value="john">John Doe</SelectItem>
        </SelectContent>
      </Select>
      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {navigation.map((item) => (
          <Button
            key={item.label}
            variant={item.label === "Inbox" ? "secondary" : "ghost"}
            className="justify-start rounded-xl hover:bg-primary/10"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
            {item.count && <span className="ml-auto text-muted-foreground">{item.count}</span>}
          </Button>
        ))}
      </nav>
    </div>
  )
}

