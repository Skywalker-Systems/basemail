import { auth } from "@clerk/nextjs/server";
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
    pk: z.string(),
    inboxId: z.string(),
    to: z.string(),
    tags: z.array(z.string()),
    links: z.array(z.string()),
    firstMessageFromAgent: z.string(),
    agentSystemPrompt: z.string(),
    summarizedEmail: z.string(),
    read: z.boolean(),
    attachments: z.array(attachmentSchema),
    subject: z.string(),
    date: z.string(),
    body: z.string()
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
            next: { revalidate: 60 },
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(JSON.stringify(res));

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

export async function sendEmail(email: Partial<Email>) {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        const res = await fetch(`${API_URL}/mail`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.log(`Failed to send email ${error}`);
    }
}

export async function putEmail(email: Partial<Email>) {
    const { getToken } = await auth();
    const token = await getToken();

    try {
        const res = await fetch(`${API_URL}/mail?mailId=${email}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                body: JSON.stringify({
                    read: true
                })
            }
        });
    } catch (error) {
        console.log(`Failed to update email ${error}`);
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