import { sql } from "./db";

export async function createNotification({
    userId,
    type,
    title,
    message,
    link
}: {
    userId: number;
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${link || null})
    `;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}
