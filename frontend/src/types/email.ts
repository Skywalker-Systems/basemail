export type Email = {
  id: string
  from: string
  to: string
  subject: string
  preview: string
  timestamp: string
  read: boolean
  tags: string[]
  content?: string
  replyTo?: string
  audioSummaryUrl?: string // Add this line
}

