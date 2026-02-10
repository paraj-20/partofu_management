import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await sql`
      SELECT t.*, u.name as creator_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', ta.user_id, 'name', au.name)
          ) FILTER (WHERE ta.user_id IS NOT NULL), '[]'
        ) as assignees,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', tc.id, 'content', tc.content, 'user_name', cu.name, 'created_at', tc.created_at)
          ) FILTER (WHERE tc.id IS NOT NULL), '[]'
        ) as comments
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users au ON ta.user_id = au.id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      LEFT JOIN users cu ON tc.user_id = cu.id
      GROUP BY t.id, u.name
      ORDER BY t.created_at DESC
    `

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Tasks GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, priority, status, dueDate, assigneeIds } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO tasks (title, description, priority, status, due_date, created_by)
      VALUES (${title}, ${description || ""}, ${priority || "medium"}, ${status || "todo"}, ${dueDate ? new Date(dueDate) : null}, ${Number(session.userId)})
      RETURNING id
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to insert task - no id returned")
    }
    const taskId = result[0].id

    if (assigneeIds && assigneeIds.length > 0) {
      for (const userId of assigneeIds) {
        await sql`
          INSERT INTO task_assignments (task_id, user_id)
          VALUES (${Number(taskId)}, ${Number(userId)})
          ON CONFLICT DO NOTHING
        `
      }
    }

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${Number(session.userId)}, 'create_task', 'task', ${Number(taskId)}, ${`Created task: ${title}`})
    `

    return NextResponse.json({ taskId })
  } catch (error) {
    console.error("Tasks POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, title, description, priority, status, dueDate, assigneeIds } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    await sql`
      UPDATE tasks SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description !== undefined ? description : null}, description),
        priority = COALESCE(${priority || null}, priority),
        status = COALESCE(${status || null}, status),
        due_date = COALESCE(${dueDate || null}, due_date),
        updated_at = NOW()
      WHERE id = ${taskId}
    `

    if (assigneeIds !== undefined) {
      await sql`DELETE FROM task_assignments WHERE task_id = ${taskId}`
      for (const userId of assigneeIds) {
        await sql`
          INSERT INTO task_assignments (task_id, user_id)
          VALUES (${taskId}, ${userId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${session.userId}, 'update_task', 'task', ${taskId}, 'Updated task')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tasks PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await request.json()

    // Only admin or task creator can delete
    if (session.role !== "admin") {
      const task = await sql`SELECT created_by FROM tasks WHERE id = ${taskId}`
      if (task.length === 0 || task[0].created_by !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    await sql`DELETE FROM tasks WHERE id = ${taskId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tasks DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
