import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { packageIds } = await request.json()

        if (!Array.isArray(packageIds)) {
            return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
        }

        for (let i = 0; i < packageIds.length; i++) {
            await sql`
          UPDATE packages SET sort_order = ${i} WHERE id = ${packageIds[i]}
        `
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Packages Reorder error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
