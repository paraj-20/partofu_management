import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, hashPassword, verifyPassword } from "@/lib/auth"

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, currentPassword, newPassword } = await request.json()

    // Update name/email
    if (name !== undefined || email !== undefined) {
      if (email) {
        const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${session.userId}`
        if (existing.length > 0) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 })
        }
      }

      await sql`
        UPDATE users SET
          name = COALESCE(${name || null}, name),
          email = COALESCE(${email || null}, email),
          updated_at = NOW()
        WHERE id = ${session.userId}
      `
    }

    // Change password
    if (currentPassword && newPassword) {
      const user = await sql`SELECT password_hash FROM users WHERE id = ${session.userId}`
      const isValid = await verifyPassword(currentPassword, user[0].password_hash)

      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }

      const newHash = await hashPassword(newPassword)
      await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${session.userId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
