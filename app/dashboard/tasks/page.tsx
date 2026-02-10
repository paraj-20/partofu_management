"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskDialog } from "@/components/task-dialog"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Calendar,
  MessageSquare,
  Trash2,
  Edit3,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
} from "lucide-react"
import { TaskBoard } from "@/components/task-board"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type TaskItem = {
  id: number
  title: string
  description: string
  priority: string
  status: string
  due_date: string | null
  created_by: number
  creator_name: string
  assignees: { id: number; name: string }[]
  comments: { id: number; content: string; user_name: string; created_at: string }[]
  created_at: string
}

function priorityIcon(priority: string) {
  switch (priority) {
    case "high":
      return <ArrowUpCircle className="h-4 w-4 text-destructive" />
    case "medium":
      return <ArrowRightCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
    case "low":
      return <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" />
    default:
      return null
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "todo":
      return <Badge variant="secondary" className="text-secondary-foreground">To Do</Badge>
    case "in_progress":
      return <Badge className="bg-primary/20 text-primary border-0">In Progress</Badge>
    case "completed":
      return <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">Done</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function TasksPage() {
  const { user } = useAuth()
  const { data: tasksData, mutate } = useSWR("/api/tasks", fetcher)
  const { data: usersData } = useSWR("/api/users?status=active", fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskItem | null>(null)
  const [search, setSearch] = useState("")
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [expandedTask, setExpandedTask] = useState<number | null>(null)

  const tasks: TaskItem[] = tasksData?.tasks || []
  const teamUsers = usersData?.users?.map((u: { id: number; name: string }) => ({
    id: u.id,
    name: u.name,
  })) || []

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  const todoTasks = filteredTasks.filter((t) => t.status === "todo")
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress")
  const completedTasks = filteredTasks.filter((t) => t.status === "completed")

  async function handleDelete(taskId: number) {
    if (!confirm("Delete this task?")) return
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Task deleted")
      mutate()
    } catch {
      toast.error("Failed to delete task")
    }
  }

  async function handleQuickStatus(taskId: number, newStatus: string) {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      })
      mutate()
    } catch {
      toast.error("Failed to update")
    }
  }

  async function handleAddComment(taskId: number) {
    const content = commentInputs[taskId]?.trim()
    if (!content) return
    try {
      await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content }),
      })
      setCommentInputs((prev) => ({ ...prev, [taskId]: "" }))
      mutate()
      toast.success("Comment added")
    } catch {
      toast.error("Failed to add comment")
    }
  }

  function TaskCard({ task }: { task: TaskItem }) {
    const isExpanded = expandedTask === task.id
    const canDelete = user?.role === "admin" || task.created_by === user?.userId

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {priorityIcon(task.priority)}
                <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {statusLabel(task.status)}
                {task.due_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {task.assignees.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.assignees.map((a) => (
                      <span
                        key={a.id}
                        className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold"
                        title={a.name}
                      >
                        {a.name?.charAt(0)?.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-3 w-3" />
                  {task.comments.length}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setEditTask(task)
                  setDialogOpen(true)
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="sr-only">Edit task</span>
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete task</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick status buttons */}
          <div className="flex gap-1 mt-3 pt-3 border-t border-border">
            {task.status !== "todo" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => handleQuickStatus(task.id, "todo")}
              >
                To Do
              </Button>
            )}
            {task.status !== "in_progress" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => handleQuickStatus(task.id, "in_progress")}
              >
                In Progress
              </Button>
            )}
            {task.status !== "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => handleQuickStatus(task.id, "completed")}
              >
                Done
              </Button>
            )}
          </div>

          {/* Comments */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-col gap-2 mb-3">
                {task.comments.length === 0 && (
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                )}
                {task.comments.map((c) => (
                  <div key={c.id} className="bg-secondary rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{c.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={commentInputs[task.id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                  }
                  placeholder="Add a comment..."
                  className="h-8 text-xs bg-secondary border-border text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment(task.id)
                  }}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => handleAddComment(task.id)}
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track team tasks.</p>
        </div>
        <Button
          onClick={() => {
            setEditTask(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="pl-10 bg-secondary border-border text-foreground"
        />
      </div>

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <TaskBoard
            tasks={filteredTasks}
            onStatusChange={handleQuickStatus}
            onEdit={(task) => {
              setEditTask(task)
              setDialogOpen(true)
            }}
            onDelete={handleDelete}
            currentUser={user}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">
                No tasks found. Create your first task!
              </p>
            ) : (
              filteredTasks.map((t) => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editTask}
        users={teamUsers}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
