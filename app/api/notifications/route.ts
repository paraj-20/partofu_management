import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const notifications = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${Number(session.userId)}
      ORDER BY created_at DESC
    `

        return NextResponse.json({ notifications })
    } catch (error) {
        console.error("Notifications GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { notificationId, markAllAsRead } = await request.json()

        if (markAllAsRead) {
            await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE user_id = ${Number(session.userId)}
      `
        } else if (notificationId) {
            await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = ${Number(notificationId)} AND user_id = ${Number(session.userId)}
      `
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Notifications PATCH error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { notificationId, deleteAll } = await request.json()

        if (deleteAll) {
            await sql`
        DELETE FROM notifications 
        WHERE user_id = ${Number(session.userId)}
      `
        } else if (notificationId) {
            await sql`
        DELETE FROM notifications 
        WHERE id = ${Number(notificationId)} AND user_id = ${Number(session.userId)}
      `
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Notifications DELETE error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
