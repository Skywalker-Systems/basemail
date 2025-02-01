import { z } from "zod";

export const API_URL = process.env.API_URL;


export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    handle: z.string(),
    latestContext: z.string(),
    providedUserId: z.string(),
    onchainProfile: z.string().optional().nullable(),
    imageUrl: z.string(),
    inboxId: z.string().optional(),
    status: z.string(),
    createdAt: z.string(),
    typename: z.string()
});

export const mailSchema = z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.string(),
    duration: z.string(),
    thumbnailUrl: z.string(),
    episodeNumber: z.number(),
    hosts: z.array(z.string()),
    topics: z.array(z.string()),
    audioUrl: z.string(),
    typename: z.string()
});

export type User = z.infer<typeof userSchema>;

export async function getEmails() {
    try {
        const res = await fetch(`${API_URL}/mail`, {
            next: { revalidate: 3600 },
            method: "GET"
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