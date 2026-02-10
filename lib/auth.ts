import { cookies } from "next/headers"
import { sql } from "./db"

const SALT = "partofu_salt_2024"

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SALT)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `sha256:${SALT}:${hashHex}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password)
  return newHash === hash
}

export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function createSession(userId: number) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `

  const cookieStore = await cookies()
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session_token")?.value

  if (!token) return null

  const sessions = await sql`
    SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.status, u.avatar_url
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
      AND u.status = 'active'
  `

  if (sessions.length === 0) return null

  // Update last_active
  await sql`UPDATE users SET last_active = NOW(), is_online = true WHERE id = ${sessions[0].user_id}`

  return {
    userId: sessions[0].user_id,
    email: sessions[0].email,
    name: sessions[0].name,
    role: sessions[0].role as "admin" | "member",
    status: sessions[0].status,
    avatarUrl: sessions[0].avatar_url,
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session_token")?.value

  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
    cookieStore.delete("session_token")
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}
