"use server"

import { Email, putReply } from "@/utils/schema";

export async function sendReply(email: string, replyContent: string): Promise<Partial<Email>> {
    const emailToSend = await putReply(email, replyContent);
    return emailToSend;
}