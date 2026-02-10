import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, secondaryPassword } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const users = await sql`SELECT * FROM users WHERE email = ${email}`

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Admin requires secondary password check
    if (user.role === "admin" && user.secondary_password_hash) {
      if (!secondaryPassword) {
        return NextResponse.json({ error: "Secondary password is required for admin" }, { status: 400 })
      }
      const isSecondaryValid = await verifyPassword(secondaryPassword, user.secondary_password_hash)
      if (!isSecondaryValid) {
        return NextResponse.json({ error: "Invalid secondary password" }, { status: 401 })
      }
    }

    if (user.status !== "active") {
      if (user.status === "pending") {
        return NextResponse.json({ error: "Your account is pending admin approval" }, { status: 403 })
      }
      if (user.status === "rejected") {
        return NextResponse.json({ error: "Your account has been rejected" }, { status: 403 })
      }
      return NextResponse.json({ error: "Your account is inactive" }, { status: 403 })
    }

    await createSession(user.id)

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, details)
      VALUES (${user.id}, 'login', 'user', 'User logged in')
    `

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
