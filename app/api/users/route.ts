import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get("status")

    let users
    if (status) {
      users = await sql`
        SELECT id, email, name, role, status, avatar_url, last_active, is_online, created_at
        FROM users WHERE status = ${status}
        ORDER BY created_at DESC
      `
    } else {
      users = await sql`
        SELECT id, email, name, role, status, avatar_url, last_active, is_online, created_at
        FROM users
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, action, role } = await request.json()

    if (action === "approve") {
      await sql`UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ${userId}`
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${session.userId}, 'approve_user', 'user', ${userId}, 'Approved user')
      `
    } else if (action === "reject") {
      await sql`UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = ${userId}`
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${session.userId}, 'reject_user', 'user', ${userId}, 'Rejected user')
      `
    } else if (action === "deactivate") {
      await sql`UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ${userId}`
    } else if (action === "activate") {
      await sql`UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ${userId}`
    } else if (action === "change_role" && role) {
      await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Users patch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (userId === session.userId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Users delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
