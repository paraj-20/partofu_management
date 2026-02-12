import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, hashPassword, verifyPassword } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, currentPassword, newPassword } = await request.json()

    // Update name/email
    if (name || email) {
      if (email) {
        const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${Number(session.userId)}`
        if (existing.length > 0) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 })
        }
      }

      await sql`
        UPDATE users SET
          name = COALESCE(${name ? name.trim() : null}, name),
          email = COALESCE(${email ? email.trim() : null}, email),
          updated_at = NOW()
        WHERE id = ${Number(session.userId)}
      `

      // Log activity
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${Number(session.userId)}, 'update_profile', 'user', ${Number(session.userId)}, 'Updated profile information')
      `

      await createNotification({
        userId: Number(session.userId),
        type: 'settings_changed',
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated.',
        link: '/dashboard/settings'
      })
    }

    // Change password
    if (currentPassword && newPassword) {
      const userResult = await sql`SELECT password_hash FROM users WHERE id = ${Number(session.userId)}`
      if (userResult.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isValid = await verifyPassword(currentPassword, userResult[0].password_hash)

      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      const newHash = await hashPassword(newPassword)
      await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${Number(session.userId)}`

      // Log activity
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${Number(session.userId)}, 'change_password', 'user', ${Number(session.userId)}, 'Changed account password')
      `

      await createNotification({
        userId: Number(session.userId),
        type: 'settings_changed',
        title: 'Password Changed',
        message: 'Your account password has been successfully updated.',
        link: '/dashboard/settings'
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
