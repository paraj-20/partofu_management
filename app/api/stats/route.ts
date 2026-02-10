import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [totalUsers] = await sql`SELECT COUNT(*) as count FROM users WHERE status = 'active'`
    const [pendingUsers] = await sql`SELECT COUNT(*) as count FROM users WHERE status = 'pending'`
    const [totalTasks] = await sql`SELECT COUNT(*) as count FROM tasks`
    const [completedTasks] = await sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`
    const [inProgressTasks] = await sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'`
    const [todoTasks] = await sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'`
    const [totalPackages] = await sql`SELECT COUNT(*) as count FROM packages WHERE is_active = true`

    return NextResponse.json({
      stats: {
        totalUsers: Number(totalUsers.count),
        pendingUsers: Number(pendingUsers.count),
        totalTasks: Number(totalTasks.count),
        completedTasks: Number(completedTasks.count),
        inProgressTasks: Number(inProgressTasks.count),
        todoTasks: Number(todoTasks.count),
        totalPackages: Number(totalPackages.count),
      },
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
