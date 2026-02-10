import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const packages = await sql`
      SELECT p.*,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', pt.id, 'name', pt.name, 'price', pt.price,
              'features', pt.features, 'scope', pt.scope,
              'ideal_for', pt.ideal_for, 'add_ons', pt.add_ons,
              'included', pt.included, 'not_included', pt.not_included,
              'sort_order', pt.sort_order
            ) ORDER BY pt.sort_order
          ) FILTER (WHERE pt.id IS NOT NULL), '[]'
        ) as tiers
      FROM packages p
      LEFT JOIN package_tiers pt ON p.id = pt.package_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({ packages })
  } catch (error) {
    console.error("Packages GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, category, description, tiers } = await request.json()

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO packages (name, category, description)
      VALUES (${name}, ${category}, ${description || ""})
      RETURNING id
    `
    if (!result || result.length === 0) {
      throw new Error("Failed to insert package - no id returned")
    }
    const packageId = result[0].id

    if (tiers && tiers.length > 0) {
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i]
        const price = tier.price === "" || tier.price === undefined ? null : parseFloat(tier.price)
        await sql`
          INSERT INTO package_tiers (package_id, name, price, features, scope, ideal_for, add_ons, included, not_included, sort_order)
          VALUES (${packageId}, ${tier.name}, ${price}, ${JSON.stringify(tier.features || [])}, ${tier.scope || ""}, ${tier.idealFor || ""}, ${JSON.stringify(tier.addOns || [])}, ${JSON.stringify(tier.included || [])}, ${JSON.stringify(tier.notIncluded || [])}, ${i})
        `
      }
    }

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${Number(session.userId)}, 'create_package', 'package', ${Number(packageId)}, ${`Created package: ${name}`})
    `

    return NextResponse.json({ packageId })
  } catch (error) {
    console.error("Packages POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { packageId, name, category, description, isActive, tiers } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 })
    }

    await sql`
      UPDATE packages SET
        name = COALESCE(${name || null}, name),
        category = COALESCE(${category || null}, category),
        description = COALESCE(${description !== undefined ? description : null}, description),
        is_active = COALESCE(${isActive !== undefined ? isActive : null}, is_active),
        updated_at = NOW()
      WHERE id = ${packageId}
    `

    if (tiers !== undefined) {
      await sql`DELETE FROM package_tiers WHERE package_id = ${packageId}`
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i]
        const price = tier.price === "" || tier.price === undefined ? null : parseFloat(tier.price)
        await sql`
          INSERT INTO package_tiers (package_id, name, price, features, scope, ideal_for, add_ons, included, not_included, sort_order)
          VALUES (${packageId}, ${tier.name}, ${price}, ${JSON.stringify(tier.features || [])}, ${tier.scope || ""}, ${tier.idealFor || ""}, ${JSON.stringify(tier.addOns || [])}, ${JSON.stringify(tier.included || [])}, ${JSON.stringify(tier.notIncluded || [])}, ${i})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Packages PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { packageId } = await request.json()
    await sql`DELETE FROM packages WHERE id = ${packageId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Packages DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
