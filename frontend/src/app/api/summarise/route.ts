import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // This is a mock implementation. In a real app, you'd use an AI service to summarize the email.
  const summary = `Summary of email: ${body.subject}\n\nThis is a brief summary of the email content...`

  return NextResponse.json({ summary })
}

