import { NextResponse } from "next/server"
import type { Email } from "@/types/email"

export async function GET() {
  const emails: Email[] = [
    {
      id: "1",
      from: "alice@example.com",
      to: "user@example.com",
      subject: "Project Update",
      preview: "Hi team, I wanted to share the latest...",
      timestamp: new Date().toISOString(),
      read: false,
      tags: ["work", "project"],
    },
    {
      id: "2",
      from: "bob@example.com",
      to: "user@example.com",
      subject: "Meeting Notes",
      preview: "Here are the notes from our meeting...",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: true,
      tags: ["work", "meeting"],
    },
  ]

  return NextResponse.json(emails)
}

