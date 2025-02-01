"use server"

import { Email, putEmail, putReply } from "@/utils/schema";

export async function sendReply(email: string, replyContent: string): Promise<Partial<Email>> {
    const emailToSend = await putReply(email, replyContent);
    return emailToSend;
}

export async function sendEmail(email: Partial<Email>): Promise<Partial<Email>> {
    const emailToSend = await putEmail(email);
    return emailToSend;
}