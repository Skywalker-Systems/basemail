import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

interface User {
  name: string
  email: string
  initials: string
}

const users: User[] = [
  { name: "Alicia Koch", email: "alicia@example.com", initials: "AK" },
  { name: "John Doe", email: "john@example.com", initials: "JD" },
]

export function UserSwitcher() {
  return (
    <Select defaultValue={users[0].name.toLowerCase()}>
      <SelectTrigger className="w-full justify-between gap-2 bg-muted">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 bg-primary">
            <AvatarFallback className="text-foreground">{users[0].initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{users[0].name}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.email} value={user.name.toLowerCase()}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

