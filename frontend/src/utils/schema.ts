import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

export const API_URL = process.env.API_URL;

export const attachmentSchema = z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    s3Key: z.string()
});

export const inboxSchema = z.object({
    companyId: z.string().optional(),
    email: z.string(),
    blockedAddresses: z.array(z.string()),
    id: z.string(),
    name: z.string(),
    createdBy: z.string()
});

export const mailSchema = z.object({
    optimizedContentKey: z.string().optional(),
    from: z.string(),
    sk: z.string(),
    wallet: z.string().optional(),
    pk: z.string(),
    inboxId: z.string(),
    rawAddress: z.string(),
    html: z.string().optional(),
    to: z.string(),
    tags: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
    firstMessageFromAgent: z.string().optional(),
    agentSystemPrompt: z.string().optional(),
    summarizedEmail: z.string().optional(),
    read: z.boolean(),
    attachments: z.array(attachmentSchema),
    subject: z.string(),
    date: z.string(),
    body: z.string(),
    replies: z.array(z.object({
        body: z.string(),
        date: z.string(),
        from: z.string(),
    })).optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
export type Inbox = z.infer<typeof inboxSchema>;
export type Email = z.infer<typeof mailSchema>;

export async function getMail() {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        console.log(`Fetching emails, ${API_URL}/mail`);
        const res = await fetch(`${API_URL}/mail`, {
            next: { revalidate: 60, tags: ["mail"] },
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch emails data ${res.status} - ${res.ok}`);
        }

        const response = await res.json();
        if (!response) return [];
        return z.array(mailSchema).parse(response);
    } catch (error) {
        console.log(`Failed to fetch emails data ${error}`);
        return [];
    }
}

export async function putEmail(email: Partial<Email>) {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        console.log(`Sending email, ${API_URL}/mail`);
        const res = await fetch(`${API_URL}/mail`, {
            method: "POST",
            body: JSON.stringify(email),
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(JSON.stringify(res));
        if (!res.ok) {
            throw new Error(`Failed to send email ${res.status} - ${res.ok}`);
        }
        revalidateTag("mail");

        return res.json();
    } catch (error) {
        console.log(`Failed to send email ${error}`);
    }
}

export async function putReply(email: string, replyContent: string) {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        const url = `${API_URL}/mail`

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                emailId: email,
                reply: replyContent
            })
        });
        if (!res.ok) {
            throw new Error(`Failed to send reply ${res.status} - ${res.ok}`);
        }
        revalidateTag("mail");
        return res.json();
    } catch (error) {
        console.log(`Failed to send reply ${error}`);
    }

}

export async function deleteEmail(mailId: string) {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        const res = await fetch(`${API_URL}/mail?mailId=${mailId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to delete email ${res.status} - ${res.ok}`);
        }

        return res.json();
    } catch (error) {
        console.log(`Failed to delete email ${error}`);
    }
}