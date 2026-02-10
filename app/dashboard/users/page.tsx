"use client"

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type UserItem = {
  id: number
  email: string
  name: string
  role: string
  status: string
  avatar_url: string
  last_active: string
  is_online: boolean
  created_at: string
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">Active</Badge>
    case "pending":
      return <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-0">Pending</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { data, mutate } = useSWR("/api/users", fetcher)

  const users: UserItem[] = data?.users || []
  const isAdmin = currentUser?.role === "admin"

  const pendingUsers = users.filter((u) => u.status === "pending")
  const activeUsers = users.filter((u) => u.status === "active")
  const otherUsers = users.filter((u) => u.status !== "active" && u.status !== "pending")

  async function handleAction(userId: number, action: string, role?: string) {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        action === "approve"
          ? "User approved"
          : action === "reject"
            ? "User rejected"
            : action === "change_role"
              ? "Role updated"
              : "User updated"
      )
      mutate()
    } catch {
      toast.error("Action failed")
    }
  }

  async function handleDelete(userId: number) {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error()
      toast.success("User deleted")
      mutate()
    } catch {
      toast.error("Delete failed")
    }
  }

  function UserRow({ u }: { u: UserItem }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 hover:bg-secondary/50 rounded-lg transition-colors gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
            </div>
            {u.is_online && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[hsl(var(--success))] border-2 border-card" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{u.name || "Unnamed"}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex items-center gap-2">
            {statusBadge(u.status)}
            <Badge variant="outline" className="text-muted-foreground capitalize hidden xs:inline-flex">
              {u.role}
            </Badge>
          </div>
          {isAdmin && u.id !== currentUser?.userId && (
            <div className="flex items-center gap-1">
              {u.status === "pending" && (
                <div className="flex items-center gap-1 mr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 pr-2 pl-2 text-[hsl(var(--success))] hover:text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
                    onClick={() => handleAction(u.id, "approve")}
                  >
                    <UserCheck className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Approve</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 pr-2 pl-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleAction(u.id, "reject")}
                  >
                    <UserX className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Reject</span>
                  </Button>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">User actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  {u.status === "pending" && (
                    <>
                      <DropdownMenuItem onClick={() => handleAction(u.id, "approve")} className="text-foreground">
                        <UserCheck className="h-4 w-4 mr-2 text-[hsl(var(--success))]" /> Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(u.id, "reject")} className="text-foreground">
                        <UserX className="h-4 w-4 mr-2 text-destructive" /> Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {u.status === "active" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleAction(u.id, "change_role", u.role === "admin" ? "member" : "admin")}
                        className="text-foreground"
                      >
                        {u.role === "admin" ? (
                          <><ShieldOff className="h-4 w-4 mr-2" /> Remove Admin</>
                        ) : (
                          <><Shield className="h-4 w-4 mr-2" /> Make Admin</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(u.id, "deactivate")} className="text-foreground">
                        <XCircle className="h-4 w-4 mr-2" /> Deactivate
                      </DropdownMenuItem>
                    </>
                  )}
                  {u.status === "inactive" && (
                    <DropdownMenuItem onClick={() => handleAction(u.id, "activate")} className="text-foreground">
                      <CheckCircle className="h-4 w-4 mr-2" /> Activate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(u.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-1">Manage your team members and access requests.</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="active">
            Active ({activeUsers.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending">
              Pending ({pendingUsers.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="other">
            Other ({otherUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activeUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">No active members</p>
                ) : (
                  activeUsers.map((u) => <UserRow key={u.id} u={u} />)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {pendingUsers.length === 0 ? (
                    <p className="text-muted-foreground text-sm p-6">No pending requests</p>
                  ) : (
                    pendingUsers.map((u) => <UserRow key={u.id} u={u} />)
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="other">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Rejected / Inactive Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {otherUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">No records</p>
                ) : (
                  otherUsers.map((u) => <UserRow key={u.id} u={u} />)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
