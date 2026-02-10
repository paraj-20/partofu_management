import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, content } = await request.json()

    if (!taskId || !content) {
      return NextResponse.json({ error: "Task ID and content required" }, { status: 400 })
    }

    await sql`
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES (${taskId}, ${session.userId}, ${content})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
