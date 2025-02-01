export type Email = {
    id: string
    from: string
    to: string // Add this line
    subject: string
    preview: string
    timestamp: string
    read: boolean
    tags: string[]
    content?: string
    replyTo?: string
  }
  
  