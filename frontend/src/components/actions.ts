"use server"

import { Email, sendEmail } from "@/utils/schema"

export async function sendReply(email: Email, replyContent: string) {
    await sendEmail({
        to: email.to,
        from: email.from,
        subject: `Re: ${email.subject}`,
        body: replyContent,
        date: new Date().toISOString(),
        read: true,
        tags: [],
    })
}