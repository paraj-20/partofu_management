
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
    try {
        const result = await sql`
      SELECT value FROM system_settings WHERE key = 'currency'
    `
        const currency = result.length > 0 ? result[0].value : "INR"
        return NextResponse.json({ currency })
    } catch (error) {
        console.error("System Settings GET error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { currency } = await request.json()
        if (!currency || !["INR", "USD", "EUR"].includes(currency)) {
            return NextResponse.json({ error: "Invalid currency" }, { status: 400 })
        }

        await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('currency', ${currency}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `

        return NextResponse.json({ success: true, currency })
    } catch (error) {
        console.error("System Settings POST error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
